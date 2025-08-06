'use strict';

import React from 'react';

// Performance tab module for SEO AI Assistant

// Import dependencies
// React is global
import { styles } from '../styles.js';
import { dataService } from '../data-service.js';
import { performanceService } from '../services/performance-service.js';
import { PerformanceScoreCard } from '../components/PerformanceScoreCard.js';
import { CoreWebVitalsDetail } from '../components/CoreWebVitalsDetail.js';
import { ServerResponseTime } from '../components/ServerResponseTime.js';
import { PerformanceRecommendations } from '../components/PerformanceRecommendations.js';
import { PageSpeedOpportunities } from '../components/PageSpeedOpportunities.js';
import { PageSpeedInsights } from '../components/PageSpeedInsights.js';

/**
 * Performance Tab Component
 * Displays performance metrics, scores, and recommendations
 * @param {Object} props - Component properties
 * @param {Object} props.pageData - Page data containing performance metrics
 * @returns {React.Element} - The Performance Tab component
 */
export const PerformanceTab = ({ pageData }) => {
    // Use React hooks for state
    const [metrics, setMetrics] = React.useState(null);
    const [evaluation, setEvaluation] = React.useState({
        score: '-',
        category: 'No Data',
        description: 'Run PageSpeed Insights analysis to get performance metrics.',
        color: '#64748b'
    });
    const [recommendations, setRecommendations] = React.useState([]);
    const [pageSpeedOpportunities, setPageSpeedOpportunities] = React.useState([]);
    const [isUsingPageSpeedData, setIsUsingPageSpeedData] = React.useState(false);
    
    // Get URL from pageData
    const url = pageData?.url || window.location.href;
    
    // Initialize metrics and evaluations from pageData on mount and when pageData changes


    // Initial load effect - try to load PageSpeed data from storage
    React.useEffect(() => {
        // Function to load PageSpeed data from storage
        const loadStoredPageSpeedData = async () => {
            // Try to get stored PageSpeed data for current URL
            try {
                const storedData = await performanceService.getStoredPageSpeedData(url);
                
                if (storedData) {
                    console.log('[PerformanceTab] Found stored PageSpeed data for current URL');
                    handlePageSpeedDataFetched(storedData);
                    
                    // Also update opportunities if available
                    if (storedData.opportunities) {
                        handleOpportunitiesUpdated(storedData.opportunities);
                    }
                }
            } catch (err) {
                console.warn('[PerformanceTab] Error loading stored PageSpeed data:', err);
            }
        };
        
        // Try to load stored data
        loadStoredPageSpeedData();
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]); // Re-run when URL changes
    
    // Process page data from props
    React.useEffect(() => {
        // Get data from props - avoid mock data for real metrics
        const data = pageData;
        
        // Don't reset PageSpeed data - that will be handled by storage
        // Only reset if we're not using PageSpeed data
        if (!isUsingPageSpeedData) {
            // Reset state for page metrics only
            setPageSpeedOpportunities([]);
            
            if (!data || !data.metrics) {
                // If no metrics, initialize with placeholder values
                setMetrics({
                    lcp: null,
                    fid: null,
                    cls: null,
                    ttfb: null
                });
                
                // Empty recommendations
                setRecommendations([]);
                return;
            }
            
            // Get normalized metrics with defaults for missing values
            const normalizedMetrics = performanceService.getNormalizedMetrics(data);
            setMetrics(normalizedMetrics);
            
            // Calculate performance score and get evaluation
            const performanceEvaluation = performanceService.calculatePerformanceScore(normalizedMetrics);
            setEvaluation(performanceEvaluation);
            
            // Generate recommendations based on metrics
            const metricRecommendations = performanceService.generateRecommendations(normalizedMetrics);
            setRecommendations(metricRecommendations);
        }
    }, [pageData, isUsingPageSpeedData]);
    
    // Callback when PageSpeed data is fetched
    const handlePageSpeedDataFetched = React.useCallback((pageSpeedData) => {
        if (!pageSpeedData) return;
        
        console.log('[PerformanceTab] PageSpeed data received:', pageSpeedData);
        
        // Update metrics with PageSpeed data
        setMetrics(pageSpeedData.metrics);
        
        // Update evaluation
        const newEvaluation = {
            score: pageSpeedData.score,
            category: pageSpeedData.score >= 90 ? 'Excellent' :
                     pageSpeedData.score >= 70 ? 'Good' :
                     pageSpeedData.score >= 50 ? 'Needs Improvement' : 'Poor',
            description: pageSpeedData.score >= 90 ? 
                         'According to PageSpeed Insights, your page has excellent performance metrics and should load quickly for most users.' :
                         pageSpeedData.score >= 70 ?
                         'PageSpeed Insights shows your page has good performance but there\'s room for improvement.' :
                         pageSpeedData.score >= 50 ?
                         'PageSpeed Insights indicates your page performance needs improvement. Review the recommendations below.' :
                         'PageSpeed Insights shows your page has poor performance metrics. Urgent optimization is recommended.',
            color: pageSpeedData.score >= 90 ? '#10b981' : 
                   pageSpeedData.score >= 50 ? '#f59e0b' : '#ef4444'
        };
        
        setEvaluation(newEvaluation);
        
        // If we have opportunities, use them as recommendations
        if (pageSpeedData.opportunities && pageSpeedData.opportunities.length > 0) {
            const pageSpeedRecommendations = pageSpeedData.opportunities.map(opp => ({
                title: opp.title,
                description: opp.description,
                priority: opp.score < 0.5 ? 'high' : 'medium'
            }));
            
            setRecommendations(pageSpeedRecommendations);
        }
        
        // Mark that we're using PageSpeed data
        setIsUsingPageSpeedData(true);
    }, []);
    
    // Handle opportunities updates
    const handleOpportunitiesUpdated = React.useCallback((opportunities) => {
        setPageSpeedOpportunities(opportunities || []);
    }, []);
    
    // No skipping - we'll display placeholders instead

    // Get current timestamp for data display
    const formattedTime = isUsingPageSpeedData 
        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : null;
    
    // Main content style with consistent spacing
    const mainContentStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#0c111b'
    };
    
    // Render the performance tab with its components
    return React.createElement('div', { style: mainContentStyle },
        // Upper section with PageSpeed and Score
        React.createElement('div', { style: { display: 'flex', gap: '16px', flexDirection: 'column' } },
            // PageSpeed Insights Component
            React.createElement(PageSpeedInsights, { 
                url: url, 
                onPageSpeedDataFetched: handlePageSpeedDataFetched,
                onOpportunitiesUpdated: handleOpportunitiesUpdated
            }),
            
            // Performance Summary Section
            React.createElement(PerformanceScoreCard, {
                score: evaluation.score,
                category: evaluation.category,
                description: evaluation.description,
                color: evaluation.color
            })
        ),
        
        // Data Source Indicator (only show when using PageSpeed data)
        isUsingPageSpeedData && React.createElement('div', {
            style: {
                backgroundColor: '#172554',
                color: '#93c5fd',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                marginTop: '-8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
            }
        }, 
            React.createElement('svg', {
                width: '16',
                height: '16',
                viewBox: '0 0 24 24',
                fill: 'none',
                xmlns: 'http://www.w3.org/2000/svg'
            },
                React.createElement('path', {
                    d: 'M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z',
                    stroke: '#93c5fd',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round'
                })
            ),
            `PageSpeed Insights data | Updated at ${formattedTime}`
        ),
        
        // Core Web Vitals Section (only render if we have metrics)
        metrics && React.createElement(CoreWebVitalsDetail, { metrics }),

        // TTFB Section (only render if we have metrics)
        metrics && React.createElement(ServerResponseTime, { ttfb: metrics.ttfb }),

        // PageSpeed Opportunities Section (below Core Web Vitals)
        isUsingPageSpeedData && pageSpeedOpportunities.length > 0 && 
        React.createElement(PageSpeedOpportunities, { opportunities: pageSpeedOpportunities }),
        
        // Recommendations Section
        recommendations.length > 0 && React.createElement(PerformanceRecommendations, { recommendations })
    );
};
