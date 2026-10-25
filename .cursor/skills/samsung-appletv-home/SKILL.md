---
name: samsung-appletv-home
description: >-
  Guides Samsung Smart TV owners through building and installing an Apple TV–style
  Tizen Home (.wgt): interview TV info, public calendar, favorites, weather, wallpaper,
  default-home settings, then build/sign/install via Tizen SDK + SDB. Use when the user
  mentions Samsung TV home theme, AppleTvHome, sideload .wgt, webcal calendar on TV,
  CleanYourTV-on-Tizen, or wants a clean tvOS-like launcher for family use.
---

# Samsung Apple TV–style Home (owner onboarding)

Agent skill for **Samsung TV owners** (not firmware mods). Goal: a clean Apple-TV-like Home web app, customized per household, installed on their TV.

**Reference implementation:** this repo (`AppleTvHome`) or a clone.  
**Non-tech owner guide (VI, from Developer Mode):** [../../../docs/HUONG-DAN-NGUOI-DUNG.md](../../../docs/HUONG-DAN-NGUOI-DUNG.md)  
**Detailed Q&A script:** [interview.md](interview.md)  
**Owner TV checklist (VI):** [owner-checklist.md](owner-checklist.md)  
**Tech limits / deploy:** [reference.md](reference.md)

When onboarding a **non-technical owner**, send them `docs/HUONG-DAN-NGUOI-DUNG.md` first (or walk sections A→C and G with them). Do not assume they know IP, DUID, or ICS.

## Hard safety (never violate)

- Never modify firmware, bootloader, root, factory menus, or Samsung system apps.
- Never use Android ADB on Tizen TVs.
- Never claim the custom app fully replaces the Home button / Smart Hub.
- Never commit or print cert passwords / private keys.
- Never claim TV visual success without install/launch verification (screenshot often unsupported).

## Workflow (follow in order)

Copy and track:

```
Progress:
- [ ] 0. Safety + language
- [ ] 1. Interview (see interview.md) — do not skip
- [ ] 2. Mac/SDK/cert readiness
- [ ] 3. TV discovery (read-only SDB)
- [ ] 4. Customize app (dock, weather, calendar, wallpaper)
- [ ] 5. Build + sign + install + launch
- [ ] 6. Default-home / Autorun Last App (owner TV settings)
- [ ] 7. Verify + hand off owner checklist
```

### 0. Safety + language

- Speak the owner’s language (default **Vietnamese** if they write VI).
- State limits once, plainly: sideload Home; Smart Hub / Home button may still appear; no ad-removal via root.

### 1. Interview — ask thoroughly before coding

Use [interview.md](interview.md). **Do not build until these are answered** (or marked N/A):

1. TV model, year, size, IP, Developer Mode, DUID (if known)
2. Computer OS (prefer macOS with Tizen Studio) + whether SDK/certs exist
3. Favorite apps for the **5 dock tiles** (order matters)
4. Weather place (city/district) or lat/lon
5. Public calendar: webcal/https ICS URL + how to publish from iCloud/Google
6. Wallpaper preference (cinematic dark vs custom folder)
7. Want “return to this Home after exiting apps” + power-on Autorun Last App?
8. Language of UI strings

Ask follow-ups until answers are concrete (app names, IP like `192.168.x.x`, calendar URL).

### 2. Mac / SDK / cert

- Node 18+ for Tizen skill CLIs; put Homebrew bash + Tizen tools on `PATH` carefully (see [reference.md](reference.md)).
- Samsung **public** distributor cert must include this TV’s **DUID**.
- Password files under `~/.config/tizen/` — source them; never echo.

### 3. TV discovery (read-only)

1. Owner enables Developer Mode + Host PC IP = Mac IP; TV reboot if needed.
2. `remote-device connect <TV_IP>` (port **26101**).
3. Capability: note `platform_version`, `sdbd_rootperm`, `rootonoff_support`.
4. Expect empty `pkgcmd -l` / `app_launcher -S` on non-root TVs — use app `getAppsInfo` after install for app lists.

### 4. Customize from interview

| Owner answer | Where to change |
| --- | --- |
| Dock apps (5) | `js/app.js` `DOCK` + logos in `images/` |
| Weather location | `js/weather.js` `LAT`/`LON`/`PLACE` |
| Calendar ICS | `js/calendar.js` `CAL_URL` + CSP `connect-src` in `index.html` |
| Wallpaper set | `images/wallpapers/wp0N.jpg` + `js/wallpaper.js` |
| Theme sizes | `css/app.css` |
| Default reclaim | already in app; owner must set TV Autorun (step 6) |

Keep UI simple: black theme, big type, left hours / center calendar / right days, centered dock.

### 5. Build + install

Typical path (adapt project root):

```bash
export PATH="…/node/bin:/opt/homebrew/bin:$HOME/tizen-sdk/tools:$HOME/tizen-sdk/tools/ide/bin:$HOME/tizen-sdk/tools/tizen-core:$PATH"
# source cert password file without printing
node remote-device-cli.js connect <TV_IP>
node project-manager-cli.js build --project <AppleTvHome> --build-type Debug --sign-profile AppleTvHome
node remote-device-cli.js connect <TV_IP>
TIZEN_RDS_ENABLED=0 node project-manager-cli.js install --package <…>/Debug/AppleTvHome.wgt --device-serial <TV_IP>:26101 --run
```

Report install envelope: `installation_status`, `app_launched`. Bump `config.xml` version on each owner-facing deploy.

### 6. Default Home (honest)

**In-app (agent):** multitasking + `eden_resume` + background reclaim when Smart Hub / exited apps.

**On TV (owner must do):** guide with [owner-checklist.md](owner-checklist.md) — disable Start with Smart Hub, enable Autorun Last App, power off while this Home is open.

Cannot replace the physical Home key.

### 7. Hand-off

Give owner:

- App name / how to open from Apps
- Dock apps + calendar + weather configured
- TV Autorun steps
- What still comes from Samsung (ads on Smart Hub, Home button)
- How to update later (reinstall `.wgt`)

## Interview gate

If the owner says “làm giúp” without details → open [interview.md](interview.md) and ask sections A→F before editing code.

## Related skills

- Tizen SDK skills (`tizen-remote-device`, `tizen-install-app`, `tizen-sdb-helper`) for connect/build/install.
- Prefer those runners over raw `sdb` when available.
