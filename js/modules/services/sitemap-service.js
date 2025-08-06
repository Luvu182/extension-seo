'use strict';

/**
 * Service for interacting with sitemap data
 */
export const sitemapService = {
  /**
   * Find sitemap for a URL
   * @param {string} url - The URL to check
   * @returns {Promise<Object>} - The sitemap data
   */
  async findSitemap(url) {
    try {
      console.log('[sitemapService] Finding sitemap for URL:', url);
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'findSitemap',
          url: url
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to find sitemap');
      }
      
      return response.sitemapData;
    } catch (error) {
      console.error('[sitemapService] Error finding sitemap:', error);
      throw error;
    }
  }
};
