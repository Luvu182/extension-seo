'use strict';

/**
 * Component to display a loading spinner and message
 * 
 * @param {Object} props Component props
 * @param {string} props.message Custom loading message
 * @returns {React.Element} The loading display component
 */
export const LoadingDisplay = ({ message = 'Đang tải...' }) => {
  // Container styles for centered loading display
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '250px',
    textAlign: 'center',
    padding: '0 20px'
  };

  // Spinner styles with animation
  const spinnerStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#2563eb',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  };

  // Text styles with fade-in animation
  const textStyle = {
    fontSize: '16px',
    color: 'white',
    animation: 'fadeIn 0.5s ease-out'
  };

  return React.createElement('div', 
    { style: containerStyle },
    // Spinner element
    React.createElement('div', 
      { style: spinnerStyle }
    ),
    // Loading message
    React.createElement('div', 
      { style: textStyle }, 
      message
    )
  );
};