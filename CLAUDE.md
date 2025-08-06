# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SEO AI Assistant is a Chrome extension providing comprehensive SEO analysis with AI-powered recommendations. Built with Vite, React, and modern JavaScript for optimal performance.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development mode (auto-rebuild on file changes)
npm run dev

# Production build
npm run build

# Linting
npm run lint
npm run lint:fix
```

## Architecture Overview

### Chrome Extension Structure (Manifest V3)

The extension consists of three main entry points:
- **Background Service Worker** (`src/background/background.js`) - Manages extension lifecycle and message routing
- **Content Script** (`src/content/content.js`) - Runs on web pages to extract SEO data
- **Popup UI** (`js/popup.js`) - React-based interface using createElement syntax

### Build System

- **Vite** with CRXJS plugin for fast builds and HMR support
- **React 18** bundled into the extension (no external dependencies)
- **ES Modules** throughout the codebase

### Message Flow

1. **Content → Background**: SEO data extraction via chrome.runtime.sendMessage
2. **Background → Storage**: Data persistence with tab-specific keys
3. **Popup → Background**: Data requests and command execution
4. **Background → All**: Broadcast updates when data changes

### Key Services

**Background Services:**
- `StorageService`: Chrome storage management with caching
- `WebVitalsService`: Core Web Vitals measurement
- `LinkCheckerService`: Link validation with rate limiting
- `ServerInfoService`: HTTP header analysis
- `MessagingService`: Inter-component communication

**Background Controllers:**
- `MessageController`: Central message routing
- `NavigationController`: Tab and URL change monitoring
- `SpaNavigationController`: SPA detection
- `WebRequestController`: HTTP request interception
- `SeoDataController`: SEO data management

### Component Architecture

The popup UI uses React without JSX:
- **Components**: `js/modules/components/`
- **Tabs**: `js/modules/tabs/`
- **Services**: `js/modules/services/`

## Common Development Tasks

### Adding a New SEO Check

1. Add extraction logic to `src/content/extractors/seo-extractor.js`
2. Update message types in `src/shared/constants.js` if needed
3. Add handler in appropriate background controller
4. Update UI component to display new data

### Adding a New Tab

1. Create component in `js/modules/tabs/[name]-tab.js`
2. Add tab constant to `src/shared/constants.js`
3. Update navigation in `js/modules/services/navigation-service.js`
4. Add tab button to `js/modules/components/NavTabs.js`

### Debugging

- Background logs: chrome://extensions → Service Worker → Inspect
- Content logs: Browser console on the web page
- Popup logs: Right-click extension icon → Inspect

## Code Style

- ES6 modules with explicit imports/exports
- No TypeScript (pure JavaScript)
- React without JSX (createElement pattern)
- Comprehensive error handling with try-catch
- Logging via the logger utility

## Testing Link Checker

Two modes available:
- **Standard Mode**: Sequential checking with progress
- **Turbo Mode**: Batch API checking via Vercel service

## Performance Notes

- Tab-specific data cleaned on tab close
- Link checker implements rate limiting
- Web Vitals uses injected scripts for CSP compliance
- Storage service includes data compression

## Directory Structure

```
seo-ai-assistant/
├── dist/               # Build output (git ignored)
├── src/                # Source code
│   ├── background/     # Service worker modules
│   ├── content/        # Content script modules
│   └── shared/         # Shared utilities
├── js/                 # Popup UI code
│   ├── modules/        # React components
│   └── popup.js        # Entry point
├── css/                # Styles
├── images/             # Icons
└── docs/               # Documentation
```

## Important Notes

- Always use `npm run build` before loading in Chrome
- The `dist` folder contains the runnable extension
- React is bundled, no need for CDN links
- Vite handles all bundling and optimization