'use strict';

// UI helpers for SEO AI Assistant

// Import dependencies
import { createElement } from './utils.js'; // Assuming utils.js is in the same directory

// Hiển thị trạng thái đang tải
export function showLoading(container) {
  container.innerHTML = '';

  const loadingContainer = createElement('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px'
  });

  const spinner = createElement('div', {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#3b82f6',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  });

  const loadingText = createElement('div', {
    fontSize: '0.875rem',
    color: '#d1d5db'
  }, 'Đang phân tích SEO trang web...');

  loadingContainer.appendChild(spinner);
  loadingContainer.appendChild(loadingText);
  container.appendChild(loadingContainer);
}

// Hiển thị thông báo
export function showNotification(container, message, type = 'info') {
  const notificationContainer = createElement('div', {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: type === 'info' ? 'rgba(59, 130, 246, 0.9)' :
                    type === 'warning' ? 'rgba(245, 158, 11, 0.9)' :
                    'rgba(239, 68, 68, 0.9)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontSize: '0.875rem',
    zIndex: '1000',
    maxWidth: '80%',
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease-out'
  }, message);

  document.body.appendChild(notificationContainer);

  // Tự động xóa thông báo sau 5 giây
  setTimeout(() => {
    notificationContainer.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      if (notificationContainer.parentNode) {
        document.body.removeChild(notificationContainer);
      }
    }, 300);
  }, 5000);
}

// Hiển thị lỗi
export function showError(container, error) {
  container.innerHTML = '';

  const errorContainer = createElement('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '0 16px',
    textAlign: 'center'
  });

  const errorIcon = createElement('div', {
    fontSize: '2rem',
    color: '#ef4444',
    marginBottom: '16px'
  }, '❌');

  const errorTitle = createElement('div', {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '8px'
  }, 'Không thể tải dữ liệu SEO');

  const errorMessage = createElement('div', {
    fontSize: '0.875rem',
    color: '#d1d5db'
  }, error?.message || 'Đã xảy ra lỗi khi phân tích trang web. Vui lòng thử lại.');

  const retryButton = createElement('button', {
    marginTop: '16px',
    padding: '8px 16px',
    background: 'linear-gradient(to right, #2563eb, #9333ea)',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.875rem'
  }, 'Thử lại', {
    onClick: () => {
      // We need a way to trigger refresh without relying on the global namespace
      // For now, let's just log it. This needs further refactoring.
      console.log("Retry button clicked - refresh logic needs update");
      // Potential future approach: Dispatch an action to the store
      // store.dispatch({ type: 'REFRESH_DATA_REQUESTED' });
    }
  });

  errorContainer.appendChild(errorIcon);
  errorContainer.appendChild(errorTitle);
  errorContainer.appendChild(errorMessage);
  errorContainer.appendChild(retryButton);
  container.appendChild(errorContainer);
}

// No need for window export anymore
