# Cập nhật Cách Tính điểm Structure & Linking

## Tổng quan

Tài liệu này mô tả cách tính điểm mới cho phần Structure & Linking trong chức năng chấm điểm SEO của extension. Các thay đổi được thực hiện nhằm cung cấp đánh giá chính xác hơn về cấu trúc liên kết và schema markup của trang web.

## Cách chấm điểm mới

### Tổng quan
- Tổng điểm Structure & Linking: 15 điểm
  - Internal Links: 5 điểm
  - External Links: 5 điểm
  - Schema Markup: 5 điểm

### 1. Internal Links (5 điểm)

Thang điểm chi tiết dựa trên số lượng internal links:

| Số lượng Internal Links | Điểm |
|-------------------------|------|
| 10 hoặc nhiều hơn      | 5    |
| 6-9                    | 4    |
| 3-5                    | 3    |
| 2                      | 2    |
| 1                      | 1    |
| 0                      | 0    |

**Lý do:** Các trang web với nhiều internal links tạo nên cấu trúc web chắc chắn, giúp người dùng và bots điều hướng dễ dàng giữa các trang, cũng như phân phối link juice tốt hơn.

### 2. External Links (5 điểm)

Thang điểm chi tiết dựa trên số lượng external links:

| Số lượng External Links | Điểm |
|-------------------------|------|
| 5 hoặc nhiều hơn       | 5    |
| 4                      | 4    |
| 3                      | 3    |
| 2                      | 2    |
| 1                      | 1    |
| 0                      | 0    |

**Lý do:** External links chất lượng (outbound links) cho thấy trang web đáng tin cậy và được kết nối tốt với các nguồn thông tin khác. Google sử dụng external links để hiểu ngữ cảnh và độ tin cậy của trang.

### 3. Schema Markup (5 điểm)

Thang điểm chi tiết dựa trên số lượng schema items:

| Số lượng Schema Items  | Điểm |
|------------------------|------|
| 3 hoặc nhiều hơn      | 5    |
| 2                     | 4    |
| 1                     | 3    |
| Có schema nhưng không đếm được | 2    |
| Không có schema       | 0    |

**Lý do:** Schema markup giúp công cụ tìm kiếm hiểu nội dung trang web và tạo rich snippets. Nhiều loại schema khác nhau (Organization, Product, Article, v.v.) giúp cung cấp ngữ cảnh phong phú hơn.

## Cải tiến kỹ thuật

1. **Đa dạng định dạng dữ liệu:**
   - Hỗ trợ đa dạng cấu trúc dữ liệu links
   - Tự động phát hiện cả định dạng đơn giản (counts) và phức tạp (items arrays)

2. **Phát hiện schema toàn diện:**
   - Kiểm tra cả JSON-LD, Microdata và RDFa
   - Đếm số lượng schema items để chấm điểm chi tiết hơn

3. **Logging chi tiết:**
   - Thêm thông tin debug chi tiết cho các thành phần điểm số
   - Hiển thị số lượng links và schema items thực tế

## Lợi ích

- **Đánh giá chính xác hơn:** Thang điểm chi tiết phản ánh tốt hơn chất lượng thực tế của cấu trúc và liên kết.
- **Hướng dẫn cải thiện rõ ràng:** Chỉ ra mục tiêu cụ thể để cải thiện từng thành phần (ví dụ: cần thêm bao nhiêu internal links để đạt điểm cao hơn).
- **Phù hợp với thực tiễn SEO:** Phù hợp với các hướng dẫn SEO hiện đại từ Google và các chuyên gia.

Việc cập nhật này giúp đưa ra đánh giá chính xác hơn về cấu trúc liên kết của trang web, đồng thời cung cấp thông tin chi tiết để người dùng biết nên cải thiện điểm số như thế nào.
