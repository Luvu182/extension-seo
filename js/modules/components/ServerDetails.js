'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

// Define message types constants
const MESSAGE_TYPES = {
    FETCH_SERVER: 'fetchServerDetails'
};

/**
 * Component for displaying server details
 * @param {Object} props - Component props
 * @param {Object} props.data - The page data
 * @param {Object} props.serverDetails - Server details data
 * @param {boolean} props.isLoadingServerDetails - Loading state
 * @param {string} props.serverDetailsError - Error message if any
 * @param {Function} props.onFetchServerDetails - Function to fetch server details
 * @returns {React.Element} - The server details component
 */
export const ServerDetails = ({
    data,
    serverDetails,
    isLoadingServerDetails,
    serverDetailsError,
    onFetchServerDetails
}) => {
    // Helper function to render a detail item
    const renderDetailItem = (label, value, color) => {
        return React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-start', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' } },
            React.createElement('div', { style: { color: '#94a3b8', minWidth: '140px', textAlign: 'left' } }, label),
            React.createElement('div', { style: { color: color || '#e2e8f0', fontWeight: 'normal', textAlign: 'left', flex: '1' } }, value || 'N/A')
        );
    };

    // Render the server details section
    return React.createElement('div', { style: styles.cardSection },
        React.createElement('div', { style: styles.cardTitle }, 'Server Details'),
        React.createElement('p', { style: { fontSize: '0.8rem', color: styles.statLabel.color, marginTop: '4px', marginBottom: '12px', lineHeight: '1.4' } },
            'Provides technical server information (IP, HTTP version, software). Requires an external API call.'
        ),
        React.createElement('div', null,
            // Always show the button
            React.createElement('div', { style: { marginTop: '12px', marginBottom: '16px', textAlign: 'center' } },
                React.createElement('button', {
                    style: { ...styles.actionButton, backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid #60a5fa', color: '#e2e8f0', padding: '8px 20px', fontSize: '0.9rem', display: 'inline-block' },
                    onClick: onFetchServerDetails,
                    disabled: isLoadingServerDetails
                }, isLoadingServerDetails ? 'Loading...' : serverDetails ? 'Refresh Server Info' : 'View Server Info'),
                serverDetailsError && React.createElement('div', { style: { fontSize: '0.85rem', color: '#ef4444', marginTop: '8px' } }, `Error: ${serverDetailsError}`)
            ),

            // Show server details if available
            serverDetails && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' } },
                // Only render the most relevant fields for SEO
                // Core server info (most important for SEO)
                serverDetails.ip && renderDetailItem('IP Address', serverDetails.ip),
                serverDetails.httpVersion && renderDetailItem('HTTP Version', serverDetails.httpVersion),
                serverDetails.serverSoftware && renderDetailItem('Server Software', serverDetails.serverSoftware),

                // If no fields were rendered, show a message
                Object.keys(serverDetails).filter(key => key !== 'rawData' && serverDetails[key]).length === 0 &&
                    React.createElement('div', { style: { fontSize: '0.85rem', color: '#ef4444', textAlign: 'center' } },
                        'No server details available. The API response may be empty or in an unexpected format.'
                    )
            )
        )
    );
};
