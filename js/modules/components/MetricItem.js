'use strict';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component to render a performance metric with progress bar
 * @param {Object} props - Component properties
 * @param {string} props.label - Metric label
 * @param {string} props.value - Metric value
 * @param {string} props.color - Color for the metric
 * @param {number} props.percentage - Percentage for progress bar
 * @param {string} props.description - Optional description of the metric
 * @param {Array} props.thresholds - Optional thresholds for the metric
 * @returns {React.Element} - The MetricItem component
 */
export const MetricItem = ({ 
    label, 
    value, 
    color, 
    percentage, 
    description,
    thresholds 
}) => {
    // Render thresholds markers if provided
    const renderThresholds = () => {
        if (!thresholds || thresholds.length === 0) return null;
        
        return React.createElement('div', { 
            style: { 
                position: 'relative', 
                height: '14px', 
                marginTop: '-14px' 
            } 
        },
            thresholds.map((threshold, index) => 
                React.createElement('div', {
                    key: index,
                    style: {
                        position: 'absolute',
                        left: `${threshold.position}%`,
                        height: '6px',
                        width: '2px',
                        backgroundColor: threshold.color || '#64748b',
                        bottom: '0',
                    }
                },
                    React.createElement('div', {
                        style: {
                            position: 'absolute',
                            fontSize: '0.65rem',
                            color: threshold.color || '#64748b',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap'
                        }
                    }, threshold.label)
                )
            )
        );
    };
    
    // Main component structure
    return React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('div', { 
            style: { 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.85rem', 
                marginBottom: '6px',
                alignItems: 'center'
            } 
        },
            React.createElement('span', { style: { color: '#e2e8f0', fontWeight: '500' } }, label),
            React.createElement('span', { 
                style: { 
                    color: color,
                    fontWeight: '600',
                    backgroundColor: `${color}15`, // Very transparent version of color
                    padding: '2px 8px',
                    borderRadius: '4px',
                }
            }, value)
        ),
        React.createElement('div', { 
            style: { 
                ...styles.progressBar, 
                height: '6px', 
                backgroundColor: '#1e293b',
                borderRadius: '3px',
                overflow: 'hidden'
            } 
        },
            React.createElement('div', { 
                style: { 
                    ...styles.progressFill, 
                    backgroundColor: color, 
                    width: `${percentage}%`,
                    height: '100%',
                    borderRadius: '3px'
                } 
            })
        ),
        renderThresholds(),
        description && React.createElement('div', { 
            style: { 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                marginTop: '6px', 
                lineHeight: '1.3' 
            } 
        }, description)
    );
};
