'use strict';

import { styles } from '../../styles.js';

/**
 * Component for filtering images by issue type
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of image objects
 * @param {string} props.activeFilter - Currently active filter ('all', 'missingAlt', 'nonOptimizedFilename')
 * @param {Function} props.onFilterChange - Function to call when filter changes
 * @returns {React.Element} Rendered component
 */
export const ImageStatusFilter = React.memo(({ images, activeFilter, onFilterChange }) => {

    // Calculate counts for each filter type
    const getFilterCounts = () => {
        const counts = {
            all: images.length,
            missingAlt: 0,
            nonOptimizedFilename: 0,
            // Add more potential filters here later if needed (e.g., largeFileSize, missingDimensions)
        };

        if (!Array.isArray(images)) {
            console.warn("ImageStatusFilter received non-array images:", images);
            return counts; // Return default counts if images is not an array
        }

        images.forEach(img => {
            if (!img.alt && !img.hasAlt) {
                counts.missingAlt++;
            }
            if (img.hasNonOptimizedFilename) {
                counts.nonOptimizedFilename++;
            }
        });

        // Filter out options with zero count (except 'all')
        return Object.entries(counts)
            .filter(([key, count]) => key === 'all' || count > 0)
            .reduce((obj, [key, count]) => {
                obj[key] = count;
                return obj;
            }, {});
    };

    const filterCounts = getFilterCounts();

    // Define filter options - these will become buttons
    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'missingAlt', label: 'Missing Alt' },
        { value: 'nonOptimizedFilename', label: 'Bad Filename' },
        // Add more filters here if needed
    ];

    // Style for the filter container
    const filterContainerStyle = {
        display: 'flex',
        gap: '4px', // Spacing between buttons
        // Removed marginBottom as it's handled by the parent container now
    };

    // Style for individual filter buttons
    const getButtonStyle = (filterValue) => ({
        padding: '4px 8px',
        fontSize: '0.75rem',
        border: '1px solid',
        borderRadius: '4px',
        cursor: 'pointer',
        backgroundColor: activeFilter === filterValue ? '#e0f2fe' : '#f8fafc', // Light blue active, default bg otherwise
        borderColor: activeFilter === filterValue ? '#7dd3fc' : '#cbd5e1', // Blue border active, gray otherwise
        color: activeFilter === filterValue ? '#0ea5e9' : '#64748b', // Blue text active, gray otherwise
        fontWeight: activeFilter === filterValue ? '600' : 'normal',
        whiteSpace: 'nowrap', // Prevent wrapping
        opacity: filterCounts[filterValue] === 0 && filterValue !== 'all' ? 0.5 : 1, // Dim if count is 0 (except 'all')
        pointerEvents: filterCounts[filterValue] === 0 && filterValue !== 'all' ? 'none' : 'auto', // Disable click if count is 0
        transition: 'all 0.1s ease-in-out',
    });

    // Render the filter buttons horizontally
    return React.createElement('div', { style: filterContainerStyle },
        filterOptions.map(option => {
            const count = filterCounts[option.value];
            // Only render button if it's 'all' or has a count > 0
            if (option.value === 'all' || count > 0) {
                return React.createElement('button', {
                    key: option.value,
                    style: getButtonStyle(option.value),
                    onClick: () => onFilterChange(option.value),
                    'aria-pressed': activeFilter === option.value, // Accessibility
                    title: `${option.label} (${count})` // Tooltip with count
                }, 
                    `${option.label} (${count})`
                );
            }
            return null; // Don't render button if count is 0
        })
    );
});
