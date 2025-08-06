# Sửa lỗi SPA Detection trong Extension

## Vấn đề
Extension không hoạt động đúng cách khi phát hiện SPA navigation:
1. Thông báo lỗi tự động biến mất trước khi người dùng kịp nhấn nút làm mới
2. Tự động làm mới dữ liệu không đúng lúc, dẫn đến trải nghiệm không nhất quán
3. Tác động từ việc sửa đổi Web Vitals đến SPA detection
4. Cập nhật dữ liệu Web Vitals làm mất cờ SPA detection

## Nguyên nhân
1. Các bộ hẹn giờ tự động làm mới trong popup.js gây ra việc làm mới quá sớm
2. Thứ tự ưu tiên không đúng giữa việc đo Web Vitals và phát hiện SPA
3. Thiếu cơ chế đợi người dùng xác nhận trước khi làm mới
4. Cập nhật dữ liệu Web Vitals không bảo tồn cờ SPA detection

## Giải pháp

### 1. Loại bỏ tính năng tự động làm mới (auto-refresh)
Đã loại bỏ các bộ hẹn giờ tự động làm mới trong popup.js để đảm bảo thông báo lỗi hiển thị đủ lâu để người dùng thấy và có thể tương tác.

```javascript
// Trước:
setTimeout(() => {
    console.log("[popup.js loadData] Auto-refreshing after URL change");
    refreshData();
}, 1000);

// Sau:
console.log("[popup.js loadData] URL changed, waiting for user to click refresh button");
```

### 2. Cải thiện xử lý SPA detection
Đã sửa đổi hàm `sendSEOData` trong ContentController để giảm thiểu tác động từ việc tiêm Web Vitals đến quá trình SPA detection:

```javascript
// Trước:
try {
  await messaging.sendToBackground({
    action: MESSAGE_TYPES.INJECT_WEB_VITALS,
    url: window.location.href,
    source: source
  });
  logger.info('ContentController', 'Requested web vitals injection from background');
} catch (webVitalsError) {
  logger.warn('ContentController', 'Error requesting web vitals injection, falling back to direct mode', webVitalsError);
  // Fallback to direct mode
  await WebVitalsAnalyzer.initiateWebVitalsMeasurement();
}

// Sau:
try {
  await messaging.sendToBackground({
    action: MESSAGE_TYPES.INJECT_WEB_VITALS,
    url: window.location.href,
    source: source
  });
  logger.info('ContentController', 'Requested web vitals injection from background');
} catch (webVitalsError) {
  logger.warn('ContentController', 'Error requesting web vitals injection, ignoring', webVitalsError);
  // Không sử dụng fallback để tránh ảnh hưởng đến SPA detection
}
```

### 3. Cải thiện xử lý xóa dữ liệu cũ
Vẫn xóa dữ liệu cũ khi phát hiện SPA nhưng không tự động làm mới, cho phép người dùng chủ động quyết định khi nào làm mới.

```javascript
// Trước:
if (isSpaDetected && !hasError) {
    console.log("[popup.js loadData] SPA detected. Requesting fresh extraction after short delay...");
    setTimeout(() => {
        console.log("[popup.js loadData] Auto-refreshing after SPA detection");
        // ...code để làm mới tự động...
    }, 1500);
}

// Sau:
if (isSpaDetected && !hasError) {
    console.log("[popup.js loadData] SPA detected. User should manually refresh when ready.");
    // Chỉ xóa dữ liệu cũ nhưng không tự động làm mới
    // ...code để xóa dữ liệu cũ...
}
```

## Cập nhật mới nhất

### 4. Bảo tồn cờ SPA detection khi cập nhật Web Vitals
Để đảm bảo cờ SPA detection không bị mất khi cập nhật dữ liệu Web Vitals, chúng ta đã thêm code để bảo tồn các cờ này trong popup.js:

```javascript
// IMPORTANT: Preserve SPA detection flags if they exist
// This ensures we don't lose SPA detection status when updating web vitals
if (currentStoreData.isSpaDetected || currentStoreData.isSpaNavigation) {
  console.log('[App Component] Preserving SPA detection flags during web vitals update');
  updatedPageData.isSpaDetected = currentStoreData.isSpaDetected;
  updatedPageData.isSpaNavigation = currentStoreData.isSpaNavigation;
}
```

Và trong hàm requestLatestWebVitals:

```javascript
// IMPORTANT: Preserve SPA detection flags if they exist
if (currentData.isSpaDetected || currentData.isSpaNavigation) {
  console.log('[App Component] Preserving SPA detection flags during web vitals request');
  updatedData.isSpaDetected = currentData.isSpaDetected;
  updatedData.isSpaNavigation = currentData.isSpaNavigation;
}
```

## Kết quả

Sau những thay đổi này:
1. Extension sẽ chạy ngầm và phát hiện SPA như trước
2. Khi URL thay đổi, thông báo lỗi sẽ hiển thị và giữ nguyên cho đến khi người dùng nhấn nút làm mới
3. Trải nghiệm người dùng được cải thiện khi người dùng có thể chủ động quyết định khi nào làm mới
4. Việc đo Web Vitals vẫn hoạt động nhưng không ảnh hưởng đến SPA detection
5. Cờ SPA detection được bảo tồn khi cập nhật dữ liệu Web Vitals

## Lưu ý khi sử dụng
1. Khi URL thay đổi, người dùng sẽ thấy thông báo yêu cầu làm mới
2. Nhấn nút "Làm mới trang" sẽ tải lại trang và đóng popup
3. Mở lại popup sẽ hiển thị dữ liệu mới nhất
