'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';
import { performanceService } from '../services/performance-service.js';
import { PageSpeedOpportunity } from './PageSpeedOpportunity.js';

/**
 * Component to display PageSpeed Insights data and controls
 * @param {Object} props - Component properties
 * @param {string} props.url - Current URL to analyze
 * @param {function} props.onPageSpeedDataFetched - Callback when data is fetched
 * @returns {React.Element} - The PageSpeedInsights component
 */
export const PageSpeedInsights = ({ url, onPageSpeedDataFetched, onOpportunitiesUpdated }) => {
    // Use React hooks for state management
    const [strategy, setStrategy] = React.useState('mobile');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [pageSpeedData, setPageSpeedData] = React.useState(performanceService.pageSpeedData);
    const [analysisStage, setAnalysisStage] = React.useState(null);
    
    // Run analysis button click handler
    const handleRunAnalysis = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Show progressive loading stages
            setAnalysisStage('requesting');
            
            // Set timeouts for different stages to show progress
            setTimeout(() => {
                if (isLoading) setAnalysisStage('analyzing');
            }, 1500);
            
            setTimeout(() => {
                if (isLoading) setAnalysisStage('processing');
            }, 4000);
            
            setTimeout(() => {
                if (isLoading) setAnalysisStage('finalizing');
            }, 8000);
            
            const data = await performanceService.fetchPageSpeedData(url, strategy);
            
            setPageSpeedData(data);
            setAnalysisStage('complete');
            setIsLoading(false);
            
            // Call the callback if provided
            if (typeof onPageSpeedDataFetched === 'function') {
                onPageSpeedDataFetched(data);
            }
            
            // Pass opportunities to parent component
            if (typeof onOpportunitiesUpdated === 'function' && data && data.opportunities) {
                onOpportunitiesUpdated(data.opportunities);
            }
        } catch (err) {
            console.error('[PageSpeedInsights] Analysis error:', err);
            setError(err.message || 'Failed to run PageSpeed analysis');
            setIsLoading(false);
            setAnalysisStage(null);
        }
    }, [url, strategy, onPageSpeedDataFetched, onOpportunitiesUpdated, isLoading]);
    
    // Strategy toggle handler
    const handleStrategyChange = React.useCallback((e) => {
        setStrategy(e.target.value);
    }, []);
    
    // Define button styles for different states
    const analyzeButtonStyle = {
        ...styles.button,
        padding: '10px 16px',
        backgroundColor: isLoading ? '#475569' : '#3b82f6',
        cursor: isLoading ? 'default' : 'pointer',
        opacity: isLoading ? 0.8 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        border: 'none',
        fontWeight: '600',
        fontSize: '0.9rem',
        color: '#ffffff',
        transition: 'all 0.2s ease'
    };
    
    // Define strategy toggle styles
    const strategyToggleContainerStyle = {
        display: 'flex',
        marginBottom: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '6px',
        padding: '2px',
        width: '160px'
    };
    
    const strategyOptionStyle = (isSelected) => ({
        flex: 1,
        padding: '8px',
        textAlign: 'center',
        fontSize: '0.85rem',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#3b82f6' : 'transparent',
        color: isSelected ? '#ffffff' : '#94a3b8',
        borderRadius: '4px',
        transition: 'all 0.2s ease-in-out',
        fontWeight: isSelected ? '600' : '400'
    });
    
    // Create the radio button inputs for strategy selection
    const renderStrategyOptions = () => {
        return React.createElement('div', { style: strategyToggleContainerStyle },
            React.createElement('label', { 
                style: strategyOptionStyle(strategy === 'mobile'),
                onClick: () => setStrategy('mobile')
            },
                React.createElement('input', {
                    type: 'radio',
                    name: 'strategy',
                    value: 'mobile',
                    checked: strategy === 'mobile',
                    onChange: handleStrategyChange,
                    style: { display: 'none' }
                }),
                'Mobile'
            ),
            React.createElement('label', { 
                style: strategyOptionStyle(strategy === 'desktop'),
                onClick: () => setStrategy('desktop')
            },
                React.createElement('input', {
                    type: 'radio',
                    name: 'strategy',
                    value: 'desktop',
                    checked: strategy === 'desktop',
                    onChange: handleStrategyChange,
                    style: { display: 'none' }
                }),
                'Desktop'
            )
        );
    };
    
    // Render loading indicator
    const renderLoadingIndicator = () => {
        return React.createElement('div', { style: { width: '20px', height: '20px', marginRight: '8px' } },
            React.createElement('svg', {
                width: '20',
                height: '20',
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg',
                style: { animation: 'spin 1s linear infinite' }
            },
                React.createElement('style', null, `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `),
                React.createElement('path', {
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    d: 'M12 2C6.477 2 2 6.477 2 12c0 1.81.483 3.504 1.322 4.966M12 2c5.523 0 10 4.477 10 10 0 5.043-3.754 9.208-8.618 9.891'
                })
            )
        );
    };
    
    // Render analysis stage indicator
    const renderAnalysisStage = () => {
        if (!isLoading || !analysisStage) return null;
        
        const messages = {
            'requesting': 'Đang yêu cầu phân tích từ Google PageSpeed...',
            'analyzing': 'Đang phân tích hiệu năng trang web...',
            'processing': 'Đang xử lý dữ liệu kết quả...',
            'finalizing': 'Sắp hoàn tất, đang tổng hợp báo cáo...',
            'complete': 'Phân tích hoàn tất!'
        };
        
        return React.createElement('div', {
            style: {
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: '#0f172a',
                fontSize: '0.9rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
            }
        }, renderLoadingIndicator(), messages[analysisStage]);
    };
    
    // Render error message with more details and troubleshooting steps
    const renderError = () => {
        if (!error) return null;
        
        const errorContainerStyle = {
            backgroundColor: '#7f1d1d',
            color: '#fecaca',
            padding: '12px',
            borderRadius: '4px',
            marginTop: '12px',
            fontSize: '0.9rem',
            lineHeight: '1.4'
        };
        
        // Add specific error message based on the error type
        let errorMessage = `Error: ${error}`;
        let troubleshootingSteps = "";
        
        if (error.includes("403")) {
            troubleshootingSteps = "This may be due to API quota limits or authentication issues. Try again later or with a different API key.";
        } else if (error.includes("404")) {
            troubleshootingSteps = "The URL you're trying to analyze could not be found or accessed by PageSpeed Insights.";
        } else if (error.includes("429")) {
            troubleshootingSteps = "You've exceeded the API's rate limit. Please wait a few minutes before trying again.";
        } else if (error.includes("500")) {
            troubleshootingSteps = "Google's PageSpeed Insights server encountered an error. This could be due to complexity of the page or temporary server issues. Try analyzing a different page or try again later.";
        } else if (error.includes("timeout") || error.includes("Network Error")) {
            troubleshootingSteps = "Network connection issue. Check your internet connection and try again.";
        }
        
        return React.createElement('div', { style: errorContainerStyle },
            React.createElement('div', { style: { marginBottom: '8px', fontWeight: '600' } }, errorMessage),
            troubleshootingSteps && React.createElement('div', null, troubleshootingSteps),
            React.createElement('div', { 
                style: { 
                    marginTop: '8px', 
                    fontSize: '0.8rem', 
                    color: '#fecaca', 
                    opacity: 0.8 
                } 
            }, "You can continue using the extension's built-in performance metrics below.")
        );
    };
    
    // Render analyze button
    const renderAnalyzeButton = () => {
        return React.createElement('button', 
            { 
                style: analyzeButtonStyle, 
                onClick: handleRunAnalysis,
                disabled: isLoading
            },
            isLoading && renderLoadingIndicator(),
            isLoading ? 'Analyzing...' : 'Run PageSpeed Analysis'
        );
    };
    
    // Render explanation about PageSpeed Insights
    const renderExplanation = () => {
        return React.createElement('div', {
            style: {
                fontSize: '0.85rem',
                color: '#94a3b8',
                marginTop: '12px',
                lineHeight: '1.4'
            }
        }, 
        React.createElement('p', null, 'PageSpeed Insights analyzes the content of a web page, then generates suggestions to make that page faster. Select a device type and click "Run PageSpeed Analysis" to start.'),
        React.createElement('p', { 
            style: { 
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8rem'
            } 
        }, 
            React.createElement('span', { 
                style: { 
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    marginRight: '6px',
                    flexShrink: 0,
                    position: 'relative'
                } 
            }, 
                React.createElement('span', {
                    style: {
                        position: 'absolute',
                        color: 'white',
                        fontSize: '11px',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 'bold'
                    }
                }, 'i')
            ),
            'This feature uses Google\'s PageSpeed Insights API and requires internet access. Results may vary based on network conditions.'
        ),
        error && error.includes('500') && React.createElement('p', {
            style: {
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#1e293b',
                borderRadius: '4px',
                fontSize: '0.8rem'
            }
        }, '💡 Tip: If you\'re seeing server errors (500), it may be because PageSpeed Insights has difficulty analyzing certain pages. Consider trying a different page or trying again later.'));
    };
    
    // Không hiển thị cơ hội cải thiện trực tiếp trong component PageSpeedInsights nữa
    // Thay vào đó, sẽ chuyển sang PerformanceTab để hiển thị ở vị trí thích hợp
    const getOpportunities = () => {
        if (!pageSpeedData || !pageSpeedData.opportunities) {
            return [];
        }
        return pageSpeedData.opportunities;
    };
    
    return React.createElement('div', { style: { 
        backgroundColor: '#0f172a', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    } },
        React.createElement('div', { 
            style: { 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
            } 
        },
            React.createElement('div', { 
                style: { 
                    ...styles.cardTitle, 
                    color: '#f8fafc', 
                    fontSize: '1rem', 
                    margin: 0 
                } 
            }, 'PageSpeed Insights Analysis'),
            
            // Strategy selection
            renderStrategyOptions()
        ),
        
        React.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }
        },
            // Run analysis button
            React.createElement('div', { style: { flex: 1 } }, renderAnalyzeButton()),
            
            // Add link to open in PageSpeed Insights
            !isLoading && pageSpeedData && React.createElement('a', {
                href: `https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}`,
                target: '_blank',
                rel: 'noopener noreferrer',
                style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 12px',
                    backgroundColor: '#334155',
                    color: '#e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    fontWeight: '500'
                }
            }, 
                React.createElement('span', { 
                    style: { marginRight: '4px' } 
                }, '↗'),
                'View Full Report'
            )
        ),
        
        // Analysis stage indicator
        renderAnalysisStage(),
        
        // Error message
        renderError(),
        
        // Explanation text (simpler to save space)
        !pageSpeedData && !isLoading && React.createElement('div', {
            style: {
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginTop: '4px'
            }
        }, 'Use PageSpeed Insights to analyze performance. Select mobile or desktop, then click Run Analysis.')
    );
};
