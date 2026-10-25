# Technical reference

## What works / what does not

| Goal | Reality |
| --- | --- |
| Custom Home UI | Sideloaded Tizen web `.wgt` |
| Replace Home button | **No** (Samsung reserved) |
| Return after exiting apps | Best-effort: `background-support`, reclaim timer, `launchAppControl` reply |
| Power-on auto open | Owner: Autorun Last App + app `multitasking.support` + `eden_resume` |
| List packages via SDB | Often **empty** without root |
| Screenshots via SDB | Often unsupported |
| CleanYourTV Android addons | **Port features only** — no ADB |

## Project map (AppleTvHome)

| Path | Role |
| --- | --- |
| `config.xml` | privileges, multitasking, prelaunch, version |
| `index.html` | CSP `connect-src` (weather + calendar hosts) |
| `js/app.js` | dock, launchpad, home reclaim |
| `js/weather.js` | Open-Meteo location |
| `js/calendar.js` | ICS / webcal URL |
| `js/wallpaper.js` | rotate wallpapers |
| `js/panels.js` | in-app Settings / Internet / ads audit |
| `css/app.css` | layout |
| `images/` | logos + `wallpapers/wp0N.jpg` |

## PATH (macOS)

Prefer Node 18+ from a known good install, then Homebrew bash **after** Node if needed for Tizen scripts, then Tizen tools:

```bash
export PATH="<node18+/bin>:/opt/homebrew/bin:$HOME/tizen-sdk/tools:$HOME/tizen-sdk/tools/ide/bin:$HOME/tizen-sdk/tools/tizen-core:$PATH"
```

Tizen skill CLIs (example):

`$HOME/.claude/plugins/cache/tizen-platform/tizen-sdk-skills/*/lib/cli/{remote-device,project-manager,sdb-helper}-cli.js`

## Certs

- Profile name example: `AppleTvHome`
- Distributor **public** must include TV **DUID**
- Passwords: `~/.config/tizen/*.pwd` — `set -a; source …; set +a` — never print

## Deploy pattern

1. `remote-device connect <IP>`
2. `build --project … --build-type Debug --sign-profile AppleTvHome`
3. reconnect
4. `TIZEN_RDS_ENABLED=0 install --package …/Debug/AppleTvHome.wgt --device-serial <IP>:26101 --run`

Bump widget `version` each owner-facing install.

## config.xml essentials

```xml
<tizen:setting background-support="enable" …/>
<tizen:metadata key="http://samsung.com/tv/metadata/prelaunch.support" value="true"/>
<tizen:metadata key="http://samsung.com/tv/metadata/multitasking.support" value="true"/>
<tizen:app-control>
  <tizen:src name="index.html" reload="disable"/>
  <tizen:operation name="http://samsung.com/appcontrol/operation/eden_resume"/>
</tizen:app-control>
```

Privileges typically: `application.launch`, `application.info`, `tv.inputdevice`, `internet`, `system` (for SystemInfo network).

## Calendar URL

- Accept `webcal://` → fetch as `https://`
- Add host to CSP `connect-src`
- Parse ICS (fold lines, DATE vs date-time, TZID local)

## Weather

- Open-Meteo forecast + air-quality (no API key)
- CSP allow `api.open-meteo.com` and `air-quality-api.open-meteo.com`

## Capability flags that block deep diagnostics

- `rootonoff_support: disabled`
- `intershell_support: disabled`
- `appcmd_support: disabled`

Use in-app `getAppsInfo` / Settings ads audit instead of `pkgcmd -l`.
