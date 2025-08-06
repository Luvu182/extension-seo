# SEO AI Assistant (Refactored)

An advanced Chrome extension providing comprehensive SEO analysis and AI-powered recommendations for web pages. This refactored version is designed for better maintainability, performance, and extensibility.

## Features

* **Overview Tab:** Displays an overall SEO score, website health checks, Core Web Vitals, issues summary, content overview, response details, server information, and OpenGraph tags.
* **Schema Tab:** Analyzes and displays structured data (JSON-LD, Microdata, RDFa) found on the page.
* **Links Tab:**
  * Shows counts of internal, external, and nofollow links with distribution visualization
  * Provides link status checking in both standard and turbo modes
  * Supports filtering links by HTTP status codes (200, 3xx, 4xx, 5xx) with hierarchical organization
  * Allows exporting link data in both JSON and CSV formats with filtered results
* **Performance Tab:** Analyzes page performance with Core Web Vitals (LCP, FID, CLS), Time to First Byte (TTFB), and integrates with Google PageSpeed Insights API to provide detailed performance analysis and recommendations.
* **Content Tab:** Analyzes page title, meta description, heading structure (H1-H6), and provides content-related recommendations.
* **Issues Tab:** Summarizes and lists critical SEO issues, warnings, and suggestions detected on the page.
* **AI Tab:** Provides AI-generated SEO suggestions (powered by Claude AI).
* **Settings Tab:** Allows configuration of app settings and API keys.

## Recent Updates

### PageSpeed Insights Integration (April 2025)

* **Google PageSpeed Insights API Integration:**
  * Added API integration to analyze webpage performance using Google's powerful tools
  * Implemented mobile/desktop strategy selection for targeted analysis
  * Added visual indicators for performance score and metrics
  * Created thresholds visualization for Core Web Vitals and TTFB
  * Added detailed improvement recommendations from PageSpeed Insights

* **Enhanced Performance Metrics UI:**
  * Redesigned Core Web Vitals display with clear thresholds
  * Added circular progress indicator for performance score
  * Implemented visual breakdown of good/needs improvement/poor thresholds
  * Improved organization of performance metrics and recommendations
  * Enhanced metrics display with better visual hierarchy

* **Advanced Data Persistence:**
  * Implemented two-tier caching system for PageSpeed data
  * Added browser storage integration to preserve data between sessions
  * Built URL-specific caching to prevent unnecessary re-analysis
  * Enhanced error handling with retry logic and helpful messages
  * Added progressive loading indicators for better UX during analysis

### Link Checking and UI Enhancements (June 2023)

* **Improved Link Status Checking:**
  * Fixed issues with individual link checking mode
  * Enhanced batch processing with better error handling
  * Added visual progress indicators for link checking
  * Implemented sequential processing to prevent UI freezing
  * Added timeout handling to prevent stuck requests

* **Enhanced Link Filtering System:**
  * Added ability to filter links by HTTP status codes
  * Implemented hierarchical status code organization
  * Added indentation for subcategories in status filters
  * Enhanced UI with visual indicators for active filters
  * Improved filter positioning for better usability

* **Advanced Export Options:**
  * Added support for exporting in CSV format
  * Implemented dropdown menu for export format selection
  * Ensured export only includes currently filtered links
  * Added visual icons for different export formats

### Background Script Refactoring (April 2023)

The background script has been completely refactored to improve maintainability and performance:

* Split the monolithic background.js into specialized controllers and services
* Implemented proper separation of concerns with Single Responsibility Principle
* Enhanced error handling and logging throughout the codebase
* Improved memory management and resource cleanup
* Added new specialized services for Web Vitals, Server Info, and Link Checking
* Optimized messaging system between components

## Architecture

### Modular Design

The refactored extension follows a modular, maintainable architecture:

* **MVC Pattern:** Separates data models, view components, and controllers
* **Module-Based Organization:** Code is organized into logical modules with clear responsibilities
* **Component-Based UI:** UI elements are broken down into reusable React components
* **Service Layer:** Business logic is extracted into dedicated service modules
* **Improved SPA Detection:** Better detection and handling of Single Page Applications
* **Enhanced Performance:** Optimized data processing and storage
* **TypedScript-like Approach:** Improved code documentation and organization even in JavaScript

### Directory Structure

```
extension-main/
  ├── dist/                         # Compiled output (generated by webpack)
  ├── src/                          # Source code directory
  │   ├── background/               # Background script modules
  │   │   ├── controllers/          # Background controllers
  │   │   │   ├── message-controller.js      # Message dispatching
  │   │   │   ├── navigation-controller.js   # Tab/navigation events
  │   │   │   ├── web-request-controller.js  # HTTP requests
  │   │   │   ├── seo-data-controller.js     # SEO data management
  │   │   │   ├── spa-navigation-controller.js  # SPA detection
  │   │   │   ├── web-vitals-controller.js   # Web Vitals tracking
  │   │   │   ├── server-info-controller.js  # Server information
  │   │   │   ├── link-checker-controller.js # Link status checking
  │   │   │   └── tab-controller.js          # Tab management
  │   │   ├── services/             # Background services
  │   │   │   ├── cleanup-service.js         # Memory management
  │   │   │   ├── storage-service.js         # Data storage
  │   │   │   ├── web-vitals-service.js      # Web Vitals analysis
  │   │   │   ├── server-info-service.js     # Server details
  │   │   │   ├── link-checker-service.js    # Link status checking
  │   │   │   ├── vercel-link-service.js     # Optimized link checking API
  │   │   │   └── messaging-service.js       # Inter-component messaging
  │   │   └── background.js         # Main background entry point
  │   ├── content/                  # Content script modules
  │   │   ├── analyzers/            # Analysis modules
  │   │   ├── detectors/            # Detection modules
  │   │   ├── extractors/           # Data extraction
  │   │   ├── utils/                # Content utilities
  │   │   ├── content-controller.js # Content script controller
  │   │   └── content.js            # Main content entry point
  │   └── shared/                   # Shared utilities
  │       ├── utils/                # Utility modules
  │       │   ├── logger.js         # Enhanced logging
  │       │   └── messaging.js      # Message passing
  │       └── constants.js          # Shared constants
  ├── css/                          # CSS styles
  ├── images/                       # Icons and images
  ├── js/                           # JavaScript code
  │   ├── modules/                  # Modular JavaScript components
  │   │   ├── components/           # Reusable UI components
  │   │   │   ├── App.js            # Main app component
  │   │   │   ├── Header.js         # Header component
  │   │   │   ├── SerpPreview.js    # SERP preview component
  │   │   │   ├── NavTabs.js        # Navigation tabs component
  │   │   │   ├── Footer.js         # Footer component
  │   │   │   ├── links/            # Links tab components
  │   │   │   │   ├── LinkCountCards.js     # Link count cards component
  │   │   │   │   ├── LinkDistribution.js   # Link distribution chart component
  │   │   │   │   ├── LinkAnalysisTable.js  # Link analysis table component
  │   │   │   │   ├── LinkStatusChecker.js  # Link status checker component
  │   │   │   │   ├── LinkTable.js          # Link table component
  │   │   │   │   ├── LinkExportButton.js   # Link export button component
  │   │   │   │   ├── LinkIssuesTable.js    # Link issues table component
  │   │   │   │   └── LinkStatusFilter.js   # Link status filter component
  │   │   │   └── status/           # Status display components
  │   │   ├── services/             # Business logic services
  │   │   │   ├── data-fetching-service.js # Data fetching service
  │   │   │   ├── navigation-service.js    # Navigation and tab switching
  │   │   │   ├── server-service.js        # Server details service
  │   │   │   ├── performance-service.js   # Performance metrics and PageSpeed Insights API service
  │   │   │   └── link-service.js          # Link status and export service
  │   │   ├── tabs/                 # Tab-specific modules
  │   │   │   ├── overview-tab.js      # Overview tab component
  │   │   │   ├── structured-tab.js    # Structured data tab component
  │   │   │   ├── links-tab.js         # Links tab component
  │   │   │   ├── performance-tab.js   # Performance tab component
  │   │   │   ├── content-tab.js       # Content tab component
  │   │   │   ├── issues-tab.js        # Issues tab component
  │   │   │   ├── ai-tab.js            # AI tab component
  │   │   │   └── settings-tab.js      # Settings tab component
  │   │   ├── data-service.js       # Data processing service
  │   │   ├── store.js              # State management
  │   │   ├── styles.js             # UI styles
  │   │   └── utils.js              # Utility functions
  │   ├── lib/                      # Third-party libraries
  │   ├── background.js             # Background script entry point
  │   ├── content.js                # Content script entry point
  │   └── popup.js                  # Popup script entry point
  ├── manifest.json                 # Extension manifest
  ├── popup.html                    # Popup HTML
  ├── webpack.config.cjs            # Webpack configuration
  └── package.json                  # NPM package configuration
```

## Installation

1. Clone the repository or download the source code
2. Install dependencies with `npm install`
3. Build the extension with `npm run build`
4. Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `extension-main` directory

## Development

### Key Technical Improvements

1. **Component-Based Architecture:**
   * UI elements broken down into reusable components
   * Single Responsibility Principle applied to each component
   * Improved code organization and maintainability

2. **Service Layer Implementation:**
   * Business logic extracted into dedicated service modules
   * Separation of concerns between data fetching and presentation
   * Improved testability and reusability

3. **Improved Messaging:**
   * Standardized message format
   * Enhanced error handling
   * Better async/await support

4. **Enhanced Data Management:**
   * Consistent data models
   * Better caching and storage strategies
   * Improved memory management

5. **SPA Support:**
   * More accurate SPA detection
   * Better handling of URL changes
   * Improved DOM change detection

6. **Performance Optimization:**
   * Reduced duplicate code
   * More efficient data processing
   * Better resource cleanup

7. **Background Architecture:**
   * Modular controller-based approach
   * Specialized services for each functionality domain
   * Improved message dispatching system
   * Better error handling and recovery mechanisms

### Adding New Features

To add new features:

1. Identify the appropriate module for your feature
2. Create new service/controller/component files as needed
3. Update the relevant entry point files
4. Register any new message handlers
5. Build the extension with `npm run build`

## Link Status Checking

The extension provides two modes for checking link statuses:

### Standard Mode
- Processes links sequentially to avoid overwhelming the browser
- Shows real-time status updates for each link
- Provides detailed error information for failed requests
- Includes timeout handling to prevent stuck requests
- Suitable for smaller numbers of links or when detailed progress is needed

### Turbo Mode
- Uses an optimized API to check multiple links simultaneously
- Significantly faster for large numbers of links
- Processes links in batches with progress indicators
- Recommended for pages with many links

### Link Filtering
- Filter links by HTTP status code (200, 301, 302, 404, etc.)
- Filter by status code groups (3xx, 4xx, 5xx)
- Hierarchical organization with indented subcategories
- Combine with tab filters (All, Internal, External, Nofollow)
- Visual indicators for active filters
- Positioned for optimal usability

### Export Options
- Export filtered links in JSON format (with full metadata)
- Export filtered links in CSV format (for spreadsheet analysis)
- Export only currently filtered links
- Dropdown menu for format selection
- Visual icons for different export formats

## Roadmap

* **Completed:**
  * Refactored background.js into specialized controllers and services
  * Refactored overview-tab.js into smaller, reusable components
  * Refactored performance-tab.js into smaller, reusable components
  * Refactored links-tab.js into smaller, reusable components
  * Implemented link status checking with standard and turbo modes
  * Added hierarchical link filtering by HTTP status codes
  * Implemented multi-format export options (JSON and CSV)
  * Improved UI for link filtering and export functionality
  * Enhanced error handling with timeout detection
  * Refactored popup.js into components and services
  * Created component-based architecture for UI elements
  * Implemented service layer for business logic
  * Improved modular organization of code
  * Enhanced error handling and logging
  * Implemented webpack bundling for production

* **In Progress:**
  * Continue refactoring remaining tab modules using the same approach
  * Enhancing state management with React Context API
  * Improving error recovery mechanisms

* **Upcoming:**
  * Complete migration of popup UI to React component architecture
  * Add unit and integration tests
  * Implement TypeScript
  * Add more AI-powered analysis features
  * Enhance link analysis with more detailed metrics

## License

This project is proprietary and confidential. All rights reserved.
