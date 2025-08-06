# Changelog

All notable changes to the SEO AI Assistant extension will be documented in this file.

## [1.7.3] - 2025-04-13

### Changed
- Integrated SEO Score UI with extension's color scheme
  - Replaced greyscale colors with extension's blue/purple gradient theme
  - Matched card background with main application background
  - Added subtle gradient effects matching application style
  - Adjusted text colors to extension's existing palette
  - Harmonized progress bars with extension's visual language
  - Improved overall visual cohesion across all components

## [1.7.2] - 2025-04-13

### Changed
- Enhanced Structure & Linking scoring system for more accurate results
  - Implemented progressive scoring for internal links (1-5 points based on link count)
  - Implemented progressive scoring for external links (1-5 points based on link count)
  - Added tiered schema markup scoring based on number of schema items
  - Improved debug information with detailed scoring breakdown
  
- Improved SEO Score UI readability and contrast
  - Restored side-by-side layout with better balance
  - Enhanced text contrast with optimized background colors
  - Added percentage indicators with better visibility
  - Improved styling for total points display
  - Fixed progress bar display for more accurate visual representation

## [1.7.1] - 2025-04-13

### Fixed
- Fixed Structure & Linking score calculation in SEO scoring system
  - Improved data detection for internal and external links
  - Enhanced schema markup detection from multiple data sources
  - Added better compatibility with different data structures
  - Added debug logging for structure score components

### Changed
- Optimized SEO Score UI layout and design
  - Improved visual hierarchy and component placement
  - Added category icons (📝, ⚙️, 🔗) for better visual distinction
  - Enhanced progress bars with cleaner design
  - Added concise scoring explanation

## [1.7.0] - 2025-04-13

### Added
- Implemented comprehensive new SEO scoring system in Overview tab
  - Added Content Elements category (45 points) covering title, meta description, headings, and image alt attributes
  - Added Technical SEO category (40 points) covering HTTPS, mobile-friendly, canonical, robots, URL structure, and basic performance
  - Added Structure & Linking category (15 points) covering internal links, external links, and schema markup
  - Created detailed documentation on the scoring system (SEO-SCORE-UPDATE.md)

### Changed
- Enhanced SeoScoreCard component with more meaningful score breakdown
  - Replaced previous factor scores with the new scoring system
  - Added raw point scores alongside percentage scores
  - Improved visual presentation of category scores
  - Added explanatory text about the scoring system

## [1.6.0] - 2025-04-13

### Added
- Integrated Google PageSpeed Insights API into Performance tab
  - Added Mobile/Desktop strategy selection
  - Implemented advanced caching system to persist PageSpeed data
  - Added visual progress indicators during PageSpeed analysis
  - Created thresholds visualization for performance metrics
  - Added direct link to full PageSpeed Insights report

### Changed
- Redesigned Performance tab UI with improved layout and visual hierarchy
  - Enhanced Core Web Vitals display with threshold indicators
  - Improved visual scoring with circular progress indicator
  - Added clear metric labels with good/needs improvement/poor thresholds
  - Reorganized recommendations display for better readability
  - Improved data persistence between popup sessions

### Fixed
- Fixed performance metrics display when no data is available
- Improved retry logic and error handling for API requests
- Added helpful error messages with troubleshooting steps
- Enhanced PageSpeed data storage to persist between sessions

## [1.5.1] - 2025-04-12

### Fixed
- Fixed critical issue where extension data wouldn't update when clicking links or changing URLs
- Improved URL change detection to automatically refresh data when navigating to a new page
- Enhanced redirect chain preservation to maintain 301/302 redirect data while ensuring fresh content analysis
- Added better error handling for URL transitions to prevent data staleness
- Fixed race conditions in URL change detection for more reliable data updates

## [1.5.0] - 2025-04-08

### Added
- Improved Heading Structure component with filtering functionality
  - Added toggles for h1-h5 headings to filter heading display
  - Implemented checkbox-style toggle buttons for better UX
  - Added empty state display when no headings match active filters
- Accurate word count functionality that analyzes actual content rather than estimates
  - Detects main content area for more precise counting
  - Excludes script tags, navigation, and other non-content elements
  - Shows live count in the Content Tab

### Changed
- Enhanced heading display to preserve document order instead of sorting by heading level
- Improved DomUtils.getHeadings() to capture headings in original document order
- Updated SeoExtractor to include position information for headings
- Refactored Content tab to use the new HeadingStructure component

### Fixed
- Fixed heading structure analysis to correctly identify structure issues based on document order
- Improved handling of headings data to maintain compatibility with existing code
- Fixed incorrect "Lower-level headings found before H1" warning by only flagging when H2-H6 appear before the first H1, not just any heading
- Made heading structure issue messages more descriptive and helpful
- Added detailed information about which heading levels are skipped (e.g., from H3 to H5) with specific examples

## [1.4.0] - 2025-04-08

### Added
- Enhanced hover effect for Export button with format options
- Direct Check Status button in Turbo mode toggle section

### Changed
- Removed Link Analysis section to streamline interface (feature duplicate with Distribution Link)
- Simplified status codes display - showing only the code without extra text
- Fixed "ERR" display for error states (removed duplicate "err:err:enoferror" text)
- Improved filter by status functionality with better state management
- Filtered out links with hash fragments (#) to reduce clutter
- Redesigned Export button UI/UX with improved hover interaction
- Renamed "Using Vercel API" to general "Using API" in Turbo mode description
- Relocated Export function to table header area for better visual hierarchy
- Enhanced button states and visual feedback during link checking

### Fixed
- Filter by status now properly updates and maintains selected state
- Check Link status button properly resets after completing check
- Export button format options now display correctly without positioning issues
- Fixed link table refresh when status filter changes

## [1.3.0] - 2023-06-10

### Added
- Multi-format export functionality
  - Added CSV export option for link data
  - Implemented dropdown menu for export format selection
  - Added visual icons for different export formats
- Hierarchical status code organization in filters
  - Implemented indentation for subcategories
  - Grouped status codes by type (3xx, 4xx, 5xx)
  - Added visual separation between groups
- Timeout handling for link checking
  - Added 10-second timeout for individual link checks
  - Implemented recovery mechanism for timed-out requests

### Fixed
- Resolved issue with individual link checking mode not updating UI
- Fixed filter positioning for better usability
- Improved export functionality to only include filtered links
- Removed numeric counts from major headings in issues list

### Changed
- Improved UI for status filters with better visual hierarchy
- Enhanced error handling throughout link checking process
- Optimized batch processing for more reliable results
- Updated documentation with new features and improvements

## [1.2.0] - 2023-05-15

### Added
- New link status filtering system
  - Filter by HTTP status code (200, 301, 302, 404, etc.)
  - Filter by status code groups (3xx, 4xx, 5xx)
  - Visual indicators for active filters
  - Integration with export functionality
- Enhanced progress indicators for link checking
- Improved error handling and recovery for link checking

### Fixed
- Fixed issue with individual link checking mode where loading indicators would not stop
- Fixed timeout errors in link checking process
- Improved progress tracking in turbo mode
- Fixed batch processing in link checker service

### Changed
- Refactored link checking process for better reliability
- Improved UI feedback during link checking operations
- Enhanced error handling throughout the application
- Updated README with new features and architecture details

## [1.1.0] - 2023-04-20

### Added
- Webpack bundling for improved performance and code organization
- New link checking service with turbo mode
- Enhanced error handling and recovery mechanisms
- Improved progress indicators for long-running operations

### Changed
- Refactored background script into specialized controllers and services
- Improved modular organization of code
- Enhanced state management
- Updated documentation

## [1.0.0] - 2023-03-15

### Added
- Initial release of refactored SEO AI Assistant
- Component-based architecture for UI elements
- Service layer for business logic
- Improved SPA detection
- Enhanced data management
- Standardized messaging system
