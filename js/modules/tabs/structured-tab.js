'use strict';

// Import dependencies
// React is global
import { createElement as h } from '../utils.js'; // Use alias 'h' for React.createElement if preferred, or keep 'createElement'
import { styles } from '../styles.js';
import { dataService } from '../data-service.js';

// Helper component for expandable JSON details
const ExpandableJsonDetails = ({ item }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Get JSON content based on type
    let jsonContent = "No raw data available";
    let structureInfo = "";

    if (item.raw) {
        try {
            const parsedJson = JSON.parse(item.raw);
            jsonContent = JSON.stringify(parsedJson, null, 2);
            // Determine structureInfo based on type (same logic as before)
            const type = item.type || "";
             switch (type) {
               case "Article": structureInfo = "mainEntityOfPage, headline, image, description, datePublished, dateModified, commentCount, author, publisher"; break;
               case "WebPage": structureInfo = "@id, url, inLanguage, name, datePublished, dateModified, publisher, description, isPartOf, author, commentCount"; break;
               case "Organization": structureInfo = "@id, name, url, logo, contactPoint, sameAs"; break;
               case "WebSite": structureInfo = "@id, name, alternateName, url, potentialAction"; break;
               case "BreadcrumbList": structureInfo = "itemListElement"; break;
               case "VideoObject": structureInfo = "name, description, thumbnailUrl, uploadDate, duration, embedUrl, interactionCount, publisher, interactionStatistic, regionsAllowed"; break;
               // Add other cases as needed
               default: structureInfo = item.properties ? item.properties.join(", ") : "";
             }
        } catch (e) {
            console.error("Error parsing JSON:", e);
            jsonContent = item.raw; // Show raw if parsing fails
        }
    } else if (item.properties && item.properties.length) {
        jsonContent = `Properties: ${item.properties.join(", ")}`;
        structureInfo = item.properties.join(", ");
    }

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // Use React.createElement
    return React.createElement('div', { style: { background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '0.25rem', marginBottom: '8px', cursor: 'pointer' }, onClick: toggleExpand },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { fontSize: '0.875rem', color: 'white' } }, item.type || "Unknown Type"),
            React.createElement('div', { style: { fontSize: '0.75rem', color: '#94a3b8' } }, isExpanded ? '▲' : '▼')
        ),
        React.createElement('div', { style: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' } },
            `Properties: ${Array.isArray(item.properties) ? item.properties.join(', ') : "N/A"}`
        ),
        isExpanded && React.createElement('div', { style: { backgroundColor: '#1f2937', padding: '12px', borderRadius: '0.25rem', marginTop: '8px', overflow: 'auto', maxHeight: '300px' } },
            structureInfo && React.createElement('div', { style: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '6px 8px', borderRadius: '0.25rem', marginBottom: '8px' } },
                React.createElement('div', { style: { fontSize: '0.875rem', color: '#60a5fa', marginBottom: '4px', fontWeight: '500' } }, 'Expected Properties:'),
                React.createElement('div', { style: { fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.5' } }, structureInfo)
            ),
            React.createElement('pre', { style: { margin: 0, fontSize: '0.875rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.5' } }, jsonContent)
        )
    );
};


// Main Component
export const StructuredTab = ({ pageData }) => {
    const data = pageData || dataService.mockData;
    const jsonLdData = data.structured?.jsonLd || [];
    const microdataData = data.structured?.microdata || [];
    const rdfaData = data.structured?.rdfa || [];
    const totalStructuredData = jsonLdData.length + microdataData.length + rdfaData.length;

    const handleCopyJsonLd = () => {
        if (jsonLdData.length > 0 && jsonLdData[0].raw) {
            try {
                navigator.clipboard.writeText(jsonLdData[0].raw).then(() => {
                    alert("First JSON-LD copied to clipboard!");
                }, (err) => {
                    alert("Error copying JSON-LD: " + err);
                });
            } catch (e) {
                alert("Error copying JSON-LD: " + e.message);
            }
        }
    };

    const handleValidateSchema = () => {
        window.open(`https://validator.schema.org/`, '_blank');
    };

    if (totalStructuredData === 0) {
        // Use React.createElement
        return React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' } },
                React.createElement('div', { style: { fontSize: '2rem', color: '#f59e0b', marginBottom: '12px' } }, '⚠️'),
                React.createElement('div', { style: { fontSize: '1rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' } }, 'No Structured Data Found'),
                React.createElement('div', { style: { fontSize: '0.875rem', color: '#94a3b8', maxWidth: '300px' } }, 'This page does not contain any structured data (JSON-LD, Microdata, or RDFa). Adding structured data can improve how your page appears in search results.')
            )
        );
    }

    // Use React.createElement
    return React.createElement('div', { style: styles.spaceY3 },
        // JSON-LD Section
        jsonLdData.length > 0 && React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, `JSON-LD Types (${jsonLdData.length})`),
            jsonLdData.map((item, index) => React.createElement(ExpandableJsonDetails, { key: `jsonld-${index}`, item: item }))
        ),
        // Microdata Section
        microdataData.length > 0 && React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, `Microdata (${microdataData.length})`),
            microdataData.map((item, index) => React.createElement(ExpandableJsonDetails, { key: `microdata-${index}`, item: item }))
        ),
        // RDFa Section
        rdfaData.length > 0 && React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, `RDFa (${rdfaData.length})`),
            rdfaData.map((item, index) => React.createElement(ExpandableJsonDetails, { key: `rdfa-${index}`, item: item }))
        ),
        // Action Buttons
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
            jsonLdData.length > 0 && jsonLdData[0].raw && React.createElement('button', { style: { ...styles.buttonPrimary, flex: 1 }, onClick: handleCopyJsonLd }, 'Copy First JSON-LD'),
            React.createElement('button', { style: { ...styles.buttonPrimary, flex: 1 }, onClick: handleValidateSchema }, 'Validate Schema')
        )
    );
};

// No IIFE needed
