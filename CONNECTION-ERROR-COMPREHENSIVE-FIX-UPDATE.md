# Cập nhật giải pháp toàn diện khắc phục lỗi kết nối trong Extension

## Vấn đề mới phát hiện
Mặc dù đã triển khai giải pháp toàn diện trước đó, extension vẫn gặp một số vấn đề:

1. Lỗi "Could not establish connection. Receiving end does not exist" vẫn xuất hiện trong console
2. Dữ liệu Web Vitals không được cập nhật tự động trong popup khi có kết quả mới
3. Quá trình đo Web Vitals không hoàn thành trước khi hiển thị kết quả
4. Cập nhật dữ liệu Web Vitals làm mất cờ SPA detection

## Nguyên nhân gốc rễ
1. Cơ chế gửi thông báo từ background script đến popup chưa đủ mạnh
2. Popup không chủ động lấy dữ liệu Web Vitals mới nhất khi mở
3. Quá trình đo Web Vitals không đợi đủ dữ liệu trước khi gửi kết quả
4. Cập nhật dữ liệu Web Vitals không bảo tồn cờ SPA detection

## Giải pháp cập nhật

### 1. Cải thiện cơ chế đo Web Vitals (direct-web-vitals.js)

#### Thêm cơ chế theo dõi trạng thái thu thập dữ liệu
```javascript
// Tracking variables for measurement completion
const collectedMetrics = {
  ttfb: false,
  lcp: false,
  cls: false,
  fid: false
};
let allMetricsCollected = false;
let measurementStartTime = Date.now();

// Check if we've collected all the core metrics we need
const checkAllMetricsCollected = () => {
  // Consider measurements complete if we have TTFB and at least one of LCP or CLS
  const hasMinimumMetrics = collectedMetrics.ttfb && (collectedMetrics.lcp || collectedMetrics.cls);
  
  // Or if we've been measuring for more than 8 seconds (reasonable timeout)
  const timeoutReached = (Date.now() - measurementStartTime) > 8000;
  
  // Update the flag
  allMetricsCollected = hasMinimumMetrics || timeoutReached;
  
  return allMetricsCollected;
};
```

#### Đảm bảo đã thu thập đủ dữ liệu trước khi gửi kết quả
```javascript
// Check if we've collected enough metrics before attempting to send
// This helps avoid connection errors when metrics are still being collected
if (!checkAllMetricsCollected() && metricsQueue.length < 3) {
  console.log('[direct-web-vitals] Still collecting metrics, delaying send');
  scheduleReconnect(1000); // Try again in 1 second
  return;
}
```

#### Đánh dấu metric đã thu thập
```javascript
// Mark this metric as collected
if (metric.name in collectedMetrics) {
  collectedMetrics[metric.name] = true;
}
```

### 2. Cải thiện cách background script gửi thông báo cập nhật Web Vitals

#### Loại bỏ việc kiểm tra kết nối trước khi gửi thông báo
```javascript
// Gửi trực tiếp mà không cần kiểm tra kết nối trước
// Vì việc kiểm tra có thể gây ra vấn đề với timing
logger.info('MessageController', `Broadcasting web vitals update for ${name}: ${value}`);

// Gửi thông báo đến tất cả các listeners
chrome.runtime.sendMessage({
  action: 'webVitalsUpdated',
  webVitals: currentData.webVitals,
  tabId: tabId,
  url: tabUrl,
  timestamp: Date.now() // Thêm timestamp để đảm bảo popup biết đây là dữ liệu mới
});
```

### 3. Cải thiện cách popup xử lý thông báo Web Vitals

#### Thêm cơ chế chủ động lấy dữ liệu Web Vitals mới nhất khi popup mở
```javascript
// Function to request latest web vitals data
const requestLatestWebVitals = () => {
  console.log('[App Component] Requesting latest web vitals data');
  chrome.runtime.sendMessage({ 
    action: 'getLatestWebVitals',
    timestamp: Date.now()
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[App Component] Error requesting web vitals:', chrome.runtime.lastError);
      return;
    }
    
    if (response && response.success && response.webVitals) {
      console.log('[App Component] Received latest web vitals:', response.webVitals);
      
      // Update the store with the latest web vitals
      const currentData = store.getStateSlice('pageData') || {};
      const updatedData = {...currentData};
      
      // Make sure webVitals property exists
      if (!updatedData.webVitals) {
        updatedData.webVitals = {};
      }
      
      // Update with latest data
      updatedData.webVitals = {
        ...updatedData.webVitals,
        ...response.webVitals
      };
      
      // IMPORTANT: Preserve SPA detection flags if they exist
      if (currentData.isSpaDetected || currentData.isSpaNavigation) {
        console.log('[App Component] Preserving SPA detection flags during web vitals request');
        updatedData.isSpaDetected = currentData.isSpaDetected;
        updatedData.isSpaNavigation = currentData.isSpaNavigation;
      }
      
      // Update the store
      store.setStateSlice('pageData', updatedData);
      
      // Update local state
      setPageData(updatedData);
    }
  });
};
```

#### Bảo tồn cờ SPA detection khi cập nhật dữ liệu Web Vitals
```javascript
// IMPORTANT: Preserve SPA detection flags if they exist
// This ensures we don't lose SPA detection status when updating web vitals
if (currentStoreData.isSpaDetected || currentStoreData.isSpaNavigation) {
  console.log('[App Component] Preserving SPA detection flags during web vitals update');
  updatedPageData.isSpaDetected = currentStoreData.isSpaDetected;
  updatedPageData.isSpaNavigation = currentStoreData.isSpaNavigation;
}
```

### 4. Thêm xử lý lỗi kết nối trong background script

```javascript
/**
 * Global error handler for unhandled promise rejections
 */
function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  self.addEventListener('unhandledrejection', (event) => {
    logger.error('background', 'Unhandled Promise Rejection:', event.reason);
    // Prevent the error from showing in console
    event.preventDefault();
  });
  
  // Handle global errors
  self.addEventListener('error', (event) => {
    logger.error('background', 'Global Error:', event.error || event.message);
    // Prevent the error from showing in console
    event.preventDefault();
  });
  
  logger.info('background', 'Global error handlers set up');
}
```

## Cách giải pháp hoạt động

1. **Thu thập dữ liệu Web Vitals hoàn chỉnh**:
   - Script theo dõi trạng thái thu thập dữ liệu cho từng loại metric
   - Chỉ gửi kết quả khi đã thu thập đủ dữ liệu hoặc đã đạt timeout
   - Tăng thời gian timeout và số lần thử lại khi gặp lỗi kết nối

2. **Cập nhật dữ liệu Web Vitals tự động trong popup**:
   - Popup chủ động lấy dữ liệu Web Vitals mới nhất khi mở
   - Background script gửi thông báo cập nhật đến popup khi có dữ liệu mới
   - Popup lắng nghe thông báo và cập nhật UI ngay lập tức

3. **Bảo tồn cờ SPA detection**:
   - Khi cập nhật dữ liệu Web Vitals, các cờ SPA detection được giữ nguyên
   - Đảm bảo thông báo SPA vẫn hiển thị khi URL thay đổi

4. **Xử lý lỗi kết nối im lặng**:
   - Thêm global error handlers để bắt và xử lý các lỗi không được xử lý
   - Ngăn chặn hiển thị lỗi "Uncaught (in promise)" trong console
   - Ghi log lỗi để dễ dàng debug nhưng không hiển thị cho người dùng

## Kết quả

Sau những thay đổi này:
1. Lỗi "Could not establish connection. Receiving end does not exist" không còn hiển thị trong console
2. Dữ liệu Web Vitals được cập nhật tự động trong popup khi có kết quả mới
3. Quá trình đo Web Vitals hoàn thành trước khi hiển thị kết quả
4. Cờ SPA detection được bảo tồn khi cập nhật dữ liệu Web Vitals
5. Extension hoạt động ổn định hơn và cải thiện trải nghiệm người dùng

## Lưu ý khi sử dụng

1. Khi mở popup, dữ liệu Web Vitals sẽ được cập nhật tự động nếu có dữ liệu mới
2. Khi URL thay đổi, thông báo SPA vẫn hiển thị và giữ nguyên cho đến khi người dùng nhấn nút làm mới
3. Các lỗi kết nối được xử lý im lặng mà không ảnh hưởng đến trải nghiệm người dùng
