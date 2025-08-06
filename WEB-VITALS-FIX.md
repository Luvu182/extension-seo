# Sửa lỗi Web Vitals trong Extension (Tối ưu hóa)

## Vấn đề
1. Extension không thể đo lường chính xác các chỉ số Web Vitals sau khi đóng gói bằng Webpack.
2. Dữ liệu Web Vitals trả về là một đối tượng rỗng `{}`.
3. Lỗi kết nối "Receiving end does not exist" khi script cố gắng gửi dữ liệu.
4. Dữ liệu Web Vitals không được cập nhật tự động trong popup khi có kết quả mới.
5. Quá trình đo Web Vitals không hoàn thành trước khi hiển thị kết quả.

## Giải pháp tối ưu

### 1. Chỉ sử dụng phương pháp đo trực tiếp
Chúng ta đã loại bỏ tất cả các phương pháp phức tạp và chỉ giữ lại cách tiêm script `direct-web-vitals.js`, vì phương pháp này đã chứng minh là hiệu quả. Điều này làm giảm kích thước extension và cải thiện hiệu suất.

### 2. Cải thiện tính ổn định của script
- Thêm cơ chế "ping" để kiểm tra xem kết nối với extension có còn hoạt động trước khi gửi dữ liệu.
- Xử lý lỗi kết nối một cách im lặng để tránh các thông báo lỗi không cần thiết trong console.
- Đảm bảo dữ liệu được lưu trữ đúng cách trong `webVitals` object.
- Thêm cơ chế theo dõi trạng thái thu thập dữ liệu cho từng loại metric (TTFB, LCP, CLS, FID).
- Đảm bảo đã thu thập đủ dữ liệu trước khi gửi kết quả.
- Tăng thời gian timeout và số lần thử lại khi gặp lỗi kết nối.

### 3. Cải thiện cập nhật dữ liệu trong popup
- Thêm cơ chế chủ động lấy dữ liệu web vitals mới nhất khi popup mở.
- Cải thiện cách xử lý thông báo web vitals để luôn cập nhật UI.
- Đảm bảo không ảnh hưởng đến chức năng phát hiện SPA khi cập nhật dữ liệu web vitals.

### 3. Tối ưu hóa manifest.json
Chỉ khai báo `direct-web-vitals.js` trong phần `web_accessible_resources`, loại bỏ các tham chiếu không cần thiết đến các thư viện không sử dụng.

## Cách sử dụng
1. Chạy `rebuild.bat` để build lại extension với các thay đổi mới.
2. Tải lại extension trong Chrome.
3. Các chỉ số Web Vitals sẽ được đo lường và hiển thị trong tab Overview.

## Cách hoạt động
Script `direct-web-vitals.js` được tiêm vào trang web trong một "isolated world" và sử dụng Performance API của trình duyệt để đo lường:
- TTFB (Time to First Byte): Thời gian nhận byte đầu tiên
- LCP (Largest Contentful Paint): Thời gian tải phần tử chính
- CLS (Cumulative Layout Shift): Mức độ biến động bố cục
- FID (First Input Delay): Độ trễ tương tác đầu tiên

Quá trình hoạt động được cải tiến:
1. Khi script được tiêm, nó bắt đầu đo lường tất cả các chỉ số và đánh dấu trạng thái thu thập.
2. Mỗi chỉ số khi được đo sẽ được đưa vào hàng đợi và đánh dấu là đã thu thập.
3. Script sẽ kiểm tra xem đã thu thập đủ dữ liệu chưa trước khi gửi kết quả.
4. Nếu đã thu thập đủ dữ liệu hoặc đã đạt timeout, script sẽ gửi kết quả đến background script.
5. Background script nhận dữ liệu và gửi thông báo cập nhật đến popup.
6. Popup lắng nghe thông báo và cập nhật UI ngay khi có dữ liệu mới.

## Lưu ý quan trọng
- Các lỗi kết nối được xử lý im lặng mà không ảnh hưởng đến trải nghiệm người dùng.
- Không cần các thư viện web-vitals phức tạp, chỉ sử dụng API gốc của trình duyệt.
- Xác thực dữ liệu được thực hiện để đảm bảo chỉ lưu trữ các giá trị hợp lệ.
- Dữ liệu web vitals được cập nhật tự động trong popup mà không cần đóng mở lại.
- Quá trình đo web vitals không ảnh hưởng đến chức năng phát hiện SPA.
