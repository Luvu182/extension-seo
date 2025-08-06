'use strict';

/**
 * Component for checking link statuses
 * @param {Object} props - Component props
 * @param {boolean} props.isChecking - Whether links are currently being checked
 * @param {Function} props.onCheck - Function to call when check button is clicked
 * @param {string} props.activeTab - Currently active tab
 * @param {boolean} props.isOptimized - Whether optimized checking with Vercel API is enabled
 * @returns {React.Element} Rendered component
 */
export const LinkStatusChecker = ({ isChecking, onCheck, activeTab, isOptimized = false }) => {
    const renderStatusIcon = () => {
        if (isChecking) {
            return React.createElement('span', {
                style: {
                    display: 'inline-block',
                    marginLeft: '4px',
                    animation: 'spin 1s linear infinite'
                }
            }, '⟳');
        }
        
        // When optimized mode is on, show a different icon
        if (isOptimized) {
            return React.createElement('span', { 
                style: { 
                    fontSize: '0.875rem', 
                    marginRight: '4px',
                    color: '#10b981' // green color to show optimized status
                } 
            }, '⚡');
        }
        
        // Regular magnifying glass icon
        return React.createElement('span', { 
            style: { 
                fontSize: '0.875rem', 
                marginRight: '4px' 
            } 
        }, '🔍');
    };
    
    // Create tooltip content
    const tooltipText = isOptimized 
        ? 'Using optimized Vercel API for faster and more accurate link status checks'
        : 'Using standard link checking';
        
    // Main button component
    return React.createElement('div', {
        style: {
            position: 'relative',
            display: 'inline-block'
        }
    }, [
        // Main button
        React.createElement('button', {
            key: 'button',
            style: {
                padding: '6px 12px',
                backgroundColor: isChecking ? 'rgba(100, 116, 139, 0.5)' : 'rgba(59, 130, 246, 0.2)',
                color: isChecking ? '#94a3b8' : '#60a5fa',
                border: 'none',
                borderRadius: '4px',
                cursor: isChecking ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
            },
            onClick: () => !isChecking && onCheck(),
            disabled: isChecking,
            title: tooltipText
        },
            isChecking ?
                React.createElement('span', {}, [
                    React.createElement('span', { key: 'text' }, 'Checking... '),
                    renderStatusIcon()
                ]) :
                React.createElement('span', {}, [
                    renderStatusIcon(),
                    React.createElement('span', { key: 'text' }, `Check ${activeTab !== 'all' ? activeTab + ' ' : ''}Status & Issues`)
                ])
        ),
        
        // Optimized indicator badge (only shown when optimized)
        isOptimized && !isChecking ? 
            React.createElement('span', {
                key: 'badge',
                style: {
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 6px',
                    fontSize: '0.6rem',
                    fontWeight: 'bold'
                },
                title: 'Using Vercel API for optimized status checks'
            }, 'TURBO') : null
    ]);
};
