# Sửa lỗi kết nối "Receiving end does not exist" trong Extension

## Vấn đề
Extension thường xuyên gặp lỗi kết nối với thông báo:
```
Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
```

Lỗi này xuất hiện khi extension cố gắng gửi thông điệp từ content script hoặc background script nhưng không thể thiết lập kết nối với đầu nhận (receiving end).

## Nguyên nhân
1. Thông điệp được gửi đến một tab không còn tồn tại
2. Thông điệp được gửi đến một phần của extension không hoạt động
3. Lỗi trong quá trình xử lý thông điệp không được bắt đúng cách
4. Thiếu cơ chế kiểm tra kết nối trước khi gửi thông điệp

## Giải pháp

### 1. Cải thiện hàm gửi thông điệp trong direct-web-vitals.js
```javascript
const sendToBackground = (name, value) => {
  try {
    // Kiểm tra runtime availability
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.log('[direct-web-vitals] Chrome runtime not available, metrics will not be recorded');
      return;
    }
    
    // Kiểm tra kết nối
    const checkConnection = () => {
      return new Promise((resolve) => {
        // Timeout để xử lý trường hợp không có phản hồi
        const timeoutId = setTimeout(() => {
          resolve(false);
        }, 500);
        
        try {
          chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
            clearTimeout(timeoutId);
            // Kiểm tra lỗi
            if (chrome.runtime.lastError || !response) {
              resolve(false);
              return;
            }
            resolve(true);
          });
        } catch (e) {
          clearTimeout(timeoutId);
          resolve(false);
        }
      });
    };
    
    // Chỉ gửi metrics nếu kết nối hợp lệ
    checkConnection().then(isConnected => {
      if (!isConnected) {
        return;
      }
      
      // Gửi thông điệp an toàn với xử lý lỗi
      try {
        chrome.runtime.sendMessage({
          action: 'webVitalsResult',
          data: { name, value }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`[direct-web-vitals] Non-critical send error: ${chrome.runtime.lastError.message}`);
          }
        });
      } catch (sendError) {
        console.log('[direct-web-vitals] Error sending metric:', sendError.message);
      }
    });
  } catch (error) {
    console.error(`[direct-web-vitals] Error in sendToBackground:`, error);
  }
};
```

### 2. Cải thiện bộ xử lý thông điệp trong background script
```javascript
handleMessage(message, sender, sendResponse) {
  try {
    const action = message?.action;
    
    // Luôn phản hồi ping ngay lập tức
    if (action === 'ping') {
      if (sendResponse) {
        sendResponse({ success: true, timestamp: Date.now() });
      }
      return false;
    }
    
    if (!action) {
      // Luôn phản hồi để tránh lỗi kết nối
      if (sendResponse) {
        sendResponse({ success: false, error: 'No action specified' });
      }
      return false;
    }

    // Tìm handler thích hợp
    const handler = this.getMessageHandler(action);
    
    if (handler) {
      try {
        return handler.call(this, message, sender, sendResponse);
      } catch (handlerError) {
        // Luôn phản hồi ngay cả khi có lỗi
        if (sendResponse) {
          sendResponse({ success: false, error: `Handler error: ${handlerError.message}` });
        }
        return false;
      }
    } else {
      // Phản hồi cho message type không được xử lý
      if (sendResponse) {
        sendResponse({ success: false, error: `Unhandled message type: ${action}` });
      }
      return false;
    }
  } catch (error) {
    // Xử lý lỗi tổng thể
    if (sendResponse) {
      sendResponse({ success: false, error: `Error processing message: ${error.message}` });
    }
    return false;
  }
}
```

## Cách hoạt động
1. **Ping trước khi gửi thông điệp quan trọng**: Kiểm tra kết nối bằng cách gửi một thông điệp "ping" trước.
2. **Xử lý lỗi toàn diện**: Bắt tất cả các ngoại lệ có thể xảy ra trong quá trình gửi và xử lý thông điệp.
3. **Luôn phản hồi**: Ngay cả khi có lỗi, đảm bảo có phản hồi để tránh Promise bị reject.
4. **Timeout an toàn**: Sử dụng timeout để xử lý trường hợp không có phản hồi sau một khoảng thời gian nhất định.
5. **Phản hồi riêng biệt cho ping**: Xử lý nhanh các ping check để cải thiện hiệu suất.

## Lưu ý
- Lỗi "Receiving end does not exist" không phải lúc nào cũng có thể tránh được hoàn toàn vì nó phụ thuộc vào vòng đời của tab và extension.
- Các thay đổi trên giúp giảm thiểu tối đa việc xuất hiện lỗi và/hoặc đảm bảo lỗi được xử lý một cách im lặng không ảnh hưởng đến trải nghiệm người dùng.
- Không có thông điệp nào bị mất khi tab hoặc extension bị đóng đột ngột, extension có thể tự phục hồi trạng thái khi được mở lại.
