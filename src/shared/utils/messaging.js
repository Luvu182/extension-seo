'use strict';

import { logger } from './logger.js';

/**
 * Utility functions for handling message passing in Chrome extensions
 */
export const messaging = {
  /**
   * Kiểm tra xem Chrome runtime có sẵn sàng không
   * @returns {boolean} - Chrome runtime có sẵn sàng để gửi tin nhắn
   */
  isRuntimeAvailable() {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  },

  /**
   * Send a message to the background script with advanced error handling
   * @param {Object} message - The message to send
   * @param {boolean} expectResponse - Whether to expect a response
   * @param {number} retries - Number of retry attempts (default: 1)
   * @param {number} timeout - Timeout in ms (default: 5000)
   * @returns {Promise} - Resolves with the response or undefined
   */
  sendToBackground(message, expectResponse = true, retries = 1, timeout = 5000) {
    if (!message || typeof message !== 'object') {
      return Promise.reject(new Error('Invalid message'));
    }

    // Kiểm tra xem runtime có sẵn sàng không trước khi thử gửi
    if (!this.isRuntimeAvailable()) {
      logger.error('messaging', 'Chrome runtime not available');
      return Promise.reject(new Error('Chrome runtime not available'));
    }

    // Tạo một bản sao chính xác và an toàn của tin nhắn
    let serializedMessage;
    try {
      serializedMessage = JSON.parse(JSON.stringify(message));
    } catch (err) {
      logger.error('messaging', 'Message serialization failed, creating safe version');
      
      // Tạo phiên bản đơn giản hóa nếu JSON stringify thất bại
      serializedMessage = {
        action: message.action || 'unknown',
        timestamp: Date.now()
      };
      
      // Thử thêm dữ liệu nếu có thể
      if (message.data && typeof message.data === 'object') {
        try {
          serializedMessage.data = { 
            type: typeof message.data,
            summary: 'Data object (simplified)'
          };
        } catch (e) {
          serializedMessage.data = null;
        }
      } else if (message.data !== undefined) {
        serializedMessage.data = String(message.data);
      }
    }

    logger.info('messaging', `Sending message to background: ${serializedMessage.action || 'unknown action'}`);

    // Hàm để thực hiện gửi tin nhắn một cách an toàn với timeout
    const attemptSend = (currentRetry = 0) => {
      return new Promise((resolve, reject) => {
        // Kiểm tra lại một lần nữa trước khi gửi
        if (!this.isRuntimeAvailable()) {
          logger.error('messaging', 'Chrome runtime not available before sending');
          return reject(new Error('Chrome runtime not available'));
        }

        // Tạo timeout promise để race với sendMessage
        const timeoutPromise = new Promise((_, timeoutReject) => {
          setTimeout(() => {
            timeoutReject(new Error(`Message timeout after ${timeout}ms`));
          }, timeout);
        });

        // Promise cho chrome.runtime.sendMessage
        const sendPromise = new Promise((sendResolve) => {
          try {
            chrome.runtime.sendMessage(serializedMessage, response => {
              // Kiểm tra lỗi kết nối
              if (chrome.runtime.lastError) {
                logger.warn('messaging', `Send attempt ${currentRetry + 1} failed:`, 
                  chrome.runtime.lastError.message);
                
                // Resolve với lỗi nhưng không reject promise
                sendResolve({ error: chrome.runtime.lastError, response: null });
              } else {
                logger.info('messaging', 'Received response from background');
                sendResolve({ error: null, response });
              }
            });
          } catch (err) {
            logger.warn('messaging', `Exception in sendMessage (attempt ${currentRetry + 1}):`, err);
            sendResolve({ error: err, response: null });
          }
        });

        // Race giữa timeout và send
        Promise.race([sendPromise, timeoutPromise])
          .then(result => {
            // Nếu là kết quả từ sendPromise
            if (result && typeof result === 'object') {
              if (result.error) {
                // Có lỗi khi gửi
                if (currentRetry < retries) {
                  logger.info('messaging', `Retrying send (${currentRetry + 1}/${retries})`);
                  // Delay trước khi thử lại
                  setTimeout(() => {
                    attemptSend(currentRetry + 1)
                      .then(resolve)
                      .catch(reject);
                  }, 200); // 200ms delay
                } else {
                  // Hết số lần thử lại
                  if (expectResponse) {
                    reject(result.error);
                  } else {
                    // Nếu không cần response, coi như thành công
                    resolve();
                  }
                }
              } else {
                // Gửi thành công
                if (expectResponse) {
                  resolve(result.response);
                } else {
                  resolve();
                }
              }
            } else {
              // Kết quả lạ - không nên xảy ra
              resolve(result);
            }
          })
          .catch(err => {
            // Có thể là lỗi timeout hoặc lỗi khác
            if (currentRetry < retries) {
              logger.info('messaging', `Retrying after error: ${err.message}`);
              setTimeout(() => {
                attemptSend(currentRetry + 1)
                  .then(resolve)
                  .catch(reject);
              }, 200);
            } else {
              if (expectResponse) {
                reject(err);
              } else {
                // Nếu không cần response, coi như thành công
                resolve();
              }
            }
          });
      });
    };

    // Bắt đầu chuỗi gửi tin nhắn
    return attemptSend();
  },

  /**
   * Send a message to a content script with improved reliability
   * @param {number} tabId - The ID of the tab to send to
   * @param {Object} message - The message to send
   * @param {boolean} expectResponse - Whether to expect a response
   * @param {number} retries - Number of retry attempts (default: 1)
   * @param {number} timeout - Timeout in ms (default: 5000)
   * @returns {Promise} - Resolves with the response or undefined
   */
  sendToContent(tabId, message, expectResponse = true, retries = 1, timeout = 5000) {
    if (!tabId) {
      return Promise.reject(new Error('Invalid tabId'));
    }
    
    if (!message || typeof message !== 'object') {
      return Promise.reject(new Error('Invalid message'));
    }

    // Kiểm tra xem chrome tabs API có sẵn sàng không
    if (!this.isRuntimeAvailable() || !chrome.tabs || !chrome.tabs.sendMessage) {
      logger.error('messaging', 'Chrome tabs API not available');
      return Promise.reject(new Error('Chrome tabs API not available'));
    }

    // Tạo một bản sao an toàn của tin nhắn
    let serializedMessage;
    try {
      serializedMessage = JSON.parse(JSON.stringify(message));
    } catch (err) {
      logger.error('messaging', 'Message serialization failed, creating safe version');
      serializedMessage = {
        action: message.action || 'unknown',
        timestamp: Date.now()
      };
    }

    logger.info('messaging', `Sending message to content script (tabId: ${tabId}): ${serializedMessage.action || 'unknown'}`);

    // Hàm để thực hiện gửi tin nhắn với retry
    const attemptSend = (currentRetry = 0) => {
      return new Promise((resolve, reject) => {
        // Kiểm tra lại xem chrome tabs API có sẵn sàng không
        if (!this.isRuntimeAvailable() || !chrome.tabs || !chrome.tabs.sendMessage) {
          logger.error('messaging', 'Chrome tabs API not available');
          return reject(new Error('Chrome tabs API not available'));
        }

        // Kiểm tra xem tab có tồn tại không trước khi gửi
        chrome.tabs.get(tabId, (tabInfo) => {
          if (chrome.runtime.lastError) {
            logger.warn('messaging', `Tab ${tabId} not found or inaccessible:`, chrome.runtime.lastError.message);
            return reject(new Error(`Tab ${tabId} not accessible: ${chrome.runtime.lastError.message}`));
          }

          // Tab tồn tại, tiếp tục với timeout logic
          const timeoutPromise = new Promise((_, timeoutReject) => {
            setTimeout(() => {
              timeoutReject(new Error(`Tab message timeout after ${timeout}ms`));
            }, timeout);
          });

          const sendPromise = new Promise((sendResolve) => {
            try {
              chrome.tabs.sendMessage(tabId, serializedMessage, response => {
                if (chrome.runtime.lastError) {
                  logger.warn('messaging', `Send to tab ${tabId} attempt ${currentRetry + 1} failed:`, 
                    chrome.runtime.lastError.message);
                  sendResolve({ error: chrome.runtime.lastError, response: null });
                } else {
                  logger.info('messaging', `Received response from tab ${tabId}`);
                  sendResolve({ error: null, response });
                }
              });
            } catch (err) {
              logger.warn('messaging', `Exception in tabs.sendMessage (attempt ${currentRetry + 1}):`, err);
              sendResolve({ error: err, response: null });
            }
          });

          // Race giữa timeout và send
          Promise.race([sendPromise, timeoutPromise])
            .then(result => {
              // Xử lý kết quả từ sendPromise
              if (result && typeof result === 'object') {
                if (result.error) {
                  // Có lỗi khi gửi
                  if (currentRetry < retries) {
                    logger.info('messaging', `Retrying send to tab ${tabId} (${currentRetry + 1}/${retries})`);
                    setTimeout(() => {
                      attemptSend(currentRetry + 1)
                        .then(resolve)
                        .catch(reject);
                    }, 200);
                  } else {
                    if (expectResponse) {
                      reject(result.error);
                    } else {
                      resolve();
                    }
                  }
                } else {
                  // Gửi thành công
                  if (expectResponse) {
                    resolve(result.response);
                  } else {
                    resolve();
                  }
                }
              } else {
                // Kết quả không xác định
                resolve(result);
              }
            })
            .catch(err => {
              if (currentRetry < retries) {
                logger.info('messaging', `Retrying tab ${tabId} after error: ${err.message}`);
                setTimeout(() => {
                  attemptSend(currentRetry + 1)
                    .then(resolve)
                    .catch(reject);
                }, 200);
              } else {
                if (expectResponse) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            });
        });
      });
    };

    return attemptSend();
  },

  /**
   * Create a standardized message object
   * @param {string} action - The action type
   * @param {*} data - The message data
   * @param {string} source - The source of the message
   * @returns {Object} - The formatted message object
   */
  createMessage(action, data = null, source = 'unknown') {
    // Ensure data is serializable
    let safeData = null;
    
    try {
      safeData = data ? JSON.parse(JSON.stringify(data)) : null;
    } catch (err) {
      logger.warn('messaging', 'Failed to serialize message data, using simplified version');
      safeData = { error: 'Data could not be serialized', originalType: typeof data };
    }
    
    return {
      action,
      data: safeData,
      source,
      timestamp: Date.now()
    };
  }
};
