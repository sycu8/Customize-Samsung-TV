# Hướng dẫn dùng Home kiểu Apple TV trên Samsung (cho người không chuyên)

Tài liệu này viết cho **chủ nhà / người dùng thường**: từng bước, ít thuật ngữ.  
Nếu bạn nhờ người kỹ thuật (hoặc AI agent) cài giúp, vẫn nên đọc mục **A–C** và **G** vì phải làm trên TV của bạn.

---

## Bạn sẽ có gì?

Một ứng dụng tên kiểu **AppleTvHome** trên TV Samsung:

- Màn hình đen sạch, đồng hồ to, thời tiết, lịch 7 ngày
- 5 ô app hay dùng (VieON, Netflix, YouTube…)
- Wallpaper đổi định kỳ
- Có thể tự quay lại màn này sau khi thoát app khác (nếu cấu hình đúng)

## Bạn sẽ **không** có gì?

- **Không** thay hoàn toàn nút Home trên remote (nút Home vẫn có thể mở Smart Hub Samsung)
- **Không** xóa quảng cáo trong Smart Hub bằng cách “hack” TV
- **Không** cần root / sửa phần cứng

---

# A. Chuẩn bị trước

## A1. Những thứ cần có

| Thứ | Ghi chú |
| --- | --- |
| TV Samsung Tizen (2015 trở lên, khuyến nghị 2020+) | Cùng Wi‑Fi với máy tính |
| Máy Mac (khuyến nghị) hoặc PC | Người cài app dùng để build |
| Remote TV | Để bật Developer Mode |
| Điện thoại (tuỳ chọn) | Để lấy link lịch iCloud / Google |

## A2. Ghi lại thông tin TV

1. Bật TV, vào **Settings (Cài đặt)**.
2. Vào **Support / Hỗ trợ** → **About This TV / Giới thiệu** (tên menu có thể hơi khác).
3. Ghi lại:
   - **Model** (ví dụ `UA55U8500…`)
   - **Software version** (nếu thấy)

4. Vào **Settings → Network / Mạng → Network Status / Trạng thái mạng**.
5. Ghi lại **IP Address** (ví dụ `192.168.100.175`).

Giữ tờ giấy / ghi chú này cho người cài app.

---

# B. Bật Developer Mode trên Samsung TV (bắt buộc)

> Làm đúng từng bước. Nếu bỏ qua, máy tính **không kết nối** được để cài app.

## B1. Mở màn hình Developer

1. Trên remote, mở **Smart Hub / Home** rồi vào **Apps** (Ứng dụng).
2. Ở màn Apps, nhấn lần lượt các số trên remote: **`1` `2` `3` `4` `5`**.
3. Cửa sổ **Developer Mode** hiện ra.
   - Nếu không hiện: thử đứng đúng màn **Apps**, nhấn chậm từng số; một số model cần focus vào ô tìm kiếm app trước.

## B2. Bật chế độ và gán máy tính

1. **Developer Mode** → chọn **On**.
2. Ô **Host PC IP**: nhập **IP của máy Mac/PC** sẽ cài app (không phải IP TV).
   - Cách xem IP Mac: **System Settings → Network → Wi‑Fi → Details** → IP Address.
3. Chọn **OK** / Confirm.
4. TV thường hỏi **khởi động lại** → chọn **OK** và đợi TV lên lại.

## B3. Kiểm tra nhanh

Sau khi TV khởi động lại:

- Developer Mode vẫn **On**
- Host PC IP vẫn đúng IP máy tính

Nếu đổi Wi‑Fi / đổi IP máy tính sau này → vào lại Developer Mode và **sửa Host PC IP**.

---

# C. Lấy DUID (chỉ lần đầu ký chứng chỉ)

Người cài app cần **DUID** của TV để Samsung cho phép cài app thử nghiệm.

Cách phổ biến:

1. Kết nối máy tính ↔ TV bằng công cụ Tizen (SDB) — người kỹ thuật làm.
2. Hoặc trong một số phiên bản, DUID hiện trong màn Developer Mode / Device info.

Bạn chỉ cần: **đưa IP TV + bật Developer Mode**; người cài sẽ lấy DUID và gắn vào chứng chỉ.

> Không gửi mật khẩu chứng chỉ / file `.p12` lên chat công khai.

---

# D. Chuẩn bị lịch công khai (tuỳ chọn nhưng nên làm)

Home có thể hiện **sự kiện 7 ngày tới** từ lịch public. TV **không** đăng nhập iCloud trong app — chỉ đọc link chia sẻ.

## D1. iCloud (iPhone / Mac)

1. Mở app **Calendar / Lịch**.
2. Chọn lịch cần hiện trên TV (ví dụ “Nhà”, “Gia đình”).
3. Bật chia sẻ **công khai** / **Public Calendar** / “Đăng lịch công khai” (tên tùy phiên bản).
4. **Copy link** dạng:
   - `webcal://p…-caldav.icloud.com/published/…`  
   hoặc `https://…`
5. Gửi link cho người cài app.

⚠️ Ai có link cũng xem được tên sự kiện trên lịch đó. Đừng public lịch riêng tư/nhạy cảm.

Người kỹ thuật lưu link trong file riêng trên máy họ (`calendar.local.js`). File này không được đưa lên GitHub.

## D2. Google Calendar

1. Máy tính → [calendar.google.com](https://calendar.google.com) → bánh răng **Settings**.
2. Chọn lịch bên trái → **Integrate calendar**.
3. Copy **Secret address in iCal format** (đường dẫn `.ics`).
4. Gửi cho người cài.

## D3. Kiểm tra link

Mở link `https://…` trên máy tính: phải tải/file text bắt đầu bằng `BEGIN:VCALENDAR`.  
Nếu lỗi 404/đăng nhập → link chưa public đúng.

---

# E. Chọn 5 app hay dùng + nơi ở (thời tiết)

Viết sẵn gửi người cài:

```
1) (trái nhất) ………
2) ………
3) ………
4) ………
5) (phải nhất / mở thêm app) ………

Nơi ở xem thời tiết: …………… (ví dụ: Quận 7, TP.HCM)
Link lịch: …………… (hoặc “chưa có”)
```

Có logo riêng (PNG/JPG rõ) thì gửi kèm.

---

# F. Người kỹ thuật / Agent sẽ làm gì? (bạn theo dõi)

Họ sẽ:

1. Cài Tizen Studio + chứng chỉ Samsung (một lần)
2. Kết nối TV qua IP (cổng 26101)
3. Build file `.wgt` và **cài + mở** trên TV
4. Chỉnh dock / thời tiết / lịch / wallpaper theo câu trả lời của bạn

Bạn chỉ cần giữ TV **bật**, Developer Mode **On**, cùng mạng với máy họ.

Khi xong, trên TV vào **Apps** → tìm **AppleTvHome** → mở.

---

# G. Để gần như “mặc định” khi tắt/mở TV

Samsung **không** cho app thường thay nút Home. Cách gần nhất:

## G1. Tắt tự mở Smart Hub — bật app gần nhất

1. Remote → **Settings** → **All Settings** (Tất cả cài đặt).
2. **General & Privacy** (Chung & quyền riêng tư).
3. **Start Screen Option** / **Tùy chọn màn hình bắt đầu**  
   (một số máy: **Smart Features** / Smart Screen Options).
4. **Tắt** mục kiểu: **Start with Smart Hub Home** / Bắt đầu bằng Smart Hub.
5. **Bật** mục kiểu: **Autorun Last App** / Tự chạy ứng dụng gần nhất.

Tên menu có thể khác vài chữ theo năm máy — nếu không thấy, tìm trong Settings với từ khóa `Start`, `Smart Hub`, `Autorun`.

## G2. Thủ thuật quan trọng

1. Mở **AppleTvHome**.
2. **Tắt TV bằng remote** (không rút điện nếu có thể).
3. Bật lại: TV sẽ **cố** mở lại app vừa dùng (Home này), nếu model hỗ trợ.

## G3. Khi xem Netflix / YouTube

Mở app từ Home này → khi thoát, app cố **kéo bạn về Home**.  
Nếu vẫn về Smart Hub: mở lại AppleTvHome từ Apps; kiểm tra lại G1.

## G4. Nút Home trên remote

Vẫn có thể mở giao diện Samsung. Đó là giới hạn hệ thống, không phải lỗi cài đặt.

---

# H. Kiểm tra sau khi cài (checklist)

- [ ] Mở được AppleTvHome từ Apps
- [ ] Đồng hồ / ngày đúng
- [ ] Thời tiết hiện (cần mạng)
- [ ] Lịch hiện (nếu đã cấu hình link)
- [ ] 5 logo app bấm được
- [ ] Cài đặt / Internet dưới màn hình mở panel
- [ ] Thoát YouTube/Netflix → về lại Home (thường)
- [ ] Đã làm mục G (Autorun Last App)

---

# I. Sự cố thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| Máy tính không kết nối TV | Cùng Wi‑Fi; Developer Mode On; Host PC IP = IP máy tính; khởi động lại TV |
| Cài app lỗi chứng chỉ | DUID TV chưa nằm trong distributor cert — nhờ người cài thêm DUID |
| Không thấy thời tiết | TV cần Internet; đợi vài giây |
| Không thấy lịch | Link chưa public / CSP chưa thêm domain — gửi lại link |
| Tắt mở TV vẫn vào Smart Hub | Làm lại mục G; tắt TV khi đang ở AppleTvHome |
| App biến mất sau cập nhật TV | Cài lại `.wgt`; kiểm tra Developer Mode |

---

# J. Bảo mật & quyền riêng tư

- Chỉ bật Developer Mode khi cần cài/sửa app; xong có thể tắt (cài rồi vẫn dùng được app).
- Lịch public = nội dung sự kiện có thể bị lộ nếu share link lung tung.
- Không đưa file mật khẩu chứng chỉ cho người lạ.

---

# K. Gỡ app

Apps → chọn AppleTvHome → **Delete** / Gỡ cài đặt.  
Smart Hub Samsung vẫn còn.

---

## Tài liệu liên quan trong repo

- Agent skill: `.cursor/skills/samsung-appletv-home/`
- Phỏng vấn kỹ thuật: `.cursor/skills/samsung-appletv-home/interview.md`
- Checklist ngắn: `.cursor/skills/samsung-appletv-home/owner-checklist.md`
