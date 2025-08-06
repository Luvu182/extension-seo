'use strict';

// Utility functions for SEO AI Assistant

// Helper function to apply styles to an element
export function applyStyles(element, styleObj) {
  for (const property in styleObj) {
    element.style[property] = styleObj[property];
    }
}

// Helper function to create elements with styles
export function createElement(tag, styleObj, textContent, attributes) {
  const element = document.createElement(tag);
  if (styleObj) applyStyles(element, styleObj);
    if (textContent) element.textContent = textContent;
    if (attributes) {
      const eventHandlers = {}; // Lưu các event handler để thêm sau
      
      for (const attr in attributes) {
        // Xử lý các event handler
        if (attr.startsWith('on') && typeof attributes[attr] === 'function') {
          const eventName = attr.substring(2).toLowerCase(); // Bỏ "on" và chuyển thành lowercase
          eventHandlers[eventName] = attributes[attr];
        } else {
          // Các thuộc tính thông thường
          element.setAttribute(attr, attributes[attr]);
        }
      }
      
      // Thêm các event handler sau khi tạo phần tử
      for (const eventName in eventHandlers) {
        element.addEventListener(eventName, eventHandlers[eventName]);
      }
    }
    return element;
}

// Helper function to get color based on score
export function getScoreColor(score) {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 70) return '#60a5fa'; // Blue
    if (score >= 50) return '#f59e0b'; // Yellow/Orange
  return '#ef4444'; // Red
}

// No need for window export anymore
