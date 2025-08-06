# Refactoring Guide for SEO AI Assistant

## Đã Hoàn Thành

### 1. Refactoring Tab Modules

- **✅ Refactored overview-tab.js**
  - Tách thành các component nhỏ hơn, dễ quản lý
  - Tạo thư mục `js/modules/components` chứa các UI components tái sử dụng
  - Tạo thư mục `js/modules/services` chứa các service
  - Các components đã tạo:
    - `WebsiteInformation.js`: Hiển thị thông tin cơ bản về website
    - `SeoScoreCard.js`: Hiển thị điểm SEO tổng thể
    - `CoreWebVitals.js`: Hiển thị các chỉ số Core Web Vitals
    - `ServerDetails.js`: Hiển thị thông tin về server
    - `ResponseDetails.js`: Hiển thị chi tiết về response
    - `ContentOverview.js`: Hiển thị tổng quan về nội dung
    - `IssuesSummary.js`: Hiển thị tóm tắt các vấn đề
    - `OpenGraphTags.js`: Hiển thị các thẻ Open Graph
  - Các services đã tạo:
    - `server-service.js`: Xử lý việc lấy thông tin server

- **✅ Refactored performance-tab.js**
  - Tách thành các component nhỏ hơn, dễ quản lý
  - Tách logic tính toán performance score và recommendations vào service riêng
  - Các components đã tạo:
    - `MetricItem.js`: Component hiển thị một metric với progress bar
    - `PerformanceScoreCard.js`: Hiển thị điểm performance tổng thể
    - `CoreWebVitalsDetail.js`: Hiển thị chi tiết các chỉ số Core Web Vitals
    - `ServerResponseTime.js`: Hiển thị thông tin về TTFB
    - `PerformanceRecommendations.js`: Hiển thị các khuyến nghị cải thiện performance
  - Các services đã tạo:
    - `performance-service.js`: Xử lý việc tính toán performance score, đánh giá metrics và tạo recommendations

- **✅ Refactored links-tab.js**
  - Tách thành các component nhỏ hơn, dễ quản lý
  - Tách logic kiểm tra link status và xuất dữ liệu vào service riêng
  - Các components đã tạo:
    - `LinkCountCards.js`: Hiển thị các card thống kê link
    - `LinkDistribution.js`: Hiển thị biểu đồ phân phối link
    - `LinkAnalysisTable.js`: Hiển thị bảng phân tích link
    - `LinkStatusChecker.js`: Component kiểm tra trạng thái link
    - `LinkTable.js`: Hiển thị bảng chi tiết các link
    - `LinkExportButton.js`: Nút xuất dữ liệu link
    - `LinkIssuesTable.js`: Hiển thị bảng các vấn đề về link
    - `LinkStatusFilter.js`: Bộ lọc trạng thái link theo HTTP status code
  - Các services đã tạo:
    - `link-service.js`: Xử lý việc kiểm tra trạng thái link và xuất dữ liệu

- **✅ Refactored popup.js**
  - Tách thành các components React riêng biệt
  - Áp dụng hooks và cải thiện state management
  - Tạo các service modules cho business logic
  - Các components đã tạo:
    - `App.js`: Component chính điều phối toàn bộ ứng dụng
    - `Header.js`: Hiển thị logo, tiêu đề và các nút hành động
    - `SerpPreview.js`: Hiển thị preview của kết quả tìm kiếm với validation
    - `NavTabs.js`: Các tab điều hướng
    - `Footer.js`: Footer với thông tin branding
    - Các status components:
      - `LoadingDisplay.js`: Hiển thị spinner loading
      - `NetworkErrorDisplay.js`: Thông báo lỗi mạng
      - `SpaNavigationDisplay.js`: Thông báo navigation SPA
      - `RefreshButton.js`: Nút làm mới trang tái sử dụng
  - Các services đã tạo:
    - `data-fetching-service.js`: Xử lý việc lấy dữ liệu từ background script
    - `navigation-service.js`: Quản lý việc chuyển tab và navigation

### 2. Tái cấu trúc Architecture

- **✅ Đã tạo cấu trúc thư mục mới**
  - Tạo thư mục `src` chứa code được tổ chức lại
  - Phân chia thành các module chức năng: `background`, `content`, `popup`, `shared`
  - Tổ chức các submodule theo chức năng: `controllers`, `services`, `analyzers`, `extractors`, `utils`, v.v.

- **✅ Áp dụng mô hình MVC**
  - Tách biệt logic xử lý dữ liệu (Model)
  - Tách biệt giao diện người dùng (View)
  - Tách biệt logic điều khiển (Controller)

### 3. Refactored Background Script (Tháng 4/2023)

- **✅ Tách thành các controllers chuyên biệt**
  - `message-controller.js`: Điều phối và phân phối tin nhắn
  - `navigation-controller.js`: Xử lý các sự kiện điều hướng
  - `web-request-controller.js`: Xử lý các sự kiện web request
  - `seo-data-controller.js`: Quản lý dữ liệu SEO
  - `spa-navigation-controller.js`: Xử lý SPA navigation
  - `web-vitals-controller.js`: Xử lý Core Web Vitals
  - `server-info-controller.js`: Xử lý thông tin server
  - `link-checker-controller.js`: Xử lý kiểm tra trạng thái liên kết
  - `tab-controller.js`: Quản lý các tab

- **✅ Tách thành các services chuyên biệt**
  - `storage-service.js`: Quản lý lưu trữ dữ liệu
  - `cleanup-service.js`: Dọn dẹp dữ liệu cũ
  - `web-vitals-service.js`: Dịch vụ đo lường Web Vitals
  - `server-info-service.js`: Dịch vụ lấy thông tin server
  - `link-checker-service.js`: Dịch vụ kiểm tra trạng thái liên kết
  - `messaging-service.js`: Dịch vụ gửi tin nhắn trong extension

- **✅ Cải thiện error handling và logging**
  - Áp dụng try/catch nhất quán trên toàn bộ codebase
  - Sử dụng logger module cho mọi log message
  - Thêm global error handler cho promise rejections
  - Xử lý lỗi gracefully với recovery mechanisms

- **✅ Tối ưu hóa messaging system**
  - Xây dựng hệ thống phân phối tin nhắn mạnh mẽ
  - Áp dụng pattern dispatcher cho message handling
  - Cải thiện async/await support cho các async operations
  - Thêm timeout và retry mechanisms

- **✅ Tối ưu hóa memory management**
  - Cải thiện việc dọn dẹp dữ liệu không sử dụng
  - Tối ưu hóa storage và caching strategies
  - Giảm thiểu memory leaks

### 4. Refactored Content Script

- **✅ Tách thành các module nhỏ hơn**
  - `SeoExtractor`: Trích xuất dữ liệu SEO
  - `SpaDetector`: Phát hiện SPA navigation
  - `WebVitalsAnalyzer`: Phân tích Core Web Vitals
  - `DomUtils`: Các utility function cho DOM
  - `ContentController`: Điều phối các module

### 5. Cải thiện Shared Utilities

- **✅ Tạo các module tiện ích chung**
  - `constants.js`: Định nghĩa hằng số dùng chung
  - `logger.js`: Enhanced logging
  - `messaging.js`: Tiện ích xử lý messaging

### 6. Cập nhật Manifest

- **✅ Cập nhật manifest.json**
  - Sử dụng cấu trúc mới với ES modules
  - Cập nhật version và description

### 7. Cải thiện Link Checking (Tháng 5/2023)

- **✅ Cải thiện Link Status Checking**
  - Sửa lỗi chế độ individual link checking
  - Cải thiện xử lý batch với error handling tốt hơn
  - Thêm chỉ báo tiến trình trực quan cho việc kiểm tra link
  - Triển khai xử lý tuần tự để ngăn UI bị đóng băng

- **✅ Thêm hệ thống lọc Link Status**
  - Thêm khả năng lọc link theo HTTP status code
  - Triển khai bộ lọc nhóm status code (3xx, 4xx, 5xx)
  - Cải thiện UI với chỉ báo trực quan cho bộ lọc đang hoạt động
  - Tích hợp lọc với chức năng xuất dữ liệu

## Hướng Dẫn Tiếp Theo

### 1. Hoàn thiện Popup UI

- **✅ Refactor popup.js**
  - ✅ Tách thành các components React
  - ✅ Áp dụng hooks và state management
  - ✅ Tạo các service modules cho business logic

```jsx
// src/popup/components/Header.jsx
import React from 'react';

export const Header = ({ onRefresh, onSwitchTab, isLoading }) => {
  // Component implementation
};

// src/popup/components/SerpPreview.jsx
import React from 'react';

export const SerpPreview = ({ pageData, isLoading }) => {
  // Component implementation
};
```

- **Tạo file popup index trong src**
```jsx
// src/popup/popup.js
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

### 2. Migration Strategy

Để tiếp tục migration một cách an toàn, hãy thực hiện theo từng bước:

1. **Kiểm tra lỗi**
   - Chạy extension với cấu trúc mới
   - Kiểm tra console errors
   - Fix các lỗi phát sinh

2. **Tạo Unit Tests**
   - Viết unit tests cho các module đã refactor
   - Đảm bảo các chức năng core hoạt động chính xác

3. **Tiếp tục Refactoring Popup**
   - Refactor các React components
   - Cải thiện state management
   - Tương tác với background script

4. **Hoàn thiện tài liệu**
   - Cập nhật README.md
   - Viết API docs cho các module chính
   - Tạo JSDoc cho các functions và classes

### 3. Best Practices đang áp dụng

- **Đặt tên nhất quán**
  - camelCase cho functions và variables
  - PascalCase cho classes và components
  - ALL_CAPS cho constants

- **Error handling nhất quán**
  - Sử dụng try/catch cho async code
  - Logging errors với logger module
  - Trả về thông tin lỗi rõ ràng

- **Tổ chức imports**
  - Imports từ libraries
  - Imports từ modules khác của project
  - Imports local

- **Code comments**
  - JSDoc cho các public functions/methods
  - Inline comments cho code phức tạp
  - Descriptive function names

### 4. Tiếp theo nên làm

1. **Hoàn thiện Webpack config**
   - ✅ Tối ưu hóa production builds
   - Thêm source maps cho development
   - Cấu hình code splitting
   - Cấu hình tree shaking

2. **Cải thiện State Management**
   - Chuyển đổi từ store pattern hiện tại sang React Context API
   - Tạo các specialized contexts cho các domains khác nhau (navigation, data, settings)
   - Sử dụng useReducer kết hợp với context cho state phức tạp

3. **Tích hợp TypeScript**
   - Tạo các type definitions
   - Convert các module sang TypeScript
   - Implement type checking
   - Thêm JSDoc hoặc TypeScript interface documention

4. **Tối ưu hóa Performance**
   - Sử dụng React.memo cho components không thay đổi thường xuyên
   - Sử dụng useMemo và useCallback để tránh render không cần thiết
   - Implement code splitting và lazy loading cho các tab ít dùng

5. **Improve Testing**
   - Setup Jest cho unit testing
   - Viết tests cho core functionality
   - Setup CI integration

## Code Examples

### Background Refactoring Examples

1. **Controller Pattern**

```javascript
// src/background/controllers/message-controller.js
'use strict';

import { MESSAGE_TYPES } from '../../shared/constants.js';
import { logger } from '../../shared/utils/logger.js';
import { SeoDataController } from './seo-data-controller.js';
import { SpaNavigationController } from './spa-navigation-controller.js';
// ... other imports

class MessageControllerClass {
  initialize() {
    logger.info('MessageController', 'Initializing...');
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    logger.info('MessageController', 'Message listener set up');
  }

  handleMessage(message, sender, sendResponse) {
    try {
      const action = message?.action;
      
      // Find the appropriate handler for this message type
      const handler = this.getMessageHandler(action);

      if (handler) {
        return handler.handler.call(handler.context, message, sender, sendResponse);
      } else {
        logger.warn('MessageController', `No handler for message type: ${action}`);
        if (sendResponse) {
          sendResponse({ success: false, error: `Unhandled message type: ${action}` });
        }
        return false;
      }
    } catch (error) {
      logger.error('MessageController', 'Error processing message:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: `Error processing message: ${error.message}` });
      }
      return false;
    }
  }
  
  // ... other methods
}

// Export as singleton
export const MessageController = new MessageControllerClass();
```

2. **Service Pattern**

```javascript
// src/background/services/web-vitals-service.js
'use strict';

import { logger } from '../../shared/utils/logger.js';
import { StorageService } from './storage-service.js';

class WebVitalsServiceClass {
  async injectWebVitalsScript(tabId) {
    logger.info('WebVitalsService', `Injecting web vitals scripts into tab ${tabId}`);
    
    try {
      // Validate tab ID
      if (!tabId || typeof tabId !== 'number') {
        throw new Error('Invalid tab ID');
      }
      
      // Check if scripting API is available
      if (!chrome.scripting) {
        throw new Error('chrome.scripting API is not available');
      }
      
      // ... implementation details
      
      return true;
    } catch (error) {
      logger.error('WebVitalsService', `Failed to inject web vitals script: ${error.message}`, error);
      return false;
    }
  }
  
  // ... other methods
}

// Export as a singleton
export const WebVitalsService = new WebVitalsServiceClass();
```

3. **Link Status Filter Component**

```javascript
// js/modules/components/links/LinkStatusFilter.js
'use strict';

/**
 * Component for filtering links by status code
 * @param {Object} props - Component props
 * @param {Object} props.statuses - Object containing link status information
 * @param {Array} props.links - Array of link objects
 * @param {string} props.activeStatusFilter - Currently active status filter
 * @param {Function} props.onStatusFilterChange - Function to call when filter changes
 * @param {boolean} props.disabled - Whether the filter is disabled
 * @returns {React.Element} Rendered component
 */
export const LinkStatusFilter = ({ statuses, links, activeStatusFilter, onStatusFilterChange, disabled = true }) => {
    // Get unique status codes from the statuses object
    const getStatusCounts = () => {
        // Initialize with common status codes and groups
        const counts = {
            'all': 0,
            '200': 0,
            '301': 0,
            '302': 0,
            '3xx': 0, // Group for all 3xx
            '404': 0,
            '4xx': 0, // Group for all 4xx
            '500': 0,
            '5xx': 0, // Group for all 5xx
            'error': 0
        };
        
        // Count links by status
        links.forEach(link => {
            if (!link.href) return;
            
            const status = statuses[link.href];
            if (!status) return;
            
            // Increment total count
            counts['all']++;
            
            if (status.statusCode) {
                // Add to specific code count
                const code = status.statusCode.toString();
                if (counts[code] !== undefined) {
                    counts[code]++;
                } else {
                    counts[code] = 1;
                }
                
                // Also add to group counts
                if (status.statusCode >= 300 && status.statusCode < 400) {
                    counts['3xx']++;
                } else if (status.statusCode >= 400 && status.statusCode < 500) {
                    counts['4xx']++;
                } else if (status.statusCode >= 500) {
                    counts['5xx']++;
                }
            } else if (status.status === 'error') {
                counts['error']++;
            }
        });
        
        // Filter out status codes with zero count
        return Object.entries(counts)
            .filter(([_, count]) => count > 0)
            .reduce((obj, [code, count]) => {
                obj[code] = count;
                return obj;
            }, {});
    };
    
    // ... rest of component implementation
};
```

## Lợi ích của việc Refactoring

### Lợi ích của việc refactoring background.js

1. **Cải thiện khả năng bảo trì**
   - Chia nhỏ file background.js (trên 1000 dòng) thành nhiều module nhỏ, mỗi module chỉ có khoảng 100-200 dòng
   - Mỗi module có một trách nhiệm rõ ràng, tuân thủ nguyên tắc Single Responsibility
   - Dễ dàng định vị và fix bugs khi chúng xảy ra

2. **Cải thiện hiệu suất**
   - Phân tán logic giữa các controller và service giúp tối ưu hóa hiệu suất
   - Cải thiện memory management với cleanup service
   - Cải thiện caching strategy

3. **Cải thiện error handling**
   - Xử lý lỗi nhất quán trên toàn bộ codebase
   - Centralized logging giúp dễ dàng theo dõi và debug
   - Global error handler giúp bắt các lỗi không xử lý

4. **Cải thiện messaging**
   - Hệ thống phân phối tin nhắn rõ ràng
   - Mỗi loại tin nhắn được xử lý bởi controller chuyên biệt
   - Cải thiện async/await support

### Lợi ích của việc refactoring tab modules

1. **Cải thiện cấu trúc code**
   - Chia nhỏ các file tab module từ hơn 400 dòng thành các component nhỏ hơn, mỗi component chỉ có khoảng 50-80 dòng
   - Mỗi component có một trách nhiệm rõ ràng, tuân thủ nguyên tắc Single Responsibility
   - Ví dụ: `performance-tab.js` được chia thành các component như `MetricItem`, `PerformanceScoreCard`, `CoreWebVitalsDetail`, v.v.

2. **Tăng tính tái sử dụng**
   - Các component như `WebsiteInformation`, `CoreWebVitals`, `MetricItem`, v.v. có thể được tái sử dụng ở các phần khác của ứng dụng
   - Các service như `server-service.js` và `performance-service.js` có thể được sử dụng bởi nhiều component khác nhau

3. **Dễ bảo trì**
   - Khi cần sửa đổi một tính năng cụ thể, chỉ cần sửa đổi component tương ứng mà không ảnh hưởng đến các phần khác
   - Các lỗi dễ dàng được phát hiện và sửa chữa hơn

### Lợi ích của việc cải thiện Link Checking

1. **Cải thiện trải nghiệm người dùng**
   - Kiểm tra link nhanh hơn và đáng tin cậy hơn
   - Cung cấp phản hồi trực quan về tiến trình kiểm tra
   - Giảm thiểu UI freezing trong quá trình kiểm tra

2. **Tăng tính linh hoạt**
   - Bộ lọc status code cho phép người dùng tập trung vào các link cụ thể
   - Nhóm status code (3xx, 4xx, 5xx) giúp phân tích nhanh các vấn đề
   - Tích hợp với chức năng xuất dữ liệu để phân tích sâu hơn

3. **Cải thiện độ tin cậy**
   - Xử lý lỗi tốt hơn trong quá trình kiểm tra link
   - Đảm bảo tất cả các link đều được kiểm tra đầy đủ
   - Cung cấp thông tin chi tiết về lỗi khi xảy ra

## Bài học kinh nghiệm

1. **Tiếp cận từng bước nhỏ**
   - Refactoring từng phần nhỏ giúp giảm thiểu rủi ro và dễ kiểm soát hơn
   - Mỗi bước có thể được kiểm tra và đảm bảo hoạt động trước khi tiếp tục

2. **Giữ giao diện không đổi**
   - Việc giữ nguyên giao diện bên ngoài của module giúp đảm bảo không ảnh hưởng đến các phần khác của hệ thống
   - Các file khác vẫn có thể import và sử dụng module đã refactor mà không cần thay đổi

3. **Tài liệu hóa rõ ràng**
   - Việc thêm JSDoc comments và cập nhật tài liệu giúp các developer khác hiểu được cấu trúc mới
   - Cập nhật REFACTORING-GUIDE.md để theo dõi tiến trình và hướng dẫn cho các bước tiếp theo

## Kết luận

Quá trình refactoring đã triển khai một kiến trúc modular, dễ bảo trì hơn đáng kể. Code hiện tại đã được tổ chức lại với sự phân tách rõ ràng về trách nhiệm, cải thiện việc handling errors, và áp dụng các best practices trong phát triển extension.

Việc refactoring `background.js` và cải thiện chức năng kiểm tra link là những bước quan trọng trong quá trình cải thiện cấu trúc toàn bộ extension. Các bước tiếp theo nên tập trung vào việc hoàn thiện Webpack config, áp dụng TypeScript để tăng cường type safety, và xây dựng một testing suite toàn diện.
