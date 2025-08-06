# Kế hoạch Task Phát triển Extension SEO Audit

**Mục tiêu:** Nâng cấp extension thành một công cụ phân tích SEO toàn diện, cung cấp thông tin chi tiết và hữu ích hơn cho người dùng, đồng thời cải thiện hiệu suất và trải nghiệm người dùng.

**Đánh giá độ khó:**
* **Dễ:** Thay đổi nhỏ, sử dụng dữ liệu/cấu trúc có sẵn, logic đơn giản.
* **Trung bình:** Cần logic trích xuất dữ liệu mới, thay đổi UI đáng kể, tác vụ nền đơn giản, tích hợp thư viện cơ bản.
* **Khó:** Thuật toán phức tạp, tích hợp API bên ngoài (có thể yêu cầu key, xác thực), xử lý nền chuyên sâu, thay đổi kiến trúc lớn, quản lý trạng thái phức tạp.

---

## Giai đoạn 1: Cải thiện và Mở rộng Tính năng Hiện có

**Mục tiêu:** Tăng cường chiều sâu thông tin trong các tab hiện có.

### Tab Content (Nội dung)

* [ ] **Tính năng: Điểm dễ đọc (Readability Score)** (Độ khó: **Trung bình**)
    * *Mô tả:* Phân tích văn bản trên trang để đánh giá mức độ dễ đọc. Hiển thị điểm số và có thể gợi ý cải thiện.
    * *Yêu cầu:*
        * Tìm và tích hợp thư viện JavaScript tính điểm dễ đọc (ví dụ: Flesch-Kincaid).
        * Content script lấy nội dung text chính của trang.
        * Hiển thị điểm số trong UI popup.
* [ ] **Tính năng: Phân tích Mật độ Từ khóa Cơ bản (Keyword Density)** (Độ khó: **Trung bình**)
    * *Mô tả:* Đếm tần suất xuất hiện của các từ/cụm từ đơn lẻ và kép trong nội dung chính. Hiển thị danh sách các từ khóa hàng đầu và mật độ tương đối.
    * *Yêu cầu:*
        * Content script xử lý văn bản (loại bỏ stop words, stemming cơ bản).
        * Tính toán tần suất.
        * Hiển thị bảng kết quả trong popup.
* [ ] **Tính năng: Kiểm tra Văn bản thay thế Hình ảnh (Image Alt Text)** (Độ khó: **Dễ**)
    * *Mô tả:* Liệt kê tất cả hình ảnh (`<img>`) trên trang và chỉ ra những ảnh thiếu thuộc tính `alt` hoặc có `alt` trống.
    * *Yêu cầu:*
        * Content script duyệt DOM để tìm thẻ `img`.
        * Kiểm tra thuộc tính `alt`.
        * Hiển thị danh sách ảnh (có thể kèm thumbnail nhỏ) và trạng thái alt text trong popup.

### Tab Structured Data (Dữ liệu có cấu trúc)

* [ ] **Tính năng: Liên kết Xác thực Schema** (Độ khó: **Dễ**)
    * *Mô tả:* Cung cấp các liên kết nhanh đến công cụ kiểm tra của Google (Rich Results Test) và Schema Markup Validator cho các loại schema được phát hiện trên trang.
    * *Yêu cầu:*
        * Xác định loại schema chính (JSON-LD, Microdata).
        * Tạo URL động đến các công cụ validator.
        * Hiển thị các nút/liên kết trong popup.
* [ ] **Tính năng: Trực quan hóa Cấu trúc Schema (Nếu khả thi)** (Độ khó: **Trung bình**)
    * *Mô tả:* Hiển thị cấu trúc lồng nhau của dữ liệu schema dưới dạng cây (tree view) để dễ hình dung mối quan hệ.
    * *Yêu cầu:*
        * Phân tích cú pháp JSON-LD hoặc trích xuất Microdata.
        * Tạo component React hiển thị dạng cây.

### Tab Links (Liên kết)

* [ ] **Tính năng: Đánh dấu Liên kết Nofollow trên Trang** (Độ khó: **Trung bình**)
    * *Mô tả:* Thêm một tùy chọn (ví dụ: checkbox trong popup) để người dùng có thể tô sáng tất cả các liên kết có thuộc tính `rel="nofollow"` trực tiếp trên trang web đang xem.
    * *Yêu cầu:*
        * Content script thêm một lớp CSS đặc biệt cho các thẻ `<a>` có `rel="nofollow"`.
        * CSS định nghĩa kiểu tô sáng cho lớp đó.
        * Nút bật/tắt trong popup để kích hoạt/hủy kích hoạt tính năng này.

### Tab Performance (Hiệu suất)

* [ ] **Tính năng: Kiểm tra Thân thiện với Di động Cơ bản** (Độ khó: **Dễ**)
    * *Mô tả:* Kiểm tra sự tồn tại và cấu hình cơ bản của thẻ `<meta name="viewport">`.
    * *Yêu cầu:*
        * Content script kiểm tra thẻ `meta viewport` trong `<head>`.
        * Hiển thị trạng thái (Có/Không/Lỗi cấu hình cơ bản) trong popup.

### Tab Overview (Tổng quan) & Issues (Vấn đề)

* [ ] **Tính năng: Cải thiện Hệ thống Chấm điểm và Ưu tiên Vấn đề** (Độ khó: **Trung bình**)
    * *Mô tả:* Xem xét lại cách tính điểm SEO tổng thể và cách phân loại mức độ nghiêm trọng của các vấn đề (Cao, Trung bình, Thấp) để phản ánh chính xác hơn tác động SEO.
    * *Yêu cầu:*
        * Định nghĩa lại trọng số cho từng yếu tố SEO.
        * Cập nhật logic tính toán điểm và phân loại vấn đề.

---

## Giai đoạn 2: Thêm Module Tính năng Mới

**Mục tiêu:** Bổ sung các nhóm phân tích SEO quan trọng còn thiếu.

### Module Technical SEO (SEO Kỹ thuật)

* [ ] **Tính năng: Xem và Kiểm tra Robots.txt** (Độ khó: **Trung bình**)
    * *Mô tả:* Fetch và hiển thị nội dung file `robots.txt`. Đánh dấu các chỉ thị `Allow`/`Disallow`. Kiểm tra xem URL hiện tại có bị chặn bởi `robots.txt` hay không.
    * *Yêu cầu:*
        * Background script fetch `/robots.txt`.
        * Phân tích cú pháp cơ bản nội dung file.
        * Hiển thị nội dung và cảnh báo (nếu có) trong một tab/phần mới.
* [ ] **Tính năng: Xem và Kiểm tra Sitemap.xml** (Độ khó: **Trung bình**)
    * *Mô tả:* Tự động tìm URL sitemap (từ `robots.txt` hoặc các vị trí phổ biến). Fetch và hiển thị nội dung sitemap. Kiểm tra định dạng XML cơ bản.
    * *Yêu cầu:*
        * Logic tìm URL sitemap.
        * Background script fetch sitemap.
        * Hiển thị nội dung (có thể dạng cây hoặc danh sách URL) trong popup.
* [ ] **Tính năng: Xem HTTP Headers** (Độ khó: **Trung bình**)
    * *Mô tả:* Hiển thị các HTTP response header quan trọng của trang hiện tại (Status Code, Content-Type, Cache-Control, X-Robots-Tag, v.v.).
    * *Yêu cầu:*
        * Sử dụng `chrome.webRequest` API trong background script để bắt response headers.
        * Gửi headers liên quan đến popup để hiển thị.

---

## Giai đoạn 3: Tích hợp Nâng cao và API Bên ngoài

**Mục tiêu:** Cung cấp các chỉ số và dữ liệu sâu hơn thông qua tích hợp.

* [ ] **Tính năng: Chỉ số Domain/Page Authority (ví dụ: Moz DA/PA)** (Độ khó: **Khó**)
    * *Mô tả:* Hiển thị các chỉ số đánh giá độ uy tín của domain và trang hiện tại từ các dịch vụ như Moz, Ahrefs (nếu có API công khai hoặc trả phí).
    * *Yêu cầu:*
        * Tìm hiểu và tích hợp API của nhà cung cấp (Moz, Semrush, Ahrefs...).
        * Quản lý API key (có thể yêu cầu người dùng nhập key của họ).
        * Xử lý các giới hạn của API.
        * Hiển thị chỉ số trong popup.
* [ ] **Tính năng: Phân tích SERP Cơ bản (Overlay trên Google Search)** (Độ khó: **Khó**)
    * *Mô tả:* Khi người dùng tìm kiếm trên Google, hiển thị một số chỉ số SEO cơ bản (ví dụ: số lượng từ, DA/PA nếu có) bên dưới mỗi kết quả tìm kiếm.
    * *Yêu cầu:*
        * Content script chạy trên trang kết quả tìm kiếm của Google.
        * Xác định các phần tử kết quả tìm kiếm.
        * Trigger phân tích (có thể cần fetch dữ liệu nền) cho mỗi kết quả.
        * Inject thông tin vào DOM của trang kết quả.
* [ ] **Tính năng: Tích hợp Google Search Console (Nếu khả thi)** (Độ khó: **Khó**)
    * *Mô tả:* Cho phép người dùng kết nối tài khoản Google Search Console để xem dữ liệu (số nhấp, hiển thị, vị trí) cho URL hoặc trang web hiện tại ngay trong extension.
    * *Yêu cầu:*
        * Triển khai quy trình xác thực OAuth 2.0.
        * Sử dụng Google Search Console API.
        * Lưu trữ token một cách an toàn.
        * Hiển thị dữ liệu GSC trong popup.

---

## Giai đoạn 4: Cải tiến UI/UX và Tính năng Chung

**Mục tiêu:** Nâng cao trải nghiệm tổng thể và sự tiện dụng.

* [ ] **Tính năng: Tùy chỉnh Kiểm tra/Cài đặt** (Độ khó: **Trung bình**)
    * *Mô tả:* Cho phép người dùng bật/tắt các loại kiểm tra cụ thể (ví dụ: không cần kiểm tra Schema nếu không quan tâm) trong tab Settings để tối ưu hiệu suất và sự liên quan.
    * *Yêu cầu:*
        * Thêm các tùy chọn vào tab Settings.
        * Lưu trữ cấu hình người dùng (`chrome.storage`).
        * Logic phân tích chỉ chạy các kiểm tra đã được bật.
* [ ] **Tính năng: Lịch sử Audit/Snapshot** (Độ khó: **Khó**)
    * *Mô tả:* Lưu lại kết quả audit của một trang tại một thời điểm. Cho phép người dùng xem lại các lần audit trước đó và so sánh sự thay đổi.
    * *Yêu cầu:*
        * Thiết kế cấu trúc lưu trữ dữ liệu audit (`chrome.storage` hoặc IndexedDB nếu dữ liệu lớn).
        * Giao diện để xem lịch sử và so sánh.
* [ ] **Tính năng: Cải thiện Tùy chọn Xuất Dữ liệu** (Độ khó: **Trung bình**)
    * *Mô tả:* Cho phép xuất dữ liệu dưới dạng JSON ngoài CSV. Thêm tùy chọn chỉ xuất một phần dữ liệu cụ thể (ví dụ: chỉ xuất danh sách link hỏng).
    * *Yêu cầu:*
        * Cập nhật logic `LinkExportButton` và có thể tạo component export chung.
        * Thêm lựa chọn định dạng và nội dung xuất.
* [ ] **Tính năng: Tối ưu hóa Hiệu suất Background** (Độ khó: **Trung bình đến Khó**)
    * *Mô tả:* Rà soát lại các tác vụ chạy nền, đảm bảo chúng hiệu quả, không tiêu tốn tài nguyên quá mức, đặc biệt là khi mở nhiều tab. Sử dụng Service Worker (Manifest V3) hiệu quả.
    * *Yêu cầu:*
        * Phân tích hiệu suất background script.
        * Tối ưu hóa các event listener, caching, và tần suất chạy tác vụ.

---

**Ưu tiên đề xuất:**

1.  **Giai đoạn 1:** Hoàn thiện và làm sâu sắc các tính năng hiện có là nền tảng quan trọng. Ưu tiên các kiểm tra On-page cơ bản (Alt text, Readability).
2.  **Giai đoạn 2:** Bổ sung các kiểm tra Technical SEO cốt lõi (Robots.txt, Sitemap, Headers) vì chúng cung cấp thông tin nền tảng quan trọng.
3.  **Giai đoạn 4 (một phần):** Cải thiện UI/UX như tùy chỉnh cài đặt và tối ưu hiệu suất nên được xen kẽ để nâng cao trải nghiệm.
4.  **Giai đoạn 3 & phần còn lại Giai đoạn 4:** Các tính năng nâng cao, tích hợp API, SERP analysis, và lịch sử audit có độ khó cao hơn và có thể thực hiện sau khi nền tảng vững chắc.
