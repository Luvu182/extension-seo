# Content Tab Update - Refactoring Notes

## Vấn đề gặp phải và giải pháp

### 1. Vấn đề với Tab Content và Image

**Vấn đề:**
- Tab content ban đầu sử dụng React Hooks (`useState`) nhưng gặp lỗi tương thích: `TypeError: (_0x506ec1[_0x1d0fb7(...)] || [])[_0x1d0fb7(...)] is not a function`
- Tab image không hiển thị sau khi thêm vào và gây ra lỗi: `TypeError: e.filter is not a function`
- Tab image không phát hiện được hình ảnh trong bài dù có nhiều ảnh trong trang

**Giải pháp:**
- Chuyển từ Functional Component (với hooks) sang Class Component truyền thống
- Cải thiện phát hiện và xử lý hình ảnh với nhiều cơ chế dự phòng:
  ```javascript
  // Cải thiện việc phát hiện hình ảnh
  let images = [];
  
  // Kiểm tra nhiều cấu trúc dữ liệu khác nhau
  if (Array.isArray(data.images)) {
      images = data.images;
  } else if (data.content && Array.isArray(data.content.images)) {
      images = data.content.images;
  } else if (typeof data.images === 'object' && data.images !== null) {
      // Trường hợp images là một object chứa mảng
      console.log('Images is an object, attempting to extract array');
      
      // Tìm và sử dụng thuộc tính nào là một mảng
      const possibleArrays = Object.values(data.images).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
          images = possibleArrays[0];
      }
  }
  
  // Thêm console logging để debug
  console.log('Image processing debug:');
  console.log('Data structure:', data);
  console.log('Images found:', images);
  ```
- Cải thiện xử lý URL hình ảnh:
  ```javascript
  const getImageFilename = (src) => {
      if (!src) return 'Unknown';
      try {
          // Xử lý cả URL đầy đủ và đường dẫn tương đối
          const url = new URL(src, window.location.origin);
          const pathname = url.pathname;
          const parts = pathname.split('/');
          const filename = parts[parts.length - 1];
          return filename || src.substring(src.lastIndexOf('/') + 1) || src;
      } catch (e) {
          // Fallback khi URL parsing thất bại
          return src.substring(src.lastIndexOf('/') + 1) || src;
      }
  };
  ```

### 2. Vấn đề với SPA Detection

**Vấn đề:**
- Extension yêu cầu reload liên tục do phát hiện SPA quá nhạy cảm
- DOM changes detection gây ra nhiều false positive

**Giải pháp:**
- Tắt obfuscation trong webpack cho mục đích debug:
  ```javascript
  // Tắt tạm thời JavaScriptObfuscator
  /*
  new JavaScriptObfuscator({
    rotateStringArray: true,
    stringArray: true,
    // ...
  }, ['excluded_bundle_name.js']),
  */
  ```

- Tắt hoàn toàn phát hiện thay đổi nội dung trong DOM utils:
  ```javascript
  static hasDOMSignificantlyChanged(prev, current) {
    // Chỉ phát hiện thay đổi URL path, title và meta
    if (prev.path !== current.path) {
      reasons.push("URL path changed");
      score += 10;
      return true; // Return immediately for URL path changes
    }
    
    // Kiểm tra title
    if (prev.title !== current.title) {
      reasons.push("Page title changed");
      score += 10;
      return true;
    }
    
    // Kiểm tra meta description
    if (prev.meta !== current.meta) {
      reasons.push("Meta description changed");
      score += 10;
      return true;
    }
    
    // Bỏ qua hoàn toàn các thay đổi khác như:
    // - Heading changes
    // - Content changes
    // - DOM element count changes
    // - Links count changes
  }
  ```

- Tối ưu URL watcher trong SPA Detector:
  ```javascript
  startUrlWatcher() {
    // Kéo dài interval lên 5 lần
    const extendedInterval = SPA_DETECTION.URL_WATCH_INTERVAL * 5;
    
    // Chỉ kiểm tra thay đổi URL path và search params quan trọng
    // Bỏ qua hoàn toàn phát hiện thay đổi nội dung
  }
  ```

- Thêm nút "Tiếp tục xem với dữ liệu hiện tại" vào màn hình SPA Navigation:
  ```javascript
  React.createElement('button', 
    { 
      style: { /* styles */ },
      onClick: () => {
        // Fire event to bypass SPA navigation warning
        document.dispatchEvent(new CustomEvent('spaNavigationComplete'));
      }
    },
    'Tiếp tục xem với dữ liệu hiện tại'
  )
  ```

## Cấu trúc Tab Content mới

Cấu trúc mới với UI lồng nhau (nested tabs):

1. **Tab Content** - Tab chính hiển thị trong popup
   - **Tab Text** (mặc định) - Hiển thị phân tích văn bản
     - Page Content Analysis (title, meta, headings, word count)
     - Heading Structure (với bộ lọc heading levels)
     - Content Recommendations
   - **Tab Image** - Hiển thị phân tích hình ảnh
     - Image Analysis (total images, missing alt text, non-optimized filenames)
     - Toggle để lọc ảnh (bao gồm/loại trừ ảnh từ header, footer, menu)
     - Cảnh báo về vấn đề hình ảnh (thiếu alt text, tên file chưa tối ưu)
     - All Images table (5 cột: hình ảnh thu nhỏ, tên file, alt text, kích thước, dung lượng)

## Đã refactor thành các Component và Services

Để cải thiện khả năng bảo trì, các chức năng đã được refactor thành các component và services riêng biệt:

1. **Components:**
   - **HeadingStructure.js** - Hiển thị và lọc cấu trúc heading
   - **TextAnalysis.js** - Hiển thị phân tích nội dung văn bản
   - **ImageAnalysis.js** - Hiển thị phân tích hình ảnh
   - **ContentRecommendations.js** - Hiển thị các khuyến nghị SEO

2. **Services:**
   - **ImageAnalysisService** - Xử lý việc phát hiện và phân tích hình ảnh
     - `getImages()` - Trích xuất hình ảnh từ nhiều cấu trúc dữ liệu khác nhau
     - `getImageRecommendations()` - Tạo các khuyến nghị dựa trên phân tích hình ảnh

## Cải tiến so với phiên bản trước

1. **UX Tốt hơn** - Nhóm các chức năng liên quan trong các tab con, giúp UI gọn gàng và tổ chức hơn
2. **Khả năng mở rộng** - Dễ dàng thêm tab con mới trong tương lai
3. **Dễ bảo trì** - Mỗi component có một nhiệm vụ rõ ràng, tuân theo nguyên tắc Single Responsibility
4. **Hiệu suất tốt hơn** - Giảm số lần reload không cần thiết với SPA detection ít nhạy cảm hơn
5. **Phát hiện hình ảnh cải tiến** - Thêm nhiều cơ chế dự phòng để tìm và hiển thị hình ảnh từ các cấu trúc dữ liệu khác nhau
6. **Giao diện tab cải tiến** - Tab navigation trực quan hơn và bổ sung thuộc tính ARIA cho accessibility tốt hơn
7. **Code tái sử dụng tốt hơn** - Tách logic chung như tabButtonStyle để giảm code trùng lặp
8. **Lọc hình ảnh theo vị trí** - Cho phép lọc hình ảnh trong nội dung chính và bỏ qua hình ảnh từ header/footer/nav
9. **Preview hình ảnh trực quan** - Hiển thị ảnh thu nhỏ giúp dễ dàng nhận diện ảnh cần tối ưu
10. **Đánh giá tên file hình ảnh** - Phát hiện tên file không tối ưu cho SEO và đưa ra cảnh báo/gợi ý
11. **Ước tính kích thước file** - Ước tính dung lượng file ảnh để xác định cơ hội tối ưu dung lượng

## Lưu ý cho phát triển tiếp theo

1. **Cân nhắc để lại SPA detection đã sửa đổi** - Đã tinh chỉnh để ít gây phiền hà nhưng vẫn bắt được các thay đổi quan trọng
2. **Bật lại obfuscation khi phát hành** - Đã tắt tạm thời để debug
3. **Tab structure với Class Component** - Hiện tại đang sử dụng Class Component cho tương thích tốt hơn, có thể cân nhắc chuyển về Functional Component + Hooks sau khi khắc phục các vấn đề tương thích
4. **Sử dụng ImageAnalysisService** - Đã tạo Service riêng để xử lý hình ảnh, nhưng hiện tại chưa sử dụng đầy đủ trong component. Nên kết hợp với tab Image để tận dụng khả năng phân tích hình ảnh nâng cao
5. **Cải thiện console logging** - Hiện đang sử dụng console logging để debug, có thể được tắt hoặc thay thế bằng một logger chính thức trong phiên bản production
6. **Tối ưu phát hiện tên file không chuẩn** - Có thể cải thiện thuật toán phát hiện tên file không chuẩn để phát hiện chính xác hơn các trường hợp đặc biệt
7. **Thêm tùy chọn xuất dữ liệu hình ảnh** - Thêm tính năng xuất danh sách hình ảnh cần tối ưu để xử lý hàng loạt
8. **Cân nhắc xử lý Lazy Loading** - Phân tích thuộc tính loading của hình ảnh và đưa ra khuyến nghị về lazy loading

## Hướng phát triển tiếp theo

Có thể mở rộng thêm các tab con khác trong tab Content:

1. **Tab Readability** - Phân tích độ dễ đọc của nội dung (Flesch-Kincaid score, sentence length, etc)
2. **Tab Keywords** - Phân tích mật độ từ khóa và ngữ nghĩa
3. **Tab Structured Data** - Hiển thị data trong JSON-LD và microdata trong nội dung
4. **Cải tiến Tab Image** - Thêm các tính năng nâng cao hơn cho tab Image:
   - Phân tích hiệu suất hình ảnh (định dạng WebP vs JPEG/PNG)
   - Tối ưu gợi ý tên file hình ảnh
   - Kiểm tra hình ảnh responsive (srcset, sizes)
   - Phân tích tỷ lệ nén của hình ảnh
   - Mở rộng cảnh báo về hình ảnh quá lớn về kích thước hoặc dung lượng

## Thay đổi gần đây (12/04/2025)

### Cải tiến UI Tab Image (12/04/2025)
- **Thêm chức năng chọn lọc hình ảnh** - Thêm nút toggle để bật/tắt hiển thị hình ảnh từ header, footer và menu
- **Cải thiện bảng hiển thị hình ảnh** - Bảng hình ảnh giờ gồm 5 cột: hình ảnh thu nhỏ, tên file, alt text, kích thước và dung lượng
- **Thêm cảnh báo tên file chưa tối ưu** - Phát hiện và hiển thị cảnh báo cho những hình ảnh có tên file chứa ký tự đặc biệt, mã hóa (như %20) 
- **Hiển thị hình ảnh thu nhỏ** - Thêm hình ảnh preview cho mỗi ảnh trong bảng để dễ dàng nhận diện
- **Xử lý text quá dài** - Text dài như tên file, alt text giờ được giới hạn tối đa 3 dòng, tự động cắt bớt với dấu "..." và hiển thị đầy đủ khi hover

### Khắc phục vấn đề với tab Image (11/04/2025)
- **Sửa lỗi phát hiện hình ảnh** - Khắc phục lỗi quan trọng trong DomUtils.getImages() để trả về mảng chi tiết của các đối tượng hình ảnh thay vì chỉ số lượng
- **Cải thiện cấu trúc dữ liệu** - Tổ chức lại cách thông tin hình ảnh được lưu trữ trong đối tượng SEO data
- **Lọc hình ảnh không hợp lệ** - Thêm bộ lọc để loại bỏ các hình ảnh không hợp lệ như tracking pixels và data URIs
- **Metadata hình ảnh** - Thu thập thêm thông tin như loading, hasAlt và các thuộc tính khác
- **Ước tính dung lượng hình ảnh** - Thêm thuật toán ước tính dung lượng hình ảnh dựa trên kích thước và định dạng

### Cải thiện Content Tab với Nested Tabs (10/04/2025)
- **Cấu trúc Tab Lồng Nhau** - Triển khai UI với tab Text và Image nằm trong Tab Content
- **Tab Text** - Hiển thị phân tích nội dung văn bản, cấu trúc heading và khuyến nghị
- **Tab Image** - Hiển thị phân tích hình ảnh với các chỉ số về số lượng ảnh và alt text

### Cải thiện Image Detection (10/04/2025)
- **Phát hiện Cấu trúc Dữ liệu Đa dạng** - Giờ đây có thể tìm hình ảnh trong nhiều định dạng dữ liệu khác nhau
- **Console Logging cho Debug** - Thêm logging để dễ dàng xác định vấn đề với phát hiện hình ảnh
- **Xử lý URL Cải tiến** - Cải thiện việc hiển thị tên file hình ảnh từ URL
- **Tạo ImageAnalysisService** - Tách logic phân tích hình ảnh thành service riêng biệt để tái sử dụng

### Cải thiện UX/Accessibility (10/04/2025)
- **Cải thiện Style Tab** - Trích xuất style chung cho tab button để giảm code trùng lặp
- **ARIA Attributes** - Bổ sung thuộc tính ARIA để cải thiện accessibility
- **Hiển thị Cải tiến** - Dữ liệu hiển thị rõ ràng hơn với UI sạch sẽ và cấu trúc logic