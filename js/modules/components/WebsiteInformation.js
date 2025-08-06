'use strict';

// Import dependencies
import { styles } from '../styles.js';
import { robotsService } from '../services/robots-service.js';
import { sitemapService } from '../services/sitemap-service.js';

/**
 * Component for displaying website information
 * @param {Object} data - The page data containing website information
 * @returns {React.Element} - The website information component
 */
export const WebsiteInformation = ({ data }) => {
    // State for robots.txt and sitemap data
    const [robotsStatus, setRobotsStatus] = React.useState({ loading: true, data: null });
    const [sitemapStatus, setSitemapStatus] = React.useState({ loading: true, data: null });
    const [isCurrentUrlAllowed, setIsCurrentUrlAllowed] = React.useState({ loading: true, allowed: true });
    // Create a health check item with status indicator
    const createHealthCheckItem = (label, value, status) => {
        const statusColors = {
            good: { bg: '#d1fae5', text: '#065f46', icon: '✓' },
            warning: { bg: '#fff7ed', text: '#9a3412', icon: '⚠️' },
            bad: { bg: '#fee2e2', text: '#991b1b', icon: '✕' },
            info: { bg: '#e0f2fe', text: '#075985', icon: 'ℹ️' }
        };
        const color = statusColors[status] || statusColors.info;

        return React.createElement('div', { key: label, style: { ...styles.lightBlock, backgroundColor: color.bg, padding: '8px 12px', minWidth: '100px', flexGrow: '1', flexBasis: 'calc(25% - 8px)' } },
            React.createElement('div', { style: { fontSize: '0.75rem', color: '#4b5563', marginBottom: '4px' } }, label),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                React.createElement('span', { style: { color: color.text, fontSize: '0.75rem' } }, color.icon),
                React.createElement('div', { style: { fontSize: '0.9rem', fontWeight: '600', color: color.text } }, value)
            )
        );
    };

    // Extract data for website information
    const httpStatus = data.statusCode || 200;
    const isNoindex = data.robots?.isNoindex;
    const robotsIndexable = !isNoindex;
    const isNofollow = data.robots?.isNofollow;
    const robotsFollowable = !isNofollow;
    let canonicalValid = data.canonical?.valid !== undefined ? data.canonical.valid : !!data.canonical?.url;
    const isMobileFriendly = data.mobileFriendly?.isMobileFriendly;
    const isSecure = data.security?.isSecure;
    const hasAmp = data.amp?.hasAmp;
    const language = data.language || 'Not specified';

    // Create a detail row for additional information
    const createDetailRow = (label, value, status = null) => {
        return React.createElement('div', { style: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' } },
            React.createElement('div', { style: { fontWeight: '600', fontSize: '0.85rem', width: '100px', color: '#e2e8f0' } }, label),
            status ?
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', flex: 1 } },
                    React.createElement('span', { style: { color: status === 'good' ? '#4ade80' : status === 'warning' ? '#fb923c' : status === 'bad' ? '#f87171' : '#7dd3fc', fontSize: '0.75rem' } },
                        status === 'good' ? '✓' : status === 'warning' ? '⚠️' : status === 'bad' ? '✕' : 'ℹ️'),
                    React.createElement('div', { style: { fontSize: '0.85rem', flex: '1', wordBreak: 'break-all', color: '#f8fafc' } }, value)
                ) :
                React.createElement('div', { style: { fontSize: '0.85rem', flex: '1', wordBreak: 'break-all', color: '#f8fafc' } }, value)
        );
    };

    // Fetch robots.txt and sitemap data when component mounts or URL changes
    React.useEffect(() => {
        if (!data || !data.url) return;

        // Fetch robots.txt data
        const fetchRobotsData = async () => {
            try {
                setRobotsStatus({ loading: true, data: null });
                const robotsData = await robotsService.fetchRobotsTxt(data.url);
                setRobotsStatus({ loading: false, data: robotsData });

                // Check if current URL is allowed
                const allowedResult = await robotsService.isUrlAllowed(data.url);
                setIsCurrentUrlAllowed({ loading: false, allowed: allowedResult.allowed, reason: allowedResult.reason });
            } catch (error) {
                console.error('[WebsiteInformation] Error fetching robots data:', error);
                setRobotsStatus({ loading: false, error: error.message });
                setIsCurrentUrlAllowed({ loading: false, allowed: true, reason: 'Error checking robots.txt' });
            }
        };

        // Fetch sitemap data
        const fetchSitemapData = async () => {
            try {
                setSitemapStatus({ loading: true, data: null });
                const sitemapData = await sitemapService.findSitemap(data.url);
                setSitemapStatus({ loading: false, data: sitemapData });
            } catch (error) {
                console.error('[WebsiteInformation] Error fetching sitemap data:', error);
                setSitemapStatus({ loading: false, error: error.message });
            }
        };

        fetchRobotsData();
        fetchSitemapData();
    }, [data?.url]);

    // Prepare canonical URL display
    const canonicalUrl = data.canonical?.url || 'Not specified';

    // Prepare robots.txt status display
    const robotsAllowedStatus = isCurrentUrlAllowed.loading ? 'Loading...' :
        isCurrentUrlAllowed.allowed ? 'Allowed' : 'Blocked';
    const robotsAllowedStatusType = isCurrentUrlAllowed.loading ? 'info' :
        isCurrentUrlAllowed.allowed ? 'good' : 'bad';

    // Prepare sitemap URL display
    const sitemapUrl = sitemapStatus.loading ? 'Loading...' :
        sitemapStatus.data?.exists ? sitemapStatus.data.url : 'Not found';
    const sitemapStatusType = sitemapStatus.loading ? 'info' :
        sitemapStatus.data?.exists ? 'good' : 'warning';

    // Render the website information section
    return React.createElement('div', { style: styles.cardSection },
        React.createElement('div', { style: styles.cardTitle }, 'Website Information'),
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', justifyContent: 'space-between' } },
            createHealthCheckItem('HTTP Status', httpStatus.toString(), httpStatus === 200 ? 'good' : httpStatus < 400 ? 'warning' : 'bad'),
            createHealthCheckItem('Indexable', robotsIndexable ? 'Yes' : 'No', robotsIndexable ? 'good' : 'bad'),
            createHealthCheckItem('Followable', robotsFollowable ? 'Yes' : 'No', robotsFollowable ? 'good' : 'bad'),
            createHealthCheckItem('Canonical', canonicalValid ? 'Valid' : 'Missing/Invalid', canonicalValid ? 'good' : 'warning')
        ),
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', justifyContent: 'space-between' } },
            createHealthCheckItem('Mobile Friendly', isMobileFriendly ? 'Yes' : 'No', isMobileFriendly ? 'good' : 'warning'),
            createHealthCheckItem('Secure (HTTPS)', isSecure ? 'Yes' : 'No', isSecure ? 'good' : 'bad'),
            createHealthCheckItem('AMP', hasAmp ? 'Yes' : 'No', hasAmp ? 'info' : 'info'),
            createHealthCheckItem('Language', language, 'info')
        ),
        // Additional details section
        React.createElement('div', { style: { marginTop: '12px' } },
            createDetailRow('Canonical', canonicalUrl),
            createDetailRow('Robots.txt', robotsAllowedStatus, robotsAllowedStatusType),
            createDetailRow('Sitemap', sitemapUrl, sitemapStatusType)
        )
    );
};
