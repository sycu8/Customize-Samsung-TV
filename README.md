# AppleTvHome — Samsung TV Home kiểu Apple TV

Ứng dụng web Tizen (`.wgt`) tạo màn Home sạch, tối, giống Apple TV: đồng hồ lớn, thời tiết, lịch, 5 app hay dùng, wallpaper xoay.

**Không** thay firmware, **không** thay hoàn toàn nút Home Samsung, **không** root.

---

## Cho chủ TV (không cần biết code)

👉 Đọc trước: **[docs/HUONG-DAN-NGUOI-DUNG.md](docs/HUONG-DAN-NGUOI-DUNG.md)**

Gồm:

1. Ghi model + IP TV  
2. **Bật Developer Mode** (Apps → nhấn `12345`)  
3. Lấy link lịch public (iCloud / Google)  
4. Chọn 5 app hay dùng  
5. Cấu hình “Autorun Last App” để tắt/mở TV gần như mở lại Home này  

Sau đó nhờ người kỹ thuật / Cursor agent cài file `.wgt` lên TV.

---

## Cho agent / kỹ thuật

### Agent Skill (Cursor)

Đường dẫn:

```
.cursor/skills/samsung-appletv-home/
├── SKILL.md           # quy trình agent
├── interview.md       # hỏi chủ TV trước khi build
├── owner-checklist.md # checklist ngắn tiếng Việt
└── reference.md       # giới hạn Tizen, cert, deploy
```

Cài skill cá nhân (tuỳ chọn):

```bash
cp -R .cursor/skills/samsung-appletv-home ~/.cursor/skills/
```

Khi user nói “làm Home Apple TV cho Samsung” → agent **phải đọc skill** và **phỏng vấn** trước khi code.

### Repo / máy mẫu đã verify

| Mục | Giá trị |
| --- | --- |
| TV mẫu | Samsung UA55U8500FKXXV |
| Tizen | 9.0 |
| App id | `uTr82d3TO7.AppleTvHome` |
| Package | `uTr82d3TO7` |

### Build & cài (tóm tắt)

Cần: Tizen Studio + TV Extension, chứng chỉ Samsung public có **DUID** TV, Developer Mode On.

```bash
# PATH: Node 18+ → Homebrew → tizen-sdk tools
# source file mật khẩu cert (không in ra)

node remote-device-cli.js connect <TV_IP>
node project-manager-cli.js build --project . --build-type Debug --sign-profile AppleTvHome
node remote-device-cli.js connect <TV_IP>
TIZEN_RDS_ENABLED=0 node project-manager-cli.js install \
  --package ./Debug/AppleTvHome.wgt \
  --device-serial <TV_IP>:26101 --run
```

Chi tiết: `.cursor/skills/samsung-appletv-home/reference.md`

### Tuỳ biến nhanh

| Muốn đổi | File |
| --- | --- |
| 5 app dock | `js/app.js` → `DOCK` + `images/` |
| Thời tiết / vị trí | `js/weather.js` |
| Lịch ICS | `js/calendar.local.js` (không commit) + host trong CSP `index.html` |
| Wallpaper | `images/wallpapers/` + `js/wallpaper.js` |
| Giao diện | `css/app.css` |

---

## Tính năng chính

- Đồng hồ + chào theo buổi  
- Thời tiết hiện tại, vài giờ tới, vài ngày tới (Open-Meteo)  
- Lịch 7 ngày từ webcal/ICS public  
- Dock 5 app + launchpad “Apple TV”  
- Panel Cài đặt / Internet trong app  
- Wallpaper xoay mỗi 2 phút  
- Multitasking + cố mở lại Home khi thoát app / Smart Hub hiện  

---

## An toàn

- Không commit mật khẩu / `.p12` / `.pwd` / `js/calendar.local.js`  
- Không root TV  
- Lịch public = ai có link cũng xem được sự kiện. Link nằm trên máy cài TV, không đưa lên GitHub  

---

## Giấy phép / ghi chú

Wallpaper mẫu từ Unsplash (cinematic). Logo app do chủ TV cung cấp / tải thương hiệu — kiểm tra quyền sử dụng khi phân phối rộng.

Samsung, Apple TV, Netflix, YouTube… là thương hiệu của chủ sở hữu tương ứng.
