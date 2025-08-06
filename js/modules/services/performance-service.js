'use strict';

/**
 * Performance Service
 * Handles performance metrics calculations, scoring, and recommendations
 * Integrates with PageSpeed Insights API
 */

// PageSpeed Insights API endpoints
const PAGESPEED_API_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// API key for PageSpeed Insights
const PAGESPEED_API_KEY = 'AIzaSyByoEPORQ3VP3ADB2tGsLtQGy3n1S-uKRc';

// Default metrics values when data is missing
// These are reasonable defaults that won't skew the performance score
// LCP: 2.5s is the "good" threshold
// FID: 100ms is the "good" threshold
// CLS: 0.1 is the "good" threshold
// TTFB: 0.8s is the "good" threshold
const DEFAULT_METRICS = {
  lcp: 2.5,   // seconds
  fid: 100,   // milliseconds
  cls: 0.1,   // unitless
  ttfb: 0.8   // seconds
};

// Define expected units and reasonable ranges for validation
const METRIC_VALIDATION = {
  lcp: { unit: 'seconds', min: 0.1, max: 30, suspicious_min: 0.05, suspicious_max: 15 },
  fid: { unit: 'milliseconds', min: 1, max: 5000, suspicious_min: 5, suspicious_max: 1000 },
  cls: { unit: 'unitless', min: 0, max: 5, suspicious_min: 0, suspicious_max: 1 },
  ttfb: { unit: 'seconds', min: 0.01, max: 10, suspicious_min: 0.05, suspicious_max: 5 }
};

/**
 * Performance Service for handling performance-related calculations and data
 */
/**
 * Performance Service class for handling performance-related calculations and data
 */
class PerformanceService {
  constructor() {
    // Initialize PageSpeed Insights state
    this.pageSpeedData = null;
    this.isLoadingPageSpeed = false;
    this.pageSpeedError = null;
    
    // Initialize cache for PageSpeed results
    this.resultsCache = {};
    this.CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
    
    // Bind methods
    this.fetchPageSpeedData = this.fetchPageSpeedData.bind(this);
    this.parsePageSpeedResponse = this.parsePageSpeedResponse.bind(this);
    this.resetPageSpeedData = this.resetPageSpeedData.bind(this);
    this.getCachedResult = this.getCachedResult.bind(this);
    this.hasCache = this.hasCache.bind(this);
    this.loadCachedResults = this.loadCachedResults.bind(this);
    this.getStoredPageSpeedData = this.getStoredPageSpeedData.bind(this);
    
    // Load cached results when service is created
    this.loadCachedResults();
  }
  
  /**
   * Check if a URL has cached results
   * @param {string} url - The URL to check
   * @param {string} strategy - mobile or desktop
   * @returns {boolean} - Whether there are valid cached results
   */
  hasCache(url, strategy) {
    const cacheKey = `${url}_${strategy}`;
    if (!this.resultsCache[cacheKey]) return false;
    
    const cached = this.resultsCache[cacheKey];
    const isExpired = (Date.now() - cached.timestamp) > this.CACHE_EXPIRY;
    
    return !isExpired;
  }
  
  /**
   * Get cached results for a URL if available
   * @param {string} url - The URL to get results for
   * @param {string} strategy - mobile or desktop
   * @returns {Object|null} - Cached results or null
   */
  getCachedResult(url, strategy) {
    const cacheKey = `${url}_${strategy}`;
    
    if (this.hasCache(url, strategy)) {
      console.log('[PerformanceService] Using cached PageSpeed data');
      return this.resultsCache[cacheKey].data;
    }
    
    return null;
  }
  
  /**
   * Reset PageSpeed data state
   */
  resetPageSpeedData() {
    this.pageSpeedData = null;
    this.isLoadingPageSpeed = false;
    this.pageSpeedError = null;
  }
  
  /**
   * Load cached results from storage when service initializes
   */
  loadCachedResults() {
    try {
      chrome.storage.local.get(null, (items) => {
        // Filter for PageSpeed cache items
        const pagespeedItems = Object.keys(items)
          .filter(key => key.startsWith('pagespeed_'));
          
        pagespeedItems.forEach(key => {
          const cacheKey = key.replace('pagespeed_', '');
          const item = items[key];
          
          // Check if item is valid and not expired
          if (item && item.data && item.timestamp) {
            const isExpired = (Date.now() - item.timestamp) > this.CACHE_EXPIRY;
            
            if (!isExpired) {
              this.resultsCache[cacheKey] = item;
              
              // If cacheKey is for current URL, set as pageSpeedData
              const currentUrl = window.location.href;
              if (cacheKey.startsWith(currentUrl)) {
                this.pageSpeedData = item.data;
                console.log('[PerformanceService] Auto-loading cached result for current URL');
              }
              
              console.log('[PerformanceService] Loaded cached result for:', cacheKey);
            }
          }
        });
        
        console.log('[PerformanceService] Loaded', Object.keys(this.resultsCache).length, 'cached results');
      });
    } catch (error) {
      console.error('[PerformanceService] Error loading cached results:', error);
    }
  }
  
  /**
   * Try to get PageSpeed data for current URL from storage
   * @param {string} url - URL to check
   * @param {string} strategy - mobile or desktop
   * @returns {Promise<Object|null>} - Cached data or null
   */
  async getStoredPageSpeedData(url, strategy = 'mobile') {
    if (!url) return null;
    
    const cacheKey = `${url}_${strategy}`;
    
    // Check memory cache first
    if (this.resultsCache[cacheKey] && 
        (Date.now() - this.resultsCache[cacheKey].timestamp) < this.CACHE_EXPIRY) {
      console.log('[PerformanceService] Using in-memory cache for:', url);
      return this.resultsCache[cacheKey].data;
    }
    
    // Try to get from chrome.storage
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(`pagespeed_${cacheKey}`, (result) => {
          const storedData = result[`pagespeed_${cacheKey}`];
          
          if (storedData && storedData.data && storedData.timestamp && 
              (Date.now() - storedData.timestamp) < this.CACHE_EXPIRY) {
            
            // Update in-memory cache too
            this.resultsCache[cacheKey] = storedData;
            console.log('[PerformanceService] Loaded from storage cache for:', url);
            resolve(storedData.data);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('[PerformanceService] Error getting stored data:', error);
      return null;
    }
  }
  
  /**
   * Fetch data from PageSpeed Insights API
   * @param {string} url - URL to analyze
   * @param {string} strategy - 'mobile' or 'desktop'
   * @returns {Promise<Object>} - PageSpeed data
   */
  async fetchPageSpeedData(url, strategy = 'mobile') {
    if (!url) {
      return Promise.reject(new Error('URL is required'));
    }
    
    // Clean up URL if needed
    const cleanUrl = url.trim();
    
    // Create a cache key for this request
    const cacheKey = `${cleanUrl}_${strategy}`;
    
    // Check if we have a valid cached result
    if (this.resultsCache[cacheKey] && 
        (Date.now() - this.resultsCache[cacheKey].timestamp) < this.CACHE_EXPIRY) {
      console.log('[PerformanceService] Using cached PageSpeed data for:', cleanUrl);
      this.pageSpeedData = this.resultsCache[cacheKey].data;
      return this.pageSpeedData;
    }
    
    // Max retry attempts
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError = null;
    
    try {
      this.isLoadingPageSpeed = true;
      this.pageSpeedError = null;
      
      // Retry logic loop
      while (retryCount <= MAX_RETRIES) {
        try {
          // Build API URL
          const apiUrl = new URL(PAGESPEED_API_ENDPOINT);
          apiUrl.searchParams.append('url', cleanUrl);
          apiUrl.searchParams.append('strategy', strategy);
          apiUrl.searchParams.append('category', 'performance');
          
          // Add API key
          apiUrl.searchParams.append('key', PAGESPEED_API_KEY);
          
          console.log(`[PerformanceService] Fetching PageSpeed data for: ${cleanUrl} (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          
          // Make API request with proper CORS handling
          const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'application/json'
            },
            // Add a longer timeout for the request
            signal: AbortSignal.timeout(20000) // 20 second timeout
          });
          
          if (!response.ok) {
            // For 500 errors, try a fallback method if available
            if (response.status === 500) {
              throw new Error(`PageSpeed API Server Error (500). This may be a temporary issue with Google's servers or with analyzing the URL.`);
            }
            
            throw new Error(`PageSpeed API Error: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Parse response
          this.pageSpeedData = this.parsePageSpeedResponse(data);
          
          // Store in cache
          this.resultsCache[cacheKey] = {
            data: this.pageSpeedData,
            timestamp: Date.now()
          };
          
          // Save to chrome.storage for persistence
          try {
            chrome.storage.local.set({
              [`pagespeed_${cacheKey}`]: {
                data: this.pageSpeedData,
                timestamp: Date.now()
              }
            });
          } catch (storageError) {
            console.warn('[PerformanceService] Could not save to chrome.storage:', storageError);
          }
          
          this.isLoadingPageSpeed = false;
          
          return this.pageSpeedData;
        } catch (error) {
          lastError = error;
          
          // Don't retry for certain error types
          if (error.message.includes('URL is required') || 
              error.message.includes('404') ||
              error.message.includes('403')) {
            throw error;
          }
          
          // For 429 (rate limit) or 500 (server error), retry with backoff
          if (retryCount < MAX_RETRIES) {
            const waitTime = Math.pow(2, retryCount) * 1000;
            console.log(`[PerformanceService] Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('[PerformanceService] Error fetching PageSpeed data:', error);
      this.isLoadingPageSpeed = false;
      this.pageSpeedError = error.message || 'Failed to fetch PageSpeed data';
      return Promise.reject(error);
    }
  }
  
  /**
   * Parse response from PageSpeed Insights API
   * @param {Object} data - Raw API response
   * @returns {Object} - Normalized performance data
   */
  parsePageSpeedResponse(data) {
    if (!data || !data.lighthouseResult) {
      throw new Error('Invalid PageSpeed API response');
    }
    
    try {
      const result = {
        score: Math.round(data.lighthouseResult.categories.performance.score * 100),
        metrics: {
          // Convert LCP from ms to seconds
          lcp: data.lighthouseResult.audits['largest-contentful-paint']?.numericValue / 1000 || 2.5,
          // CLS value (already in correct unit)
          cls: data.lighthouseResult.audits['cumulative-layout-shift']?.numericValue || 0.1,
          // Use Total Blocking Time as a proxy for FID
          fid: data.lighthouseResult.audits['total-blocking-time']?.numericValue || 100,
          // Convert TTFB from ms to seconds
          ttfb: data.lighthouseResult.audits['server-response-time']?.numericValue / 1000 || 0.8
        },
        audits: {},
        opportunities: []
      };
      
      // Extract key opportunities from audits
      const audits = data.lighthouseResult.audits;
      
      // Process opportunities
      for (const [key, audit] of Object.entries(audits)) {
        // Skip non-opportunity audits
        if (!audit.details || !audit.details.type || !audit.score) {
          continue;
        }
        
        // Only include opportunities with a score less than 0.9 (indicating room for improvement)
        if (audit.score < 0.9) {
          result.opportunities.push({
            id: key,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
            // Save the full audit data for potential detailed display
            auditDetails: audit.details
          });
        }
      }
      
      // Sort opportunities by score (lowest first)
      result.opportunities.sort((a, b) => a.score - b.score);
      
      return result;
    } catch (error) {
      console.error('[PerformanceService] Error parsing PageSpeed response:', error);
      throw new Error('Failed to parse PageSpeed data');
    }
  }
  /**
   * Get normalized metrics with defaults for missing values
   * @param {Object} data - The page data
   * @returns {Object} - Normalized metrics
   */
  getNormalizedMetrics(data) {
    // Start with default metrics
    const metrics = { ...DEFAULT_METRICS };
    
    // If we have incoming metrics, validate and normalize them
    if (data && data.metrics) {
      console.log('[PerformanceService] Raw metrics received:', data.metrics);
      
      // Process each metric type
      Object.keys(METRIC_VALIDATION).forEach(metricName => {
        if (typeof data.metrics[metricName] === 'number') {
          const value = data.metrics[metricName];
          const validation = METRIC_VALIDATION[metricName];
          
          // Check if value is within reasonable range
          if (value >= validation.min && value <= validation.max) {
            metrics[metricName] = value;
          } else if (value > validation.max) {
            console.warn(`[PerformanceService] ${metricName} value too high (${value}), capping at ${validation.max}`);
            metrics[metricName] = validation.max;
          } else if (value < validation.min) {
            console.warn(`[PerformanceService] ${metricName} value too low (${value}), using minimum ${validation.min}`);
            metrics[metricName] = validation.min;
          }
          
          // Log suspicious values for debugging
          if (value < validation.suspicious_min || value > validation.suspicious_max) {
            console.warn(`[PerformanceService] Suspicious ${metricName} value: ${value} ${validation.unit}`);
          }
        }
      });
    }
    
    console.log('[PerformanceService] Normalized metrics:', metrics);
    return metrics;
  }

  /**
   * Calculate performance score based on metrics
   * @param {Object} metrics - The performance metrics
   * @returns {Object} - Score details including overall score, category, and description
   */
  calculatePerformanceScore(metrics) {
    // Calculate individual scores
    const lcpScore = metrics.lcp < 2.5 ? 100 : metrics.lcp < 4 ? 50 : 0;
    const fidScore = metrics.fid < 100 ? 100 : metrics.fid < 300 ? 50 : 0;
    const clsScore = metrics.cls < 0.1 ? 100 : metrics.cls < 0.25 ? 50 : 0;
    const ttfbScore = metrics.ttfb < 0.8 ? 100 : metrics.ttfb < 1.8 ? 50 : 0;
    
    // Calculate overall score
    const performanceScore = Math.round((lcpScore + fidScore + clsScore + ttfbScore) / 4);
    const scoreColor = performanceScore >= 90 ? '#10b981' : performanceScore >= 50 ? '#f59e0b' : '#ef4444';

    // Determine performance category and description
    let performanceCategory;
    let summaryTextContent;
    
    if (performanceScore >= 90) {
      performanceCategory = 'Excellent';
      summaryTextContent = 'Your page has excellent performance metrics and should load quickly for most users. Fast loading pages lead to better user experience and can positively impact SEO rankings.';
    } else if (performanceScore >= 70) {
      performanceCategory = 'Good';
      summaryTextContent = 'Your page has good performance but there\'s room for improvement. Consider implementing the recommendations below to enhance page speed and user experience.';
    } else if (performanceScore >= 50) {
      performanceCategory = 'Needs Improvement';
      summaryTextContent = 'Your page performance needs improvement. Slow pages can lead to high bounce rates and negatively impact SEO rankings. Review and implement the recommendations below.';
    } else {
      performanceCategory = 'Poor';
      summaryTextContent = 'Your page has poor performance metrics. Users may experience slow loading times, which can significantly increase bounce rates and hurt SEO rankings. Urgent optimization is recommended.';
    }

    return {
      score: performanceScore,
      category: performanceCategory,
      description: summaryTextContent,
      color: scoreColor
    };
  }

  /**
   * Generate TTFB evaluation
   * @param {number} ttfb - Time to First Byte value
   * @returns {Object} - TTFB evaluation details
   */
  evaluateTTFB(ttfb) {
    const color = ttfb < 0.2 ? '#10b981' : 
                 ttfb < 0.5 ? '#22c55e' : 
                 ttfb < 0.8 ? '#84cc16' : 
                 ttfb < 1.0 ? '#f59e0b' : '#ef4444';
    
    const percentage = Math.min(100, (ttfb / 1.8) * 100); // Normalize based on 'poor' threshold
    
    let evaluation = '';
    if (ttfb < 0.2) evaluation = 'Excellent server response time!';
    else if (ttfb < 0.5) evaluation = 'Good server response time.';
    else if (ttfb < 0.8) evaluation = 'Acceptable server response time.';
    else if (ttfb < 1.0) evaluation = 'Server response time is slower than recommended.';
    else evaluation = 'Poor server response time.';

    return {
      color,
      percentage,
      evaluation
    };
  }

  /**
   * Generate performance recommendations based on metrics
   * @param {Object} metrics - The performance metrics
   * @returns {Array} - List of recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    // Add specific recommendations based on metrics
    if (metrics.lcp > 2.5) {
      recommendations.push({ 
        title: 'Optimize LCP', 
        description: 'Optimize and compress images, reduce render-blocking resources, and implement critical CSS to improve Largest Contentful Paint.', 
        priority: metrics.lcp > 4 ? 'high' : 'medium' 
      });
    }
    
    if (metrics.fid > 100) {
      recommendations.push({ 
        title: 'Improve FID', 
        description: 'Reduce JavaScript execution time, break up long tasks, and optimize event handlers to improve First Input Delay.', 
        priority: metrics.fid > 300 ? 'high' : 'medium' 
      });
    }
    
    if (metrics.cls > 0.1) {
      recommendations.push({ 
        title: 'Reduce Layout Shifts', 
        description: 'Include size attributes for images and videos, avoid inserting content above existing content, and use transform animations instead of properties that trigger layout changes.', 
        priority: metrics.cls > 0.25 ? 'high' : 'medium' 
      });
    }
    
    if (metrics.ttfb > 0.5) {
      recommendations.push({ 
        title: 'Improve Server Response Time', 
        description: 'Optimize server performance, use a CDN, implement caching, and consider server-side rendering for faster Time to First Byte.', 
        priority: metrics.ttfb > 1.0 ? 'high' : 'medium' 
      });
    }
    
    // Add general recommendations if needed
    if (recommendations.length < 3) {
      const generalRecommendations = [
        { 
          title: 'Optimize Images', 
          description: 'Use modern formats like WebP, implement lazy loading, and properly size images for their display dimensions.', 
          priority: 'medium' 
        },
        { 
          title: 'Minimize/Defer JavaScript', 
          description: 'Reduce unused JavaScript, defer non-critical scripts, and consider code splitting to improve page load performance.', 
          priority: 'medium' 
        },
        { 
          title: 'Use Browser Caching', 
          description: 'Set appropriate cache headers for static resources to reduce load times for returning visitors.', 
          priority: 'medium' 
        },
        { 
          title: 'Implement Critical CSS', 
          description: 'Inline critical styles in the head of your document and defer non-critical CSS to improve render times.', 
          priority: 'medium' 
        }
      ];
      
      for (let i = 0; i < Math.min(4 - recommendations.length, generalRecommendations.length); i++) {
        if (!recommendations.some(rec => rec.title === generalRecommendations[i].title)) {
          recommendations.push(generalRecommendations[i]);
        }
      }
    }
    
    return recommendations;
  }
}

// Export a singleton instance
export const performanceService = new PerformanceService();
