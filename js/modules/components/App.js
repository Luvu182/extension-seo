'use strict';

// Import core modules
import { store } from '../store.js';
import { styles } from '../styles.js';

// Import services
import { dataFetchingService } from '../services/data-fetching-service.js';
import { navigationService } from '../services/navigation-service.js';

// Import React components
import { Header } from './Header.js';
import { SerpPreview } from './SerpPreview.js';
import { NavTabs } from './NavTabs.js';
import { Footer } from './Footer.js';

// Import status components
import { LoadingDisplay } from './status/LoadingDisplay.js';
import { NetworkErrorDisplay } from './status/NetworkErrorDisplay.js';
import { SpaNavigationDisplay } from './status/SpaNavigationDisplay.js';

// Import tab components
import { OverviewTab } from '../tabs/overview-tab.js';
import { StructuredTab } from '../tabs/structured-tab.js';
import { LinksTab } from '../tabs/links-tab.js';
import { PerformanceTab } from '../tabs/performance-tab.js';
import { ContentTab } from '../tabs/content-tab.js';
import { IssuesTab } from '../tabs/issues-tab.js';
import { AiTab } from '../tabs/ai-tab.js';
import { SettingsTab } from '../tabs/settings-tab.js';

/**
 * Main App component for the extension popup
 * Orchestrates all other components and manages application state
 * 
 * @returns {React.Element} The main app component
 */
export const App = () => {
  // Map tab IDs to their actual React components
  const tabComponents = {
    overview: OverviewTab,
    structured: StructuredTab,
    links: LinksTab,
    performance: PerformanceTab,
    content: ContentTab,
    issues: IssuesTab,
    ai: AiTab,
    settings: SettingsTab,
  };

  // State for active tab, page data, and loading status (derived from store)
  const [activeTab, setActiveTab] = React.useState(
    store.getStateSlice('activeTab') || navigationService.getLastActiveTab() || 'overview'
  );
  const [pageData, setPageData] = React.useState(store.getStateSlice('pageData'));
  const [isLoading, setIsLoading] = React.useState(store.getStateSlice('isLoading') ?? !pageData); // Initialize from store or based on pageData

  // Effect to subscribe to store changes and update local state
  React.useEffect(() => {
    const handleStoreUpdate = (newState) => {
      console.log('[App Component] Store updated');
      const newActiveTab = newState.activeTab;
      const newPageData = newState.pageData;
      const newIsLoading = newState.isLoading;

      // Check for URL changes that require refresh
      if (newPageData && newPageData.urlChanged && newPageData.needsRefresh) {
        console.log('[App Component] URL change detected, triggering auto-refresh');
        
        // Skip other state updates and go straight to refresh
        setIsLoading(true); 
        
        // Delay slightly to allow UI to update
        setTimeout(() => {
          dataFetchingService.refreshData();
        }, 100);
        
        return; // Skip other state updates
      }

      // Update local state only if the corresponding store slice has changed
      if (newActiveTab !== activeTab) {
        console.log('[App Component] Active tab changed in store:', newActiveTab);
        setActiveTab(newActiveTab);
      }
      if (newIsLoading !== isLoading) {
        console.log('[App Component] isLoading changed in store:', newIsLoading);
        setIsLoading(newIsLoading);
      }
      // Use stringify for simple comparison, consider a deep-equal function for complex objects if needed
      if (JSON.stringify(newPageData) !== JSON.stringify(pageData)) {
        console.log('[App Component] Page data changed in store');
        setPageData(newPageData);
      }
    };

    // Request latest web vitals data when popup opens
    // This ensures we have the most up-to-date data without waiting for a new measurement
    dataFetchingService.requestLatestWebVitals();

    // Add a message listener to handle real-time Web Vitals updates
    const handleWebVitalsUpdate = (message, sender, sendResponse) => {
      // Handle ping requests from background script
      if (message.action === "ping") {
        console.log('[App Component] Received ping from background script');
        if (sendResponse) {
          sendResponse({ success: true, from: 'popup' });
        }
        return true;
      }

      // Handle web vitals updates
      if (message.action === "webVitalsUpdated" && message.webVitals) {
        console.log('[App Component] Received Web Vitals update:', message.webVitals, 'timestamp:', message.timestamp);

        // Always update regardless of current page data state
        try {
          // Get current data from store to ensure we have the latest
          const currentStoreData = store.getStateSlice('pageData') || {};

          // Create a new object for the update
          const updatedPageData = {...currentStoreData};

          // Make sure webVitals property exists
          if (!updatedPageData.webVitals) {
            updatedPageData.webVitals = {};
          }

          // Update the webVitals with the new data
          updatedPageData.webVitals = {
            ...updatedPageData.webVitals,
            ...message.webVitals,
            lastUpdated: message.timestamp || Date.now() // Track when this update happened
          };

          console.log('[App Component] Updating UI with new Web Vitals');

          // IMPORTANT: Preserve SPA detection flags if they exist
          if (currentStoreData.isSpaDetected || currentStoreData.isSpaNavigation) {
            console.log('[App Component] Preserving SPA detection flags during web vitals update');
            updatedPageData.isSpaDetected = currentStoreData.isSpaDetected;
            updatedPageData.isSpaNavigation = currentStoreData.isSpaNavigation;
          }

          // Force update the store
          store.setStateSlice('pageData', updatedPageData);

          // Force update the local state to trigger re-render
          setPageData(updatedPageData);

          // Only update loading state if we're not in SPA detection mode
          if (!updatedPageData.isSpaDetected && !updatedPageData.isSpaNavigation) {
            setIsLoading(false);
          }
        } catch (updateError) {
          console.error('[App Component] Error updating web vitals:', updateError);
        }

        if (sendResponse) {
          sendResponse({ success: true, received: true, timestamp: Date.now() });
        }
        return true; // Keep message channel open for async response
      }
      return false; // Not handled
    };

    // Add the message listener
    chrome.runtime.onMessage.addListener(handleWebVitalsUpdate);

    // Custom event handler for SPA navigation "Continue to Analysis" button
    const handleSpaNavigationComplete = () => {
      console.log('[App Component] SPA navigation complete event received');
      // Use navigation service to complete SPA navigation
      navigationService.completeSpaNavigation();
    };

    // Add event listener for SPA navigation complete
    document.addEventListener('spaNavigationComplete', handleSpaNavigationComplete);

    // Subscribe to store updates
    const unsubscribe = store.subscribe(handleStoreUpdate);

    // Initial data fetch if pageData is initially null or undefined
    // OR if the store indicates it's loading (e.g., after navigation invalidation)
    if (pageData === null || pageData === undefined || store.getStateSlice('isLoading')) {
      console.log('[App Component] Initial load or missing/loading data, ensuring loading state and fetching...');
      // Ensure store reflects loading state before fetching
      if (!store.getStateSlice('isLoading')) {
          store.setStateSlice('isLoading', true);
      }
      setIsLoading(true); // Update local state immediately
      dataFetchingService.loadDataFromBackgroundOrFallback(); // Fetch data
    }

    // Cleanup subscription on unmount
    return () => {
      console.log('[App Component] Unsubscribing from store');
      document.removeEventListener('spaNavigationComplete', handleSpaNavigationComplete);
      chrome.runtime.onMessage.removeListener(handleWebVitalsUpdate);
      unsubscribe();
    };
  }, [activeTab]); // Re-run effect if activeTab changes

  /**
   * Function to handle tab switching with animation
   * @param {string} tabId - ID of the tab to switch to
   */
  const switchTabWithAnimationHandler = (tabId) => {
    if (tabId === activeTab) return;

    console.log(`[App Component] Switching tab to ${tabId} with animation`);
    navigationService.switchTab(tabId, true);
    navigationService.saveLastActiveTab(tabId);
  };

  /**
   * Function to handle tab switching without animation
   * @param {string} tabId - ID of the tab to switch to
   */
  const switchTabHandler = (tabId) => {
    console.log(`[App Component] Switching tab (no animation) to ${tabId}`);
    navigationService.switchTab(tabId, false);
    navigationService.saveLastActiveTab(tabId);
  };

  /**
   * Function to handle data refresh
   */
  const refreshDataHandler = () => {
    console.log('[App Component] Refresh triggered');
    // Set loading state in store and locally
    store.setStateSlice('isLoading', true);
    setIsLoading(true);
    dataFetchingService.refreshData(); // Call the service function
  };

  // Determine which tab component to render
  const ActiveTabComponent = tabComponents[activeTab] || (() => 
    React.createElement('div', null, `Unknown tab: ${activeTab}`)
  );

  return React.createElement('div', 
    { style: styles.container },
    // Header
    React.createElement(Header, { 
      onRefresh: refreshDataHandler, 
      onSwitchTab: switchTabHandler, 
      isLoading: isLoading 
    }),
    
    // SERP Preview
    React.createElement(SerpPreview, { 
      pageData: pageData, 
      isLoading: isLoading 
    }),
    
    // Navigation Tabs
    React.createElement(NavTabs, { 
      activeTab: activeTab, 
      onSwitchTab: switchTabWithAnimationHandler 
    }),
    
    // Content Area
    React.createElement('div', 
      { style: styles.contentArea },
      // Show loading indicator if isLoading is true
      isLoading
        ? React.createElement(LoadingDisplay)
        : pageData?.statusCode === 0 // Check for network error status code
          ? React.createElement(NetworkErrorDisplay) // Show network error component
          : pageData?.isSpaDetected || pageData?.isSpaNavigation // Check for any SPA flag
            ? React.createElement(SpaNavigationDisplay, { 
                onRefresh: refreshDataHandler, 
                pageData: pageData 
              }) // Show SPA-specific message
            : pageData?.error // Check for other generic error types
              ? React.createElement(NetworkErrorDisplay, { 
                  message: pageData.error || 'Error loading page data' 
                })
              : !pageData // Handle case where data is null/undefined after loading finishes
                ? React.createElement(NetworkErrorDisplay, {
                    message: 'Không tìm thấy dữ liệu, vui lòng làm mới trang'
                  })
                // Render normal tab if data is valid
                : React.createElement(ActiveTabComponent, { 
                    pageData: pageData, 
                    tabName: activeTab 
                  })
    ),
    
    // Footer
    React.createElement(Footer)
  );
};
