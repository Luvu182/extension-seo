'use strict';

import { logger } from '../../shared/utils/logger.js';
import { DomUtils } from '../utils/dom-utils.js';

/**
 * Service for extracting SEO data from the page
 */
export class SeoExtractor {
  /**
   * Wait for page to be ready before extracting data
   * @returns {Promise<void>}
   */
  static async waitForPageReady() {
    logger.info('SeoExtractor', 'Waiting for page to be ready...');
    
    const maxWaitTime = 5000; // 5 seconds max
    const checkInterval = 100; // Check every 100ms
    const startTime = Date.now();
    
    // Helper to check if page has meaningful content
    const hasContent = () => {
      // Check for title
      const title = document.title;
      if (!title || title === 'Loading...' || title === '' || title === 'Document') {
        return false;
      }
      
      // Check for body content
      const bodyText = document.body?.textContent?.trim() || '';
      if (bodyText.length < 100) {
        return false;
      }
      
      // Check for main content elements
      const hasMainContent = !!(
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('#content') ||
        document.querySelector('.content')
      );
      
      // Check for headings
      const hasHeadings = document.querySelectorAll('h1, h2, h3').length > 0;
      
      return hasMainContent || hasHeadings;
    };
    
    // Wait for DOM to be ready and content to load
    while (Date.now() - startTime < maxWaitTime) {
      // Check if document is ready
      if (document.readyState === 'complete') {
        // Check if page has meaningful content
        if (hasContent()) {
          logger.info('SeoExtractor', 'Page appears ready with content');
          // Wait a bit more for any async content
          await new Promise(resolve => setTimeout(resolve, 200));
          return;
        }
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    // If we've waited max time, check one more time
    if (hasContent()) {
      logger.info('SeoExtractor', 'Page ready after max wait time');
    } else {
      logger.warn('SeoExtractor', 'Page may not be fully loaded after 5s wait');
    }
  }
  
  /**
   * Extract SEO data from the current page.
   * This function gathers various SEO-related information from the DOM.
   * @returns {Promise<Object>} The extracted SEO data object.
   */
  static async extractPageSEOData() {
    logger.info('SeoExtractor', 'Extracting SEO data...');

    try {
      // Wait for page to be ready before extracting
      await this.waitForPageReady();
      
      // --- Basic Page Info ---
      const url = window.location.href;
      
      // Get title with better fallback logic
      let title = document.title || '';
      
      // If still no title or generic loading title, try alternatives
      if (!title || title === 'Loading...' || title === '' || title === 'Document') {
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
        const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.content;
        const h1 = document.querySelector('h1')?.textContent?.trim();
        const h2 = document.querySelector('h2')?.textContent?.trim();
        
        title = ogTitle || twitterTitle || h1 || h2 || 'No Title found';
        
        if (title === 'No Title found') {
          logger.warn('SeoExtractor', 'No title found in any location');
        } else {
          logger.info('SeoExtractor', `Title found using fallback: ${title}`);
        }
      }
      
      const description = DomUtils.getMetaDescription(); // Use DomUtils

      // --- Robots Meta Tag ---
      const robotsTag = document.querySelector('meta[name="robots"]');
      const robotsContent = robotsTag?.getAttribute('content') || '';
      const isNoindex = robotsContent.toLowerCase().includes('noindex');
      const isNofollow = robotsContent.toLowerCase().includes('nofollow');
      const isIndexable = !isNoindex;
      const isFollowable = !isNofollow;

      // --- Canonical URL ---
      const canonicalTag = document.querySelector('link[rel="canonical"]');
      const canonicalUrl = canonicalTag?.getAttribute('href') || '';
      let canonicalValid = false;
      if (canonicalUrl) {
        try {
          new URL(canonicalUrl); // Validate URL format
          canonicalValid = canonicalUrl.startsWith('http://') || canonicalUrl.startsWith('https://');
          // Optional: Add check if canonical matches current URL (can be noisy)
        } catch (e) {
          logger.warn('SeoExtractor', `Invalid canonical URL found: ${canonicalUrl}`, e);
        }
      }

      // --- Mobile Friendliness ---
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const viewportContent = viewportMeta?.getAttribute('content') || '';
      const hasMobileViewport = viewportContent.includes('width=device-width');

      // --- OpenGraph Tags ---
      const openGraphTags = {};
      const ogMetaTags = document.querySelectorAll('meta[property^="og:"]');
      ogMetaTags.forEach(tag => {
        const property = tag?.getAttribute('property');
        const content = tag?.getAttribute('content');
        if (property && content) {
          const key = property.replace('og:', '');
          openGraphTags[key] = content;
        }
      });

      // --- AMP Link ---
      const ampLink = document.querySelector('link[rel="amphtml"]');
      const ampUrl = ampLink?.getAttribute('href') || null;

      // --- Language ---
      const htmlLang = document.documentElement?.lang || '';
      const metaLang = document.querySelector('meta[http-equiv="Content-Language"]');
      const pageLang = htmlLang || metaLang?.getAttribute('content') || null;

      // --- Security ---
      const isSecure = window.location.protocol === 'https:';

      // --- Response Time (Basic Load Time) ---
      let responseTime = new Date().toLocaleString();
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        // Ensure timing values are valid before calculation
        if (timing.loadEventEnd > 0 && timing.navigationStart > 0) {
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          if (loadTime > 0) {
            responseTime = `${new Date().toLocaleString()} (Load: ${loadTime}ms)`;
          }
        }
      }

      // --- Headings, Links, Images (Using DomUtils) ---
      const headingsData = DomUtils.getHeadings();
      const linksData = DomUtils.getLinks();
      const imageData = DomUtils.getImages(true); // Include header/footer images
      const contentOnlyImages = DomUtils.getImages(false); // Content-only images

      // --- Structured Data ---
      const structuredData = this.extractStructuredData();

      // --- Redirect Info ---
      const redirect = this.collectRedirectInfo();

      // --- Server Info Placeholder ---
      // Note: Actual server info (IP, Server header) requires background script access
      const serverInfo = {
        httpVersion: null, // Cannot reliably get from content script
        ip: null,
        server: null,
        php: null
      };

      // --- Compile Data Object ---
      const data = {
        url: url,
        title: title,
        description: description,
        responseTime: responseTime, // Basic load time
        headings: headingsData, // Includes counts and ordered list
        content: { // Simplified content section
          headings: headingsData.headingsInOrder || [],
          wordCount: DomUtils.getWordCount(),
          images: imageData // Use the full image data here
        },
        links: linksData, // Includes counts, items, analysis
        images: imageData, // Keep top-level for compatibility
        contentOnlyImages: contentOnlyImages, // Separate content-only images
        imageStats: { // Consolidated image stats
          total: imageData.total || 0,
          withAlt: imageData.withAlt || 0,
          withoutAlt: imageData.withoutAlt || 0,
          nonOptimizedFilenames: imageData.nonOptimizedFilenames || 0,
          contentOnly: {
            total: contentOnlyImages.total || 0,
            withAlt: contentOnlyImages.withAlt || 0,
            withoutAlt: contentOnlyImages.withoutAlt || 0
          }
        },
        structured: structuredData, // Contains jsonLd, microdata, rdfa
        robots: {
          content: robotsContent,
          isNoindex: isNoindex,
          isNofollow: isNofollow,
          allowed: isIndexable, // Use calculated value
          directives: robotsContent ? robotsContent.toLowerCase().split(',').map(item => item.trim()) : []
        },
        canonical: {
          url: canonicalUrl,
          valid: canonicalValid
        },
        isIndexable: isIndexable,
        isFollowable: isFollowable,
        mobileFriendly: {
          viewport: hasMobileViewport,
          isMobileFriendly: hasMobileViewport // Simple check for now
        },
        security: {
          isSecure: isSecure
        },
        openGraph: openGraphTags,
        amp: {
          hasAmp: !!ampUrl,
          url: ampUrl
        },
        language: pageLang,
        serverInfo: serverInfo, // Placeholder
        redirect: redirect,
        seoScore: this.calculateSEOScore(title, description, headingsData, imageData, structuredData) // Pass data to score function
        // Note: Web Vitals are handled separately by WebVitalsAnalyzer
        // Note: Status code is added by background script
      };

      logger.info('SeoExtractor', 'SEO data extracted successfully');
      return data;
    } catch (error) {
      logger.error('SeoExtractor', 'Error extracting SEO data', error);
      // Consider re-throwing or returning a specific error object
      throw error; // Re-throw for the controller to handle
    }
  }

  /**
   * Extract structured data (JSON-LD, Microdata, RDFa) from the page.
   * @returns {Object} An object containing arrays for each structured data type found.
   */
  static extractStructuredData() {
    const structuredData = {
      jsonLd: [],
      microdata: [],
      rdfa: []
    };

    // Extract JSON-LD
    try {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach(script => {
        try {
          const scriptContent = script?.textContent;
          if (!scriptContent) return;
          const jsonData = JSON.parse(scriptContent);
          // Basic validation: check for @type or @context
          if (!jsonData['@type'] && !jsonData['@context']) {
             logger.warn('SeoExtractor', 'Skipping potentially invalid JSON-LD:', scriptContent.substring(0, 100));
             return;
          }
          const type = jsonData['@type'] || 'Unknown Type';
          const properties = Object.keys(jsonData).filter(key => key !== '@type' && key !== '@context');
          structuredData.jsonLd.push({ type, properties, raw: scriptContent });
        } catch (e) {
          logger.warn('SeoExtractor', 'Error parsing JSON-LD script content', e);
        }
      });
    } catch (error) {
      logger.error('SeoExtractor', 'Error querying JSON-LD scripts', error);
    }

    // Extract Microdata
    try {
      const microdataElements = document.querySelectorAll('[itemscope]');
      microdataElements.forEach(element => {
        try {
          const type = element?.getAttribute('itemtype') || 'Unknown Type';
          const properties = Array.from(element?.querySelectorAll('[itemprop]') || [])
                               .map(el => el?.getAttribute('itemprop'))
                               .filter(Boolean); // Filter out null/empty props
          structuredData.microdata.push({ type: type.split('/').pop(), properties });
        } catch (e) {
           logger.warn('SeoExtractor', 'Error processing Microdata element', e);
        }
      });
    } catch (error) {
      logger.error('SeoExtractor', 'Error querying Microdata elements', error);
    }

    // Extract RDFa
    try {
      const rdfaElements = document.querySelectorAll('[typeof]');
      rdfaElements.forEach(element => {
         try {
            const type = element?.getAttribute('typeof') || 'Unknown Type';
            const properties = Array.from(element?.querySelectorAll('[property]') || [])
                               .map(el => el?.getAttribute('property'))
                               .filter(Boolean);
            structuredData.rdfa.push({ type, properties });
         } catch (e) {
            logger.warn('SeoExtractor', 'Error processing RDFa element', e);
         }
      });
    } catch (error) {
      logger.error('SeoExtractor', 'Error querying RDFa elements', error);
    }

    return structuredData;
  }

  /**
   * Collect redirect information using the Navigation Timing API.
   * @returns {Object|null} Redirect details or null if no redirect occurred.
   */
  static collectRedirectInfo() {
    try {
      if (!window.performance || !window.performance.getEntriesByType) {
        return null; // API not supported
      }

      const navEntries = window.performance.getEntriesByType('navigation');
      if (!navEntries || navEntries.length === 0) {
        return null; // No navigation entry found
      }

      const navEntry = navEntries[0];
      const referrer = document.referrer;
      let redirectInfo = null;

      if (navEntry.redirectCount > 0) {
        redirectInfo = {
          count: navEntry.redirectCount,
          fromUrl: referrer || null, // Referrer might be empty
          url: window.location.href,
          initialUrl: navEntry.name,
          navigationType: navEntry.type
        };

        // Attempt to get redirect chain details from resource timing (might not always work)
        if (window.performance.getEntriesByType('resource')) {
          const resourceEntries = window.performance.getEntriesByType('resource');
          // Filter resources that were part of the navigation redirect chain
          const redirectEntries = resourceEntries.filter(entry =>
            entry.initiatorType === 'navigation' && entry.redirectStart > 0
          );
          if (redirectEntries.length > 0) {
            redirectInfo.entries = redirectEntries.map(entry => ({
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              redirectStart: entry.redirectStart,
              redirectEnd: entry.redirectEnd
            }));
          }
        }
      } else if (referrer && referrer !== window.location.href) {
        // Check if referrer is different, might indicate a single client-side redirect or opening from another page
        // This is less reliable than redirectCount
         try {
            const currentHost = new URL(window.location.href).hostname;
            const referrerHost = new URL(referrer).hostname;
            if (currentHost !== referrerHost) {
               // Likely navigation from another site, not necessarily a redirect
            } else {
               // Same domain, could be a client-side redirect, mark as possible
               redirectInfo = {
                 count: 1, // Assume 1
                 fromUrl: referrer,
                 url: window.location.href,
                 possibleClientSide: true
               };
            }
         } catch (e) { /* Ignore URL parsing errors */ }
      }

      // Add cross-domain check if redirect occurred
      if (redirectInfo && redirectInfo.fromUrl) {
        try {
          const currentHost = new URL(window.location.href).hostname;
          const referrerHost = new URL(redirectInfo.fromUrl).hostname;
          if (currentHost !== referrerHost) {
            redirectInfo.crossDomain = true;
            redirectInfo.fromDomain = referrerHost;
            redirectInfo.toDomain = currentHost;
          }
        } catch (e) {
          logger.warn('SeoExtractor', 'Error comparing domains for redirect check', e);
        }
      }

      return redirectInfo;

    } catch (error) {
      logger.error('SeoExtractor', 'Error collecting redirect info', error);
      return null;
    }
  }

  /**
   * Calculate a basic SEO score based on key on-page factors.
   * @param {string} title - Page title.
   * @param {string} description - Meta description.
   * @param {Object} headingsData - Extracted headings data.
   * @param {Object} imageData - Extracted image data.
   * @param {Object} structuredData - Extracted structured data.
   * @returns {number} The calculated SEO score (0-100).
   */
  static calculateSEOScore(title, description, headingsData, imageData, structuredData) {
    let score = 100;
    const issues = []; // Optional: Track specific issues

    // Title checks
    if (!title) {
      score -= 15; issues.push("Missing title tag.");
    } else {
      if (title.length < 10) { score -= 5; issues.push("Title tag too short (< 10 chars)."); }
      if (title.length > 70) { score -= 5; issues.push("Title tag too long (> 70 chars)."); }
    }

    // Meta description checks
    if (!description) {
      score -= 10; issues.push("Missing meta description.");
    } else {
      if (description.length < 50) { score -= 5; issues.push("Meta description too short (< 50 chars)."); }
      if (description.length > 160) { score -= 3; issues.push("Meta description potentially too long (> 160 chars)."); }
    }

    // H1 checks
    const h1Count = headingsData?.h1?.count || 0;
    if (h1Count === 0) {
      score -= 10; issues.push("Missing H1 heading.");
    } else if (h1Count > 1) {
      score -= 5; issues.push("Multiple H1 headings found.");
    }

    // Image alt text checks
    const totalImages = imageData?.total || 0;
    const imagesWithoutAlt = imageData?.withoutAlt || 0;
    if (totalImages > 0 && imagesWithoutAlt > 0) {
      const altTextPercentage = (imagesWithoutAlt / totalImages) * 100;
      if (altTextPercentage > 50) {
        score -= 10; issues.push(`High percentage (${altTextPercentage.toFixed(0)}%) of images missing alt text.`);
      } else if (altTextPercentage > 20) {
        score -= 5; issues.push(`Moderate percentage (${altTextPercentage.toFixed(0)}%) of images missing alt text.`);
      }
    }

    // Structured data check
    const hasJsonLd = structuredData?.jsonLd?.length > 0;
    const hasMicrodata = structuredData?.microdata?.length > 0;
    const hasRdfa = structuredData?.rdfa?.length > 0;
    if (!hasJsonLd && !hasMicrodata && !hasRdfa) {
      score -= 5; issues.push("No structured data (JSON-LD, Microdata, RDFa) found.");
    }

    // Ensure score is within bounds
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    // logger.info('SeoExtractor', `Calculated SEO Score: ${finalScore}`, issues); // Optional logging
    return finalScore;
  }
}
