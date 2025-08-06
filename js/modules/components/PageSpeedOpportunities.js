'use strict';

// Import dependencies
import { styles } from '../styles.js';
import { PageSpeedOpportunity } from './PageSpeedOpportunity.js';

/**
 * Component to display PageSpeed Improvement Opportunities
 * @param {Object} props - Component properties
 * @param {Array} props.opportunities - PageSpeed opportunities
 * @returns {React.Element} - The PageSpeedOpportunities component
 */
export const PageSpeedOpportunities = ({ opportunities }) => {
    // If no opportunities, return null
    if (!opportunities || opportunities.length === 0) {
        return null;
    }
    
    return React.createElement('div', { 
        style: { 
            backgroundColor: '#0f172a', 
            padding: '16px', 
            borderRadius: '8px', 
            marginTop: '16px' 
        } 
    },
        React.createElement('div', { 
            style: { 
                ...styles.cardTitle, 
                color: '#f8fafc', 
                fontSize: '1rem', 
                marginBottom: '12px' 
            } 
        }, 'PageSpeed Improvement Opportunities'),
        
        React.createElement('div', { 
            style: { 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '4px'
            } 
        },
            opportunities.slice(0, 5).map((opportunity, index) => {
                return React.createElement(PageSpeedOpportunity, { 
                    key: opportunity.id || index,
                    title: opportunity.title,
                    description: opportunity.description,
                    score: opportunity.score,
                    displayValue: opportunity.displayValue
                });
            })
        ),
        
        // Show text if there are more opportunities
        opportunities.length > 5 && React.createElement('div', {
            style: {
                fontSize: '0.8rem',
                color: '#94a3b8',
                textAlign: 'center',
                marginTop: '8px'
            }
        }, `+ ${opportunities.length - 5} more opportunities`)
    );
};
