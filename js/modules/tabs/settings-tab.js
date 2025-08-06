'use strict';

// Settings tab module for SEO AI Assistant

// Import dependencies
// React is global
import { styles } from '../styles.js';
// No dataService needed

// Helper component for Toggle Switch
const ToggleSwitch = ({ initialChecked, onChange }) => {
    const [isChecked, setIsChecked] = React.useState(initialChecked);

    const handleChange = (event) => {
        const newCheckedState = event.target.checked;
        setIsChecked(newCheckedState);
        if (onChange) {
            onChange(newCheckedState);
        }
    };

    // Use React.createElement
    return React.createElement('label', { style: { display: 'inline-block', position: 'relative', width: '40px', height: '20px', cursor: 'pointer' } },
        React.createElement('input', { style: { opacity: '0', width: '0', height: '0' }, type: 'checkbox', checked: isChecked, onChange: handleChange }),
        React.createElement('span', { style: { position: 'absolute', cursor: 'pointer', top: '0', left: '0', right: '0', bottom: '0', backgroundColor: isChecked ? '#60a5fa' : '#cbd5e1', borderRadius: '10px', transition: 'background-color 0.2s' } },
            React.createElement('span', { style: { position: 'absolute', content: '""', height: '16px', width: '16px', left: isChecked ? '22px' : '2px', bottom: '2px', backgroundColor: 'white', borderRadius: '50%', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } })
        )
    );
};


// Main Component
export const SettingsTab = () => {
    const apiKeyInputRef = React.useRef(null);
    const [message, setMessage] = React.useState({ text: '', type: '' }); // For success/error messages

    const handleSaveApiSettings = () => {
        const apiKey = apiKeyInputRef.current ? apiKeyInputRef.current.value.trim() : '';
        if (apiKey) {
            console.log('Saving API Key (placeholder):', apiKey);
            // In real app: chrome.storage.local.set({ claudeApiKey: apiKey });
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
        } else {
            setMessage({ text: 'Please enter a valid API key.', type: 'error' });
        }
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // Use React.createElement
    return React.createElement('div', { style: styles.spaceY3 },
        // App Settings Section
        React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, 'App Settings'),
            // Theme Setting
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } },
                React.createElement('div', { style: { fontSize: '0.9rem', color: '#f1f5f9' } }, 'Theme'),
                React.createElement('select', { style: { padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: '#f8fafc', color: '#0f172a' }, defaultValue: 'system' },
                    React.createElement('option', { value: 'light' }, 'Light'),
                    React.createElement('option', { value: 'dark' }, 'Dark'),
                    React.createElement('option', { value: 'system' }, 'System Default')
                )
            ),
            // Data Storage Setting
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } },
                React.createElement('div', { style: { fontSize: '0.9rem', color: '#f1f5f9' } }, 'Store Analysis Data'),
                React.createElement(ToggleSwitch, { initialChecked: true, onChange: (checked) => console.log('Store Data:', checked) })
            ),
            // Notifications Setting
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } },
                React.createElement('div', { style: { fontSize: '0.9rem', color: '#f1f5f9' } }, 'Show Notifications'),
                React.createElement(ToggleSwitch, { initialChecked: true, onChange: (checked) => console.log('Notifications:', checked) })
            ),
            // Auto Refresh Setting
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement('div', { style: { fontSize: '0.9rem', color: '#f1f5f9' } }, 'Auto Refresh Data'),
                React.createElement(ToggleSwitch, { initialChecked: false, onChange: (checked) => console.log('Auto Refresh:', checked) })
            )
        ),
        // API Settings Section
        React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, 'API Settings'),
            React.createElement('div', { style: { marginBottom: '12px' } },
                React.createElement('div', { style: { fontSize: '0.9rem', marginBottom: '6px', color: '#f1f5f9' } }, 'Claude AI API Key'),
                React.createElement('input', {
                    ref: apiKeyInputRef,
                    style: { width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.85rem', backgroundColor: '#f8fafc', color: '#0f172a', marginBottom: '6px', boxSizing: 'border-box' },
                    type: 'password',
                    placeholder: 'Enter your API key'
                }),
                React.createElement('div', { style: { fontSize: '0.75rem', color: '#cbd5e1' } }, 'Required for AI-powered suggestions. Get a key from anthropic.com')
            ),
            React.createElement('button', { style: { ...styles.buttonPrimary, marginTop: '12px' }, onClick: handleSaveApiSettings }, 'Save API Settings'),
            // Message Area
            message.text && React.createElement('div', {
                style: {
                    marginTop: '8px', padding: '8px', borderRadius: '4px', fontSize: '0.85rem',
                    backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: message.type === 'success' ? '#065f46' : '#b91c1c'
                }
            }, message.text)
        ),
        // About Section
        React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, 'About'),
            React.createElement('div', { style: { marginBottom: '16px' } },
                React.createElement('div', { style: { fontSize: '1rem', fontWeight: '600', marginBottom: '4px', color: '#f1f5f9' } }, 'SEO AI Assistant'),
                React.createElement('div', { style: { fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' } }, 'Version 1.0.1'), // Placeholder
                React.createElement('div', { style: { fontSize: '0.9rem', lineHeight: '1.4', color: '#e2e8f0' } }, 'A browser extension that analyzes and provides AI-powered recommendations...')
            ),
            React.createElement('div', { style: { fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px' } }, 'Powered by SEO ON TOP'),
            React.createElement('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
                React.createElement('a', { style: { fontSize: '0.85rem', color: '#60a5fa', textDecoration: 'none' }, href: 'https://example.com', target: '_blank' }, 'Website'),
                React.createElement('a', { style: { fontSize: '0.85rem', color: '#60a5fa', textDecoration: 'none' }, href: 'https://example.com/privacy', target: '_blank' }, 'Privacy Policy'),
                React.createElement('a', { style: { fontSize: '0.85rem', color: '#60a5fa', textDecoration: 'none' }, href: 'https://example.com/support', target: '_blank' }, 'Support')
            )
        )
    );
};

// No IIFE needed
