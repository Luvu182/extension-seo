'use strict';

import { logger } from '../../shared/utils/logger.js';
import { SPA_DETECTION } from '../../shared/constants.js';
// Import string similarity function from the shared utility module
import { calculateStringSimilarity } from '../../shared/utils/string-utils.js';

/**
 * Utilities for working with the DOM
 */
export class DomUtils {
  /**
   * Get a snapshot of essential DOM elements for comparing changes
   * @returns {Object} The DOM snapshot
   */
  static getDOMSnapshot() {
    // Get URL and path
    const url = window.location.href;
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    
    // Get title and meta description
    const title = document.title;
    const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Get all h1 elements
    const h1Elements = Array.from(document.querySelectorAll('h1'));
    const h1Texts = h1Elements.map(h => h?.textContent?.trim() || '').join('|');
    
    // Get first few h2 elements
    const h2Elements = Array.from(document.querySelectorAll('h2')).slice(0, 5);
    const h2Texts = h2Elements.map(h => h?.textContent?.trim() || '').join('|');
    
    // Get main content blocks
    const mainContent = document.querySelector('main');
    const contentById = document.querySelector('#content');
    const contentByClass = document.querySelector('.content');
    const articleElement = document.querySelector('article');
    
    // Get text samples from potential content areas
    const mainContentText = mainContent?.textContent?.substring(0, 200) || '';
    const contentByIdText = contentById?.textContent?.substring(0, 200) || '';
    const contentByClassText = contentByClass?.textContent?.substring(0, 200) || '';
    const articleText = articleElement?.textContent?.substring(0, 200) || '';
    
    // Get large text blocks that might indicate main content
    const allParagraphs = Array.from(document.querySelectorAll('p'));
    const paragraphSample = allParagraphs.slice(0, 3).map(p => p?.textContent?.trim() || '').join(' ').substring(0, 200);
    
    // Get links count as a content indicator
    const linksCount = document.querySelectorAll('a').length;
    
    // Aggregate all content samples
    const contentSamples = [
      mainContentText, 
      contentByIdText, 
      contentByClassText, 
      articleText, 
      paragraphSample
    ].filter(sample => sample.length > 0);
    
    // Join first 2 valid content samples (or whatever we have)
    const combinedContentSample = contentSamples.slice(0, 2).join(' // ').substring(0, 300);
    
    // Include visible elements count as a general measure of page complexity
    const visibleElementsCount = document.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6, span, a, li, img').length;
    
    // Create snapshot object
    const snapshot = {
      url,
      path,
      search,
      hash,
      title,
      meta,
      headings: {
        h1: h1Texts,
        h2: h2Texts,
        h1Count: h1Elements.length,
        h2Count: h2Elements.length
      },
      content: combinedContentSample,
      metrics: {
        linksCount,
        visibleElementsCount,
        timestamp: Date.now()
      }
    };
    
    return snapshot;
  }

  /**
   * Compare two DOM snapshots to detect significant changes
   * @param {Object} prev - Previous DOM snapshot
   * @param {Object} current - Current DOM snapshot
   * @returns {boolean} Whether the DOM has significantly changed based on a scoring system.
   */
  static hasDOMSignificantlyChanged(prev, current) {
    // Bail out if either snapshot is missing
    if (!prev || !current) return true;

    let reasons = [];
    let score = 0;
    // Use the CHANGE_THRESHOLD from constants if available, otherwise default
    const changeThreshold = SPA_DETECTION?.CHANGE_THRESHOLD || 3;

    // Check URL path change (strongest indicator)
    if (prev.path !== current.path) {
      reasons.push("URL path changed");
      score += 5; // Path change is a strong signal
    }

    // Check URL search params
    if (prev.search !== current.search) {
      reasons.push("URL search params changed");
      score += 2; // Search params change might indicate navigation
    }

    // Check URL hash (weaker signal)
    if (prev.hash !== current.hash) {
      reasons.push("URL hash changed");
      score += 1;
    }

    // Check title change
    if (prev.title !== current.title) {
      reasons.push("Page title changed");
      score += 3; // Title changes are a strong signal
    }

    // Check meta description change
    if (prev.meta !== current.meta) {
      reasons.push("Meta description changed");
      score += 3; // Meta changes are a strong signal
    }

    // Check h1 changes (important for SEO)
    if (prev.headings?.h1 !== current.headings?.h1) {
      reasons.push("H1 headings changed");
      score += 3; // H1 changes are a strong signal
    }

    // Check h1 count changes
    if (prev.headings?.h1Count !== current.headings?.h1Count) {
      reasons.push("Number of H1 headings changed");
      score += 2;
    }

    // Check h2 changes (moderate signal)
    if (prev.headings?.h2 !== current.headings?.h2) {
      reasons.push("H2 headings changed");
      score += 2;
    }

    // Check main content changes using string similarity
    if (prev.content && current.content) {
      // Use the imported similarity function
      const similarity = calculateStringSimilarity(prev.content, current.content);
      if (similarity < 0.6) { // Threshold for significant change
        reasons.push(`Content similarity low (${similarity.toFixed(2)})`);
        score += 3; // Big content change is a strong signal
      } else if (similarity < 0.8) { // Threshold for moderate change
        reasons.push(`Content moderately changed (${similarity.toFixed(2)})`);
        score += 1; // Small content change is a weak signal
      }
    }

    // Check for large changes in visible elements count
    const prevCount = prev.metrics?.visibleElementsCount || 0;
    const currentCount = current.metrics?.visibleElementsCount || 0;
    if (prevCount > 0) { // Avoid division by zero
        const countDiff = Math.abs(prevCount - currentCount);
        const countPercent = (countDiff / prevCount) * 100;
        // Consider significant if count changes by > 30% AND at least 20 elements
        if (countPercent > 30 && countDiff > 20) {
            reasons.push(`Visible elements count changed by ${countPercent.toFixed(0)}% (${countDiff} elements)`);
            score += 2; // Significant DOM structure change
        }
    } else if (currentCount > 20) { // If previous count was 0, check if current count is significant
        reasons.push(`Visible elements count changed significantly (from 0 to ${currentCount})`);
        score += 2;
    }


    // Check for large changes in links count
    const prevLinks = prev.metrics?.linksCount || 0;
    const currentLinks = current.metrics?.linksCount || 0;
     if (prevLinks > 0) { // Avoid division by zero
        const linksDiff = Math.abs(prevLinks - currentLinks);
        const linksPercent = (linksDiff / prevLinks) * 100;
        // Consider significant if link count changes by > 30% AND at least 5 links
        if (linksPercent > 30 && linksDiff > 5) {
            reasons.push(`Links count changed by ${linksPercent.toFixed(0)}% (${linksDiff} links)`);
            score += 1; // Moderate change in navigation structure
        }
     } else if (currentLinks > 5) { // If previous count was 0, check if current count is significant
        reasons.push(`Links count changed significantly (from 0 to ${currentLinks})`);
        score += 1;
     }


    // Log the changes if the score reaches the threshold
    if (score >= changeThreshold) {
      logger.info('DomUtils', `DOM changed significantly (score: ${score} >= ${changeThreshold}): ${reasons.join(', ')}`);
      return true;
    }

    return false;
  }

  /**
   * Get meta description from the page
   * @returns {string} The meta description or empty string
   */
  static getMetaDescription() {
    return document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  }

  /**
   * Get headings from the page in document order, including context.
   * @returns {Object} Object containing headings data (both old and new formats).
   */
  static getHeadings() {
    try {
      const allHeadingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      
      const getElementContext = (element) => {
          let parent = element.parentElement;
          const maxParentCheck = 5;
          let level = 0;
          while (parent && level < maxParentCheck) {
              const tagName = parent.tagName.toLowerCase();
              const classNames = parent.className ? parent.className.toLowerCase() : '';
              const id = parent.id ? parent.id.toLowerCase() : '';
              if (tagName === 'header' || classNames.includes('header') || id.includes('header')) return 'header';
              if (tagName === 'footer' || classNames.includes('footer') || id.includes('footer')) return 'footer';
              if (tagName === 'nav' || classNames.includes('nav') || id.includes('nav') || 
                  classNames.includes('menu') || id.includes('menu') || 
                  classNames.includes('navbar') || id.includes('navbar')) return 'navigation';
              parent = parent.parentElement;
              level++;
          }
          return 'content';
      };

      const headingsList = allHeadingElements.map((heading, index) => ({
        level: parseInt(heading.tagName.substring(1)),
        text: heading?.textContent?.trim() || '',
        position: index,
        context: getElementContext(heading)
      }));
      
      const headingsByLevel = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
      headingsList.forEach(heading => {
        const levelKey = `h${heading.level}`;
        if (headingsByLevel[levelKey]) {
          headingsByLevel[levelKey].push(heading.text);
        }
      });
      
      return { ...headingsByLevel, headingsInOrder: headingsList };
    } catch (error) {
      logger.error('DomUtils', 'Error extracting headings', error);
      return { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], headingsInOrder: [] };
    }
  }

  /**
   * Get links information from the page
   * @returns {Object} Object containing internal, external, broken, and nofollow links
   */
  static getLinks() {
    const allLinks = Array.from(document.querySelectorAll('a'));
    const currentHost = window.location.hostname;
    const links = {
      internal: { count: 0, items: [] },
      external: { count: 0, items: [] },
      broken: { count: 0, items: [] },
      nofollow: { count: 0, items: [] },
      total: allLinks.length
    };

    allLinks.forEach(link => {
      if (!link) return;
      try {
        const href = link.href || '';
        const anchorText = link.textContent?.trim() || '';
        const rel = link.getAttribute('rel') || '';
        const target = link.getAttribute('target') || '';
        
        if (!href || href === '#') {
          links.broken.count++;
          links.broken.items.push({ href, anchorText, reason: !href ? 'empty' : 'hash-only' });
        }
        
        if (link.hostname === currentHost || !link.hostname) {
          links.internal.count++;
          links.internal.items.push({ href, path: link.pathname || '/', anchorText, depth: (link.pathname || '/').split('/').filter(Boolean).length });
        } else {
          links.external.count++;
          links.external.items.push({ href, domain: link.hostname, anchorText, rel, target, hasSecurity: !target || target !== '_blank' || rel.includes('noopener') });
        }
        
        if (rel.includes('nofollow')) {
          links.nofollow.count++;
          links.nofollow.items.push({ href, anchorText, rel });
        }
      } catch (e) {
        logger.error('DomUtils', 'Error processing link', e);
      }
    });
    
    links.analysis = {
      internalRatio: links.total > 0 ? (links.internal.count / links.total) : 0,
      externalRatio: links.total > 0 ? (links.external.count / links.total) : 0,
      nofollowRatio: links.total > 0 ? (links.nofollow.count / links.total) : 0,
      maxInternalDepth: links.internal.items.length > 0 ? Math.max(...links.internal.items.map(item => item.depth || 0), 0) : 0
    };

    return links;
  }

  /**
   * Get images information from the page, including context for filtering.
   * @returns {Array} Array of image objects with context.
   */
  static getImages() {
    const allImages = Array.from(document.querySelectorAll('img'));
    
    const hasNonOptimizedName = (src) => {
      try {
        if (!src) return false;
        const url = new URL(src, window.location.origin);
        const filename = url.pathname.split('/').pop();
        return /(%[0-9A-F]{2}|\^|\+|\s|,|;|\(|\)|'|"|`|=|<|>|\{|\}|\[|\]|\\|\||@|#|\$)/.test(filename);
      } catch (e) { return false; }
    };
    
    // Removed estimateImageSize function as it's inaccurate. Size will be fetched asynchronously.
    
    const getFilename = (src) => {
      if (!src) return 'Unknown';
      try {
        const url = new URL(src, window.location.origin);
        return url.pathname.split('/').pop() || 'Unknown';
      } catch (e) { return src.split('/').pop() || 'Unknown'; }
    };

    const getElementContext = (element) => {
        let parent = element.parentElement;
        const maxParentCheck = 5;
        let level = 0;
        while (parent && level < maxParentCheck) {
            const tagName = parent.tagName.toLowerCase();
            const classNames = parent.className ? parent.className.toLowerCase() : '';
            const id = parent.id ? parent.id.toLowerCase() : '';
            if (tagName === 'header' || classNames.includes('header') || id.includes('header')) return 'header';
            if (tagName === 'footer' || classNames.includes('footer') || id.includes('footer')) return 'footer';
            if (tagName === 'nav' || classNames.includes('nav') || id.includes('nav') || 
                classNames.includes('menu') || id.includes('menu') || 
                classNames.includes('navbar') || id.includes('navbar')) return 'navigation';
            parent = parent.parentElement;
            level++;
        }
        return 'content';
    };
    
    const imageObjects = allImages.map(img => {
      const lazySrc = img.dataset.src || img.dataset.lazySrc || img.dataset.original || img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original');
      const potentialSrc = (lazySrc && (lazySrc.startsWith('http') || lazySrc.startsWith('/'))) ? lazySrc : (img.src || img.getAttribute('src') || '');
      let src = '';
      try { src = new URL(potentialSrc, window.location.origin).href; } catch (e) { src = potentialSrc; }

      const alt = img.alt || img.getAttribute('alt') || '';
      const width = img.naturalWidth || img.width || img.getAttribute('width') || null;
      const height = img.naturalHeight || img.height || img.getAttribute('height') || null;
      
      return {
        src,
        alt,
        filename: getFilename(src),
        width: width ? parseInt(width, 10) : null,
        height: height ? parseInt(height, 10) : null,
        fileSize: null, // Initialize fileSize as null. Will be fetched later.
        loading: img.loading || img.getAttribute('loading') || 'eager',
        hasAlt: alt.trim().length > 0,
        hasNonOptimizedFilename: hasNonOptimizedName(src),
        context: getElementContext(img)
      };
    });
    
    const validImages = imageObjects.filter(img => {
      const imgSrc = img.src || '';
      return imgSrc && 
             !imgSrc.startsWith('data:image/gif;base64') && 
             !(imgSrc.startsWith('data:') && imgSrc.length < 100) && 
             imgSrc !== window.location.href;
    });
    
    return validImages; 
  }

  /**
   * Count words in the page content
   * @returns {number} The number of words in the page content
   */
  static getWordCount() {
    try {
      const contentSelectors = ['main', 'article', '#content', '.content', '.post-content', '.entry-content'];
      let contentElement = null;
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) { contentElement = element; break; }
      }

      let textContent = '';
      if (contentElement) {
        textContent = contentElement.textContent || '';
      } else {
        const bodyClone = document.body.cloneNode(true);
        const elementsToRemove = bodyClone.querySelectorAll('script, style, header, footer, nav, aside, noscript, meta');
        elementsToRemove.forEach(element => element.remove());
        textContent = bodyClone.textContent || '';
      }

      const cleanedText = textContent.replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
      const words = cleanedText.split(' ').filter(word => word.trim().length > 0);
      return words.length;
    } catch (error) {
      logger.error('DomUtils', 'Error counting words', error);
      return 0;
    }
  }
}
