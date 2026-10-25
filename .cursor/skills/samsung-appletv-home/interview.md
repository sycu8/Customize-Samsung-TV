# Phỏng vấn chủ sở hữu Samsung TV

Hỏi **từng mục**. Không đoán. Ghi lại câu trả lời rồi mới customize/build.

## A. TV & mạng

1. Model TV? (in trên hộp / Settings → Hỗ trợ → Giới thiệu) — ví dụ `UA55U8500…`
2. Năm mua / One UI / Tizen (nếu biết)?
3. TV và máy tính cùng Wi‑Fi/LAN không?
4. IP của TV? (Settings → Mạng → Trạng thái mạng)
5. Đã bật **Developer Mode** chưa? (Apps → số 12345 → On; Host PC IP = IP máy Mac)
6. Đã lấy **DUID** chưa? (cần gắn vào chứng chỉ distributor Samsung)

## B. Máy build (thường là Mac)

1. macOS / Windows / Linux?
2. Đã cài Tizen Studio + TV Extension chưa?
3. Đã có profile ký Samsung (author + distributor public) cho DUID TV này chưa?
4. Đường dẫn project mong muốn? (mặc định gợi ý `~/tu_projects/AppleTvHome` hoặc repo sẵn)

## C. Ứng dụng hay dùng (dock 5 ô)

Hỏi: “Liệt kê **đúng 5 app** mở nhiều nhất, theo thứ tự trái → phải.”

Gợi ý phổ biến VN: VieON, VTVgo, Netflix, YouTube, Apple TV / trình duyệt / Spotify…

Với mỗi app:

- Tên hiển thị trên TV
- Có logo sẵn không (ảnh PNG/JPG)? Owner gửi file nếu muốn logo chuẩn
- Ô thứ 5 có phải “mở tất cả app” (launchpad) không?

## D. Thời tiết

1. Ở đâu? (quận/huyện + thành phố) — ví dụ Quận 7, TP.HCM
2. Chỉ cần hiện tại + 6 giờ + vài ngày tới?
3. Cần độ ẩm / bụi (PM2.5) không?

## E. Lịch công khai (đồng bộ)

Giải thích ngắn: TV đọc **lịch public ICS** (webcal/https), không đăng nhập iCloud trong app.

### Cách lấy link (iPhone/Mac — iCloud)

1. Mở Lịch → chọn lịch (ví dụ “Nhà”)
2. Chia sẻ lịch / **Public Calendar** / Đăng lịch công khai
3. Copy link dạng `webcal://…icloud.com/published/…` hoặc `https://…`
4. Dán cho agent. Agent ghi vào `js/calendar.local.js` (file gitignore). Không commit, không dán lại full link lên GitHub hay chat.

### Google Calendar

1. Settings lịch → Access permissions → Make available to public (hoặc secret address in iCal)
2. Copy địa chỉ iCal `https://calendar.google.com/calendar/ical/…/basic.ics`

Hỏi owner:

1. Link webcal/https là gì?
2. Múi giờ? (mặc định `Asia/Ho_Chi_Minh`)
3. Hiện tối đa bao nhiêu sự kiện 7 ngày tới? (gợi ý 4–6)

## F. Giao diện & mặc định

1. Wallpaper: cinematic tối (mặc định) hay owner cung cấp ảnh?
2. Ngôn ngữ UI: Tiếng Việt / English?
3. Khi **thoát Netflix/YouTube** → muốn tự về Home này?
4. Khi **tắt/mở TV** → muốn tự mở lại Home này? (cần bật Autorun Last App trên TV)
5. Có trẻ nhỏ / người lớn tuổi không? (font to, ít chữ)

## G. Ranh giới (xác nhận hiểu)

Đọc và xác nhận owner hiểu:

- Không thay hoàn toàn nút Home Samsung
- Không gỡ quảng cáo Smart Hub bằng root
- App sideload; cập nhật = cài lại `.wgt`
- Cert/DUID gắn với TV; đổi TV phải thêm DUID mới

## Kết thúc phỏng vấn

Tóm tắt 1 khối cho owner xác nhận:

```
TV: <model> @ <ip>
Dock: 1) … 2) … 3) … 4) … 5) …
Weather: <place>
Calendar: <url hoặc “chưa có”>
Autorun: <có/không>
UI: <vi/en>
```

Chỉ khi owner OK → sang customize + deploy.
