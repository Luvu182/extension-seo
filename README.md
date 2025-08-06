# SEO AI Assistant

Chrome extension for comprehensive SEO analysis with AI-powered recommendations.

## Features

- Meta tags analysis
- Core Web Vitals monitoring
- Link analysis and status checking
- Schema markup detection
- AI-powered SEO recommendations
- PageSpeed Insights integration

## Quick Start

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Development mode (auto-rebuild)
npm run dev
```

## Installation

1. Build: `npm run build`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `dist` folder

## Tech Stack

- **Vite** - Fast build tool
- **React 18** - UI framework
- **Chrome Extension Manifest V3**

## Project Structure

```
├── src/          # Background & content scripts
├── js/           # Popup UI (React components)
├── dist/         # Build output (load this in Chrome)
└── docs/         # Additional documentation
```

## Development

- Edit files → `npm run dev` auto-rebuilds
- Reload extension in Chrome after changes
- Check console for debugging:
  - Background: Service Worker logs
  - Content: Web page console
  - Popup: Right-click → Inspect

## License

Proprietary - Powered by SEOONTOP