'use strict';

// Content tab module for SEO AI Assistant
import { styles } from '../styles.js';
import { dataService } from '../data-service.js';
import { HeadingStructure } from '../components/HeadingStructure.js';

// Import new components
import { TextContentTab } from '../components/content/TextContentTab.js';
import { ImageContentTab } from '../components/content/ImageContentTab.js';
import { ContentTabHeader } from '../components/content/ContentTabHeader.js';

/**
 * ContentTab - Main component for the Content tab
 * Uses functional component with hooks for state management
 * 
 * @param {Object} props - Component props
 * @param {Object} props.pageData - SEO data for the current page
 * @returns {React.Element} Rendered component
 */
export const ContentTab = React.memo(({ pageData }) => {
    // State for active tab and header/footer inclusion for images
    const [activeContentTab, setActiveContentTab] = React.useState('text');
    const [includeHeaderFooterImages, setIncludeHeaderFooterImages] = React.useState(false); // Renamed state
    // State for header/footer inclusion for headings (default to false)
    const [includeHeaderFooterHeadings, setIncludeHeaderFooterHeadings] = React.useState(false); 
    
    // Handler for tab change
    const handleTabChange = React.useCallback((tabName) => {
        setActiveContentTab(tabName);
    }, []);
    
    // Handler for toggle header/footer for images
    const toggleHeaderFooterImages = React.useCallback(() => {
        setIncludeHeaderFooterImages(prev => !prev);
    }, []);

    // Handler for toggle header/footer for headings
    const toggleHeaderFooterHeadings = React.useCallback(() => {
        setIncludeHeaderFooterHeadings(prev => !prev);
    }, []);

    // Get the actual data (from props or mock data if not available)
    const data = pageData || dataService.mockData;
    
    return React.createElement('div', { style: styles.spaceY3 },
        // Tab Navigation Header
        React.createElement(ContentTabHeader, {
            activeContentTab,
            handleTabChange
        }),
        
        // Tab Content (based on activeContentTab)
        React.createElement('div', {
            role: 'tabpanel',
            'aria-label': `${activeContentTab} tab content`
        },
            activeContentTab === 'text'
                ? React.createElement(TextContentTab, { 
                    data,
                    includeHeaderFooterHeadings, // Pass new state
                    toggleHeaderFooterHeadings // Pass new handler
                  })
                : React.createElement(ImageContentTab, {
                    data,
                    includeHeaderFooter: includeHeaderFooterImages, // Use renamed state
                    toggleHeaderFooter: toggleHeaderFooterImages // Use renamed handler
                  })
        )
    );
});

/**
 * ImageAnalysisService - Service for image analysis and recommendations
 * Extracts and processes image data
 */
export class ImageAnalysisService {
    /**
     * Extracts images from the page data, handling different data structures
     * @param {Object} pageData - The page data object
     * @returns {Array} Array of image objects
     */
    static getImages(pageData) {
        if (!pageData) return [];
        
        // Check different possible structures
        if (Array.isArray(pageData.images)) {
            return pageData.images;
        }
        
        if (pageData.content && Array.isArray(pageData.content.images)) {
            return pageData.content.images;
        }
        
        // Try to extract from DOM directly if available
        if (pageData.dom && typeof pageData.dom === 'string') {
            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = pageData.dom;
                
                const imgElements = tempDiv.querySelectorAll('img');
                return Array.from(imgElements).map(img => ({
                    src: img.src || img.getAttribute('src') || '',
                    alt: img.alt || img.getAttribute('alt') || '',
                    width: img.width || img.getAttribute('width') || null,
                    height: img.height || img.getAttribute('height') || null
                }));
            } catch (e) {
                console.error('Error extracting images from DOM:', e);
            }
        }
        
        // Last resort: check if images is an object with arrays
        if (typeof pageData.images === 'object' && pageData.images !== null) {
            const possibleArrays = Object.values(pageData.images).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
                return possibleArrays[0];
            }
        }
        
        return [];
    }
    
    /**
     * Analyze images on the page and generate recommendations
     * @param {Array} images - Array of image objects
     * @returns {Array} Array of recommendation objects
     */
    static getImageRecommendations(images) {
        const recommendations = [];
        
        if (!images || images.length === 0) {
            recommendations.push({
                title: 'Add Images to Your Content',
                description: 'Pages with images tend to perform better in search results and have higher engagement.',
                priority: 'medium'
            });
            return recommendations;
        }
        
        const missingAltCount = images.filter(img => !img.alt).length;
        if (missingAltCount > 0) {
            recommendations.push({
                title: 'Add Missing Alt Text',
                description: `${missingAltCount} ${missingAltCount === 1 ? 'image is' : 'images are'} missing alt text. Alt text improves accessibility and helps search engines understand your images.`,
                priority: 'high'
            });
        }
        
        // Check for overly large images
        const largeImages = images.filter(img => 
            img.width && img.height && (img.width > 1500 || img.height > 1500)
        );
        
        if (largeImages.length > 0) {
            recommendations.push({
                title: 'Optimize Large Images',
                description: `${largeImages.length} ${largeImages.length === 1 ? 'image appears' : 'images appear'} to be larger than necessary. Resize and compress them for better page load times.`,
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Get image statistics from page data
     * @param {Object} pageData - The page data object
     * @param {boolean} includeHeaderFooter - Whether to include header and footer images
     * @returns {Object} Image statistics object
     */
    static getImageStats(pageData, includeHeaderFooter = true) {
        // Get the appropriate images based on the includeHeaderFooter flag
        let images;
        if (includeHeaderFooter) {
            images = ImageAnalysisService.getImages(pageData);
        } else {
            images = Array.isArray(pageData.contentOnlyImages) 
                ? pageData.contentOnlyImages 
                : [];
        }
        
        // Calculate stats
        const withAlt = images.filter(img => img.alt || img.hasAlt).length;
        const withoutAlt = images.length - withAlt;
        const nonOptimizedFilenames = images.filter(img => img.hasNonOptimizedFilename).length;
        
        return {
            total: images.length,
            withAlt,
            withoutAlt,
            nonOptimizedFilenames
        };
    }
}

// For backward compatibility, export the class component version
export class ContentTabClass extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeContentTab: 'text',
            includeHeaderFooter: true
        };
    }
    
    render() {
        return React.createElement(ContentTab, this.props);
    }
}

// For backward compatibility, export a functional component alias
export const ContentTabFunctional = ContentTab;
