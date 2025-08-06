# PageSpeed Insights API Key Setup

## Security Notice
The PageSpeed Insights API key has been removed from the codebase for security reasons. The extension will work without an API key but with rate limits.

## How to Add Your API Key

### Option 1: Chrome Storage (Recommended for Development)
1. Open the Chrome DevTools Console on any page with the extension loaded
2. Run this command:
   ```javascript
   chrome.storage.local.set({ pagespeedApiKey: 'YOUR_API_KEY_HERE' })
   ```

### Option 2: Extension Options Page (Future Implementation)
A settings page can be added to allow users to input their own API key.

## Getting an API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the PageSpeed Insights API
4. Create credentials (API Key)
5. Optionally restrict the key to specific referrers

## Rate Limits
- Without API key: 25,000 queries per day
- With API key: 25,000 queries per day per key

## Important
- Never commit API keys to version control
- Each user should use their own API key
- Consider implementing a server-side proxy for production use