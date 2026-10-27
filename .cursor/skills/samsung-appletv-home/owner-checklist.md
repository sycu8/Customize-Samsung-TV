# Checklist cho chủ Samsung TV (tiếng Việt)

Làm lần lượt. Đánh dấu khi xong.

**Hướng dẫn đầy đủ từng bước (có hình mô tả chữ):** xem [`docs/HUONG-DAN-NGUOI-DUNG.md`](../../../docs/HUONG-DAN-NGUOI-DUNG.md).

## 1. Chuẩn bị TV

- [ ] TV và máy tính cùng mạng
- [ ] Settings → Mạng → ghi lại **IP TV**
- [ ] Mở **Apps** → nhấn số **1 2 3 4 5** trên remote → bật **Developer Mode**
- [ ] **Developer Mode = On**
- [ ] **Host PC IP** = IP máy Mac/PC đang cài app (không phải IP TV)
- [ ] Khởi động lại TV nếu được yêu cầu
- [ ] (Lần đầu ký app) lấy **DUID** theo hướng dẫn agent / Tizen Certificate Manager

## 2. Lịch công khai (nếu muốn hiện lịch trên Home)

### iCloud

- [ ] iPhone/Mac → Lịch → lịch cần đồng bộ
- [ ] Bật chia sẻ **công khai** / Public Calendar
- [ ] Copy link `webcal://…` hoặc `https://…`
- [ ] Gửi link cho người cài app (agent)

### Google

- [ ] Google Calendar → Settings → Integrate calendar → **Secret address in iCal**
- [ ] Copy URL `.ics` → gửi cho agent

> Lịch public ai có link cũng xem được nội dung sự kiện. Đừng publish lịch nhạy cảm.

## 3. App hay dùng

- [ ] Viết 5 app mở nhiều nhất, theo thứ tự trên màn hình
- [ ] (Tuỳ chọn) gửi file logo PNG/JPG rõ nét

## 4. Sau khi agent cài xong trên TV

- [ ] Mở **Apps** → tìm **AppleTvHome** (hoặc tên agent đặt) → mở
- [ ] Kiểm tra: giờ, thời tiết, lịch, 5 logo app
- [ ] Thử mở 1 app (YouTube/Netflix) → thoát → xem có về Home này không

## 5. Để gần như “mặc định” khi tắt/mở TV

Tên menu có thể hơi khác theo model:

- [ ] Remote → Settings → **All Settings**
- [ ] Máy 2025: **Advanced Features** (Tính năng nâng cao). Máy 2023–2024: **General & Privacy**
- [ ] **Start Screen Option** / Tùy chọn màn hình bắt đầu
- [ ] **Tắt** “Start with Smart Hub Home” / Bắt đầu bằng Smart Hub
- [ ] **Bật** “Autorun Last App” / Tự chạy ứng dụng gần nhất, nếu máy có dòng này
- [ ] Đang ở **AppleTvHome** → tắt TV bằng remote (không rút điện nếu có thể)

Lần mở TV sau: TV sẽ cố mở lại app vừa dùng (Home này) nếu model hỗ trợ multitasking.

## 6. Việc Samsung vẫn giữ

- Nút **Home** trên remote có thể vẫn mở Smart Hub
- Quảng cáo / đề xuất trên Smart Hub không gỡ bằng app này
- Không root / không sửa firmware

## 7. Cập nhật / gỡ

- Cập nhật giao diện: nhờ agent build lại và cài đè `.wgt`
- Gỡ: Apps → AppleTvHome → Delete (hoặc agent uninstall) — Smart Hub vẫn còn
