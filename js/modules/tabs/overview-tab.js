'use strict';

// Import dependencies
// Note: React and ReactDOM are expected to be global via popup.html script tags
import { createElement as h } from '../utils.js';
import { styles } from '../styles.js';
import { dataService } from '../data-service.js';
import { store } from '../store.js';
import { serverService } from '../services/server-service.js';

// Import components
import { WebsiteInformation } from '../components/WebsiteInformation.js';
import { SeoScoreCard } from '../components/SeoScoreCard.js';
import { CoreWebVitals } from '../components/CoreWebVitals.js';
import { ServerDetails } from '../components/ServerDetails.js';
import { ResponseDetails } from '../components/ResponseDetails.js';
import { ContentOverview } from '../components/ContentOverview.js';
import { IssuesSummary } from '../components/IssuesSummary.js';
import { OpenGraphTags } from '../components/OpenGraphTags.js';

// --- React Component ---
export const OverviewTab = ({ pageData }) => {
  // Use React hooks for state management within the component
  const [serverDetails, setServerDetails] = React.useState(null);
  const [isLoadingServerDetails, setIsLoadingServerDetails] = React.useState(false);
  const [serverDetailsError, setServerDetailsError] = React.useState(null);

  const currentUrl = pageData?.url;

  // Effect to load initial server details from store
  React.useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    if (currentUrl) {
      const savedDetails = serverService.getCachedServerDetails(currentUrl);

      if (isMounted) {
        if (savedDetails) {
          setServerDetails(savedDetails);
        } else {
          setServerDetails(null); // Reset if URL changes and no data found
        }
        setServerDetailsError(null); // Reset error on URL change
        setIsLoadingServerDetails(false); // Reset loading state
      }
    }
    return () => { isMounted = false; }; // Cleanup function
  }, [currentUrl]); // Rerun effect when URL changes

  // Function to handle fetching server details
  const handleFetchServerDetails = async () => {
    if (!currentUrl) return;
    setIsLoadingServerDetails(true);
    setServerDetailsError(null);

    try {
      const serverInfo = await serverService.fetchServerDetails(currentUrl);
      setServerDetails(serverInfo);
    } catch (error) {
      console.error('[OverviewTab] Error fetching server details:', error);
      setServerDetailsError(error.message || 'Connection error');
    } finally {
      setIsLoadingServerDetails(false);
    }
  };

  // --- Main Component Return ---
  const dataToRender = pageData || dataService.mockData; // Use latest pageData or fallback

  // Use React.createElement for the main structure
  return React.createElement('div', { style: styles.spaceY3 },
    // Website Information
    React.createElement(WebsiteInformation, { data: dataToRender }),

    // SEO Score
    React.createElement(SeoScoreCard, { data: dataToRender }),

    // Core Web Vitals and Issues Summary (side by side)
    React.createElement('div', { style: { display: 'flex', gap: '16px', marginTop: '16px' } },
      React.createElement(CoreWebVitals, { data: dataToRender }),
      React.createElement(IssuesSummary, { data: dataToRender })
    ),

    // Content Overview
    React.createElement(ContentOverview, { data: dataToRender }),

    // Response Details
    React.createElement(ResponseDetails, { data: dataToRender }),

    // Server Details
    React.createElement(ServerDetails, {
      data: dataToRender,
      serverDetails: serverDetails,
      isLoadingServerDetails: isLoadingServerDetails,
      serverDetailsError: serverDetailsError,
      onFetchServerDetails: handleFetchServerDetails
    }),

    // Open Graph Tags
    React.createElement(OpenGraphTags, { data: dataToRender })
  );
};

// No IIFE needed