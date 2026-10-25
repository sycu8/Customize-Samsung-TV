(function () {
  "use strict";

  var SELF_ID = "uTr82d3TO7.AppleTvHome";
  var LP_COLUMNS = 4;
  var SYSTEM_RE = /(ime|input.?method|screensaver|screen.?saver|smart.?hub|factory|pwservice|bixby|voice.?assistant|companion|crash|dlog|notification|standby|idle|taskmgr|pkgmgr|tvinput|hdmi|setupwizard|firstscreen|easysetup|remotemanagement|ota|firmware|debug|logviewer|testmode|engineering|widget|avsync|softap|wifidirect|usbmanager|bluetooth.?service|volume|karaoke.?service|kids.?home.?service)/i;
  var DOCK = [
    { key: "vieon", label: "VieON", match: /vieon/i, color: "#00c000", logo: "images/vieon.png" },
    { key: "vtvgo", label: "VTVgo", match: /vtv\s*go|vtvgo/i, color: "#c8102e", logo: "images/vtvgo.png" },
    { key: "netflix", label: "Netflix", match: /netflix/i, color: "#000000", logo: "images/netflix.png" },
    { key: "youtube", label: "YouTube", match: /youtube|you\s*tube/i, color: "#f1f1f1", logo: "images/youtube.png" },
    { key: "appletv", label: "Apple TV", match: null, color: "#000000", logo: "images/appletv.jpg" },
  ];
  var TRAY = [
    { key: "settings", label: "Cài đặt", hint: "Cấu hình trong Home" },
    { key: "internet", label: "Internet", hint: "Wi-Fi / Ethernet" },
  ];
  var NETWORK_LAUNCH = {
    ids: [
      "com.samsung.tv.coba.setting.networksettings",
      "org.tizen.NetworkSetting-Tizen",
      "org.tizen.networksetting",
      "com.samsung.tv.coba.setting",
    ],
    ops: [
      "http://tizen.org/appcontrol/operation/setting/wifi",
      "http://tizen.org/appcontrol/operation/setting/network",
      "http://tizen.org/appcontrol/operation/setting",
    ],
  };

  var state = {
    apps: [],
    allApps: [],
    dockApps: [],
    launchpadIds: [],
    focus: { zone: "dock", index: 0 },
    launchpadOpen: false,
    toastTimer: 0,
    launchedOther: false,
    launchedAppId: "",
    launchAt: 0,
    lastResume: 0,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function locale() {
    return navigator.language || "vi";
  }

  function greetingFor(now) {
    var hour = now.getHours();
    if (hour < 12) {
      return "Chào buổi sáng";
    }
    if (hour < 18) {
      return "Chào buổi chiều";
    }
    return "Chào buổi tối";
  }

  function tickClock() {
    var now = new Date();
    var lang = locale();
    $("greeting").textContent = greetingFor(now);
    try {
      $("clock").textContent = new Intl.DateTimeFormat(lang, {
        hour: "numeric",
        minute: "2-digit",
      }).format(now);
      $("date").textContent = new Intl.DateTimeFormat(lang, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(now);
    } catch (e) {
      $("clock").textContent = now.getHours() + ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
      $("date").textContent = now.toDateString();
    }
  }

  function letterFor(name) {
    var ch = (name || "?").replace(/^\s+/, "").charAt(0);
    return ch ? ch.toUpperCase() : "?";
  }

  function colorForId(id) {
    var colors = ["#0a84ff", "#30d158", "#ff375f", "#ffd60a", "#bf5af2", "#64d2ff"];
    var sum = 0;
    var i;
    for (i = 0; i < id.length; i += 1) {
      sum += id.charCodeAt(i);
    }
    return colors[sum % colors.length];
  }

  function normalizeIconPath(path) {
    if (!path) {
      return "";
    }
    var src = String(path);
    if (
      src.indexOf("file://") === 0 ||
      src.indexOf("http://") === 0 ||
      src.indexOf("https://") === 0 ||
      src.indexOf("data:") === 0 ||
      src.indexOf("widget://") === 0
    ) {
      return src;
    }
    if (src.charAt(0) !== "/") {
      src = "/" + src;
    }
    return "file://" + src;
  }

  function dockSpecForApp(app) {
    var i;
    if (!app) {
      return null;
    }
    for (i = 0; i < DOCK.length; i += 1) {
      if (DOCK[i].logo && DOCK[i].match && (DOCK[i].match.test(app.name || "") || DOCK[i].match.test(app.id || ""))) {
        return DOCK[i];
      }
    }
    return null;
  }

  function isUserApp(app) {
    var name;
    var id;
    if (!app || !app.id || app.id === SELF_ID || app.show === false) {
      return false;
    }
    name = app.name || "";
    id = app.id || "";
    if (name.length < 2 || /^tizen$/i.test(name)) {
      return false;
    }
    if (dockSpecForApp(app)) {
      return true;
    }
    if (/coba\.setting|homesetting|networksetting|volume-setting/i.test(id)) {
      return false;
    }
    if (/(browser|internet|trình duyệt)/i.test(name) || /(browser|internet)/i.test(id)) {
      return true;
    }
    if (SYSTEM_RE.test(name) || SYSTEM_RE.test(id)) {
      return false;
    }
    if (/^org\.tizen\./i.test(id) && !/(youtube|netflix|browser|internet|vieon|vtv)/i.test(name + id)) {
      return false;
    }
    if (/^com\.samsung\.(tv\.)?(service|sys|core|fw|update)/i.test(id)) {
      return false;
    }
    return true;
  }

  function appById(id) {
    var i;
    for (i = 0; i < state.apps.length; i += 1) {
      if (state.apps[i].id === id) {
        return state.apps[i];
      }
    }
    return null;
  }

  function findApp(spec) {
    var i;
    var app;
    if (!spec.match) {
      return null;
    }
    for (i = 0; i < state.apps.length; i += 1) {
      app = state.apps[i];
      if (spec.match.test(app.name || "") || spec.match.test(app.id || "")) {
        return app;
      }
    }
    return null;
  }

  function toast(message) {
    var el = $("toast");
    el.textContent = message;
    el.hidden = false;
    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }
    state.toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 2200);
  }

  function preferDefaultHome() {
    try {
      localStorage.setItem("ath.defaultHome", "1");
    } catch (e) {
      /* ignore */
    }
    return true;
  }

  function clearLaunched() {
    state.launchedOther = false;
    state.launchedAppId = "";
  }

  function resumeSelf() {
    if (typeof tizen === "undefined" || !tizen.application) {
      return;
    }
    if (!document.hidden) {
      return;
    }
    if (Date.now() - state.lastResume < 1200) {
      return;
    }
    state.lastResume = Date.now();
    try {
      tizen.application.launch(SELF_ID);
    } catch (e) {
      /* ignore */
    }
  }

  function onLaunchedAppClosed() {
    /* Samsung often fires reply when opening clips — do NOT steal focus here. */
  }

  function launchById(appId, name) {
    tizen.application.launch(
      appId,
      function () {
        toast("Đang mở " + name);
      },
      function () {
        clearLaunched();
        toast("Không mở được " + name + ".");
      }
    );
  }

  function launchControl(operation, appId, name, onFail) {
    try {
      tizen.application.launchAppControl(
        new tizen.ApplicationControl(operation),
        appId || null,
        function () {
          toast("Đang mở " + name);
        },
        onFail,
        {
          onsuccess: onLaunchedAppClosed,
          onfailure: onLaunchedAppClosed,
        }
      );
    } catch (e) {
      onFail();
    }
  }

  function launchChain(steps, name) {
    if (typeof tizen === "undefined" || !tizen.application) {
      toast("Mở " + name);
      return;
    }
    state.launchedOther = true;
    state.launchedAppId = (steps[0] && steps[0].id) || name;
    state.launchAt = Date.now();
    function next(i) {
      var step;
      if (i >= steps.length) {
        clearLaunched();
        toast("Không mở được " + name + ". Dùng nút Settings trên remote.");
        return;
      }
      step = steps[i];
      if (step.type === "id") {
        launchControl("http://tizen.org/appcontrol/operation/view", step.id, name, function () {
          try {
            tizen.application.launch(
              step.id,
              function () {
                toast("Đang mở " + name);
              },
              function () {
                next(i + 1);
              }
            );
          } catch (e) {
            next(i + 1);
          }
        });
        return;
      }
      if (step.type === "op" && tizen.application.launchAppControl) {
        launchControl(step.op, null, name, function () {
          next(i + 1);
        });
        return;
      }
      next(i + 1);
    }
    next(0);
  }

  function tryOpenNetworkSettings() {
    var steps = [];
    var seen = {};
    var i;
    var id;
    for (i = 0; i < NETWORK_LAUNCH.ids.length; i += 1) {
      id = NETWORK_LAUNCH.ids[i];
      if (!seen[id]) {
        steps.push({ type: "id", id: id });
        seen[id] = true;
      }
    }
    for (i = 0; i < NETWORK_LAUNCH.ops.length; i += 1) {
      steps.push({ type: "op", op: NETWORK_LAUNCH.ops[i] });
    }
    toast("Đang thử mở Cài đặt mạng TV…");
    launchChain(steps, "Cài đặt mạng");
  }

  function activateTray(index) {
    var item = TRAY[index];
    if (!item || !window.HomePanels) {
      return;
    }
    HomePanels.open(item.key);
  }

  function trayIcon(kind) {
    if (kind === "settings") {
      return '<svg class="tray-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96c-.5-.4-1.04-.71-1.63-.94l-.36-2.54A.5.5 0 0014.1 2h-4.2a.5.5 0 00-.49.42l-.36 2.54c-.59.23-1.13.54-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.51 8.48a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.63 14.16a.5.5 0 00-.12.64l1.92 3.32c.14.23.41.32.64.22l2.39-.96c.5.4 1.04.71 1.63.94l.36 2.54c.05.24.25.42.49.42h4.2c.24 0 .44-.18.49-.42l.36-2.54c.59-.23 1.13-.54 1.63-.94l2.39.96c.23.1.5.01.64-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/></svg>';
    }
    return '<svg class="tray-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 18a2 2 0 100-4 2 2 0 000 4zm-5.66-5.66l1.41 1.41a6 6 0 018.5 0l1.41-1.41a8 8 0 00-11.32 0zM3.51 9.51l1.42 1.42a10 10 0 0114.14 0l1.42-1.42a12 12 0 00-16.98 0z"/></svg>';
  }

  function launchApp(app, fallbackName) {
    if (app && app.builtin === "airplay") {
      if (window.AirPlayStatus) {
        AirPlayStatus.open();
      }
      return;
    }
    if (!app) {
      toast((fallbackName || "Ứng dụng") + " chưa cài trên TV.");
      return;
    }
    if (typeof tizen === "undefined" || !tizen.application) {
      toast("Mở " + app.name);
      return;
    }
    state.launchedOther = true;
    state.launchedAppId = app.id;
    state.launchAt = Date.now();
    if (typeof tizen.ApplicationControl === "function" && tizen.application.launchAppControl) {
      try {
        tizen.application.launchAppControl(
          new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/view"),
          app.id,
          function () {
            toast("Đang mở " + app.name);
          },
          function () {
            launchById(app.id, app.name);
          },
          {
            onsuccess: onLaunchedAppClosed,
            onfailure: onLaunchedAppClosed,
          }
        );
        return;
      } catch (e) {
        launchById(app.id, app.name);
        return;
      }
    }
    launchById(app.id, app.name);
  }

  function makeAppsMark() {
    var mark = document.createElement("div");
    var dots = document.createElement("div");
    var i;
    mark.className = "mark-apps";
    dots.className = "apps-dots";
    for (i = 0; i < 9; i += 1) {
      dots.appendChild(document.createElement("i"));
    }
    mark.appendChild(dots);
    return mark;
  }

  function renderDock() {
    var dock = $("dock");
    dock.innerHTML = "";
    DOCK.forEach(function (spec, index) {
      var tile = document.createElement("button");
      var face = document.createElement("div");
      var caption = document.createElement("span");
      tile.type = "button";
      tile.className = "tile" + (state.focus.zone === "dock" && state.focus.index === index && !state.launchpadOpen ? " is-focus" : "");
      tile.setAttribute("data-zone", "dock");
      tile.setAttribute("data-index", String(index));
      face.className = "tile-face";
      face.style.background = spec.color;
      if (spec.logo) {
        var img = document.createElement("img");
        img.className = "tile-logo";
        img.src = spec.logo;
        img.alt = spec.label;
        face.appendChild(img);
      } else {
        face.appendChild(makeAppsMark());
      }
      caption.className = "tile-caption";
      caption.textContent = spec.label;
      tile.appendChild(face);
      tile.appendChild(caption);
      dock.appendChild(tile);
    });
  }

  function renderTray() {
    var tray = $("tray");
    tray.innerHTML = "";
    TRAY.forEach(function (item, index) {
      var btn = document.createElement("button");
      var face = document.createElement("div");
      var copy = document.createElement("div");
      var label = document.createElement("span");
      var hint = document.createElement("span");
      btn.type = "button";
      btn.className = "tray-btn" + (state.focus.zone === "tray" && state.focus.index === index ? " is-focus" : "");
      btn.setAttribute("data-zone", "tray");
      btn.setAttribute("data-index", String(index));
      face.className = "tray-face";
      face.innerHTML = trayIcon(item.key);
      copy.className = "tray-copy";
      label.className = "tray-label";
      label.textContent = item.label;
      hint.className = "tray-hint";
      hint.textContent = item.hint;
      copy.appendChild(label);
      copy.appendChild(hint);
      face.appendChild(copy);
      btn.appendChild(face);
      tray.appendChild(btn);
    });
  }

  function renderLaunchpad() {
    var wrap = $("launchpad");
    var grid = $("launchpad-grid");
    wrap.hidden = !state.launchpadOpen;
    grid.innerHTML = "";
    if (!state.launchpadOpen) {
      return;
    }
    state.launchpadIds.forEach(function (id, index) {
      var app = appById(id);
      var spec = dockSpecForApp(app);
      var item = document.createElement("button");
      var icon = document.createElement("div");
      var name = document.createElement("span");
      var fallback = document.createElement("div");
      item.type = "button";
      item.className = "lp-app" + (state.focus.zone === "launchpad" && state.focus.index === index ? " is-focus" : "");
      item.setAttribute("data-index", String(index));
      icon.className = "lp-icon";
      icon.style.background = app && app.builtin === "airplay" ? "#5ac8fa" : spec ? spec.color : colorForId(id);
      fallback.className = "lp-fallback";
      fallback.textContent = letterFor(app ? app.name : "?");
      icon.appendChild(fallback);
      if (spec && spec.logo) {
        var brand = document.createElement("img");
        brand.alt = "";
        brand.src = spec.logo;
        brand.onload = function () {
          fallback.style.display = "none";
        };
        icon.appendChild(brand);
      } else if (app && app.iconPath) {
        var img = document.createElement("img");
        img.alt = "";
        img.src = normalizeIconPath(app.iconPath);
        img.onload = function () {
          fallback.style.display = "none";
          icon.style.background = "#f2f2f7";
        };
        img.onerror = function () {
          if (img.parentNode) {
            img.parentNode.removeChild(img);
          }
        };
        icon.appendChild(img);
      }
      name.className = "lp-name";
      name.textContent = app ? app.name : "";
      item.appendChild(icon);
      item.appendChild(name);
      grid.appendChild(item);
    });
    var row = Math.floor(state.focus.index / LP_COLUMNS);
    var offset = Math.max(0, row - 3) * 220;
    grid.style.transform = "translateY(" + -offset + "px)";
  }

  function render() {
    renderDock();
    renderTray();
    renderLaunchpad();
  }

  function openLaunchpad() {
    if (!state.launchpadIds.length) {
      toast("Chưa có ứng dụng nào.");
      return;
    }
    state.launchpadOpen = true;
    state.focus.zone = "launchpad";
    state.focus.index = 0;
    render();
  }

  function closeLaunchpad() {
    state.launchpadOpen = false;
    state.focus.zone = "dock";
    state.focus.index = DOCK.length - 1;
    render();
  }

  function activateDock(index) {
    var spec = DOCK[index];
    if (!spec) {
      return;
    }
    if (spec.key === "appletv") {
      openLaunchpad();
      return;
    }
    launchApp(state.dockApps[index], spec.label);
  }

  function moveFocus(dx, dy) {
    if (state.launchpadOpen) {
      var count = state.launchpadIds.length;
      var cols = LP_COLUMNS;
      var rows = Math.ceil(count / cols);
      var row = Math.floor(state.focus.index / cols);
      var col = state.focus.index % cols;
      col = Math.max(0, Math.min(cols - 1, col + dx));
      row = Math.max(0, Math.min(rows - 1, row + dy));
      state.focus.index = Math.min(count - 1, row * cols + col);
      render();
      return;
    }
    if (state.focus.zone === "tray") {
      if (dx !== 0) {
        state.focus.index = (state.focus.index + dx + TRAY.length) % TRAY.length;
        render();
        return;
      }
      if (dy < 0) {
        state.focus.zone = "dock";
        state.focus.index = state.focus.index === 0 ? 1 : 3;
        render();
      }
      return;
    }
    if (dx !== 0) {
      state.focus.index = (state.focus.index + dx + DOCK.length) % DOCK.length;
      render();
      return;
    }
    if (dy > 0) {
      state.focus.zone = "tray";
      state.focus.index = state.focus.index < 3 ? 0 : 1;
      render();
    }
  }

  function isHomeApp(id) {
    return /(smarthub|smart.?hub|tv\.home|homescreen|org\.tizen\.plus|samsung\.tv\.home|launcher|firstscreen)/i.test(
      id || ""
    );
  }

  function isForegroundContext(ctx) {
    return !!(ctx && (ctx.isForeground || ctx.foreground || ctx.isTop || ctx.state === "FOREGROUND"));
  }

  function foregroundAppId(contexts) {
    var i;
    var ctx;
    for (i = 0; i < contexts.length; i += 1) {
      ctx = contexts[i];
      if (isForegroundContext(ctx)) {
        return ctx.appId || "";
      }
    }
    return "";
  }

  function shouldStayInBackground(contexts) {
    var fgId = foregroundAppId(contexts || []);
    /* Always yield to any content app we launched (YouTube, Netflix, …). */
    if (state.launchedOther) {
      if (fgId && isHomeApp(fgId)) {
        return false;
      }
      if (fgId && fgId === SELF_ID) {
        return false;
      }
      return true;
    }
    /* Hidden without our launch: only reclaim Smart Hub, never steal unknown apps. */
    if (fgId && isHomeApp(fgId)) {
      return false;
    }
    return true;
  }

  function tickHome() {
    if (!preferDefaultHome()) {
      return;
    }
    if (typeof tizen === "undefined" || !tizen.application) {
      return;
    }
    if (!document.hidden) {
      return;
    }
    if (!tizen.application.getAppsContext) {
      return;
    }
    tizen.application.getAppsContext(
      function (contexts) {
        if (!shouldStayInBackground(contexts || [])) {
          clearLaunched();
          resumeSelf();
        }
      },
      function () {
        /* Never steal focus when context API fails (was kicking YouTube). */
      }
    );
  }

  function onKeyDown(event) {
    var key = event.keyCode;
    if (window.HomePanels && HomePanels.isOpen()) {
      if (key === TV_KEYS.LEFT || key === TV_KEYS.UP) {
        HomePanels.move(-1);
      } else if (key === TV_KEYS.RIGHT || key === TV_KEYS.DOWN) {
        HomePanels.move(1);
      } else if (key === TV_KEYS.ENTER) {
        HomePanels.activate();
      } else if (key === TV_KEYS.BACK || key === TV_KEYS.EXIT || key === TV_KEYS.HOME || key === TV_KEYS.HOME_SAMSUNG) {
        HomePanels.close();
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (window.AirPlayStatus && AirPlayStatus.isOpen()) {
      if (key === TV_KEYS.LEFT || key === TV_KEYS.UP) {
        AirPlayStatus.move(-1);
      } else if (key === TV_KEYS.RIGHT || key === TV_KEYS.DOWN) {
        AirPlayStatus.move(1);
      } else if (key === TV_KEYS.ENTER) {
        AirPlayStatus.activate(launchApp);
      } else if (key === TV_KEYS.BACK || key === TV_KEYS.EXIT || key === TV_KEYS.HOME || key === TV_KEYS.HOME_SAMSUNG) {
        AirPlayStatus.close();
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (key === TV_KEYS.LEFT) {
      moveFocus(-1, 0);
    } else if (key === TV_KEYS.RIGHT) {
      moveFocus(1, 0);
    } else if (key === TV_KEYS.UP) {
      moveFocus(0, -1);
    } else if (key === TV_KEYS.DOWN) {
      moveFocus(0, 1);
    } else if (key === TV_KEYS.ENTER) {
      if (state.launchpadOpen) {
        launchApp(appById(state.launchpadIds[state.focus.index]));
      } else if (state.focus.zone === "tray") {
        activateTray(state.focus.index);
      } else {
        activateDock(state.focus.index);
      }
    } else if (key === TV_KEYS.HOME || key === TV_KEYS.HOME_SAMSUNG) {
      if (state.launchpadOpen) {
        closeLaunchpad();
      } else {
        state.focus.zone = "dock";
        state.focus.index = 0;
        render();
      }
    } else if (key === TV_KEYS.BACK || key === TV_KEYS.EXIT) {
      if (state.launchpadOpen) {
        closeLaunchpad();
      } else if (state.focus.zone === "tray") {
        state.focus.zone = "dock";
        state.focus.index = 0;
        render();
      } else {
        state.focus.index = 0;
        render();
      }
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function mockApps() {
    return [
      { id: "mock.vieon", name: "VieON", show: true, iconPath: "" },
      { id: "mock.vtvgo", name: "VTVgo", show: true, iconPath: "" },
      { id: "mock.netflix", name: "Netflix", show: true, iconPath: "" },
      { id: "mock.youtube", name: "YouTube", show: true, iconPath: "" },
      { id: "org.tizen.browser", name: "Internet", show: true, iconPath: "" },
    ];
  }

  function ingestApps(list) {
    state.allApps = list || [];
    if (window.HomePanels && HomePanels.setAppCatalog) {
      HomePanels.setAppCatalog(list || []);
    }
    if (window.AirPlayStatus) {
      AirPlayStatus.setApps(list || []);
    }
    var apps = (list || []).filter(isUserApp);
    if (!apps.length) {
      apps = mockApps();
    }
    if (window.AirPlayStatus) {
      apps = [
        {
          id: AirPlayStatus.ID,
          name: "AirPlay",
          show: true,
          iconPath: "",
          builtin: "airplay",
        },
      ].concat(apps);
    }
    state.apps = apps;
    state.dockApps = DOCK.map(function (spec) {
      return findApp(spec);
    });
    state.launchpadIds = apps.map(function (app) {
      return app.id;
    });
    render();
  }

  function registerKeys() {
    if (typeof tizen === "undefined" || !tizen.tvinputdevice) {
      return;
    }
    try {
      tizen.tvinputdevice.registerKey("Exit");
    } catch (e) {
      /* optional */
    }
    try {
      tizen.tvinputdevice.registerKey("Home");
    } catch (e2) {
      /* Home may stay reserved */
    }
  }

  function discoverApps() {
    if (typeof tizen === "undefined" || !tizen.application || !tizen.application.getAppsInfo) {
      ingestApps(mockApps());
      return;
    }
    tizen.application.getAppsInfo(
      function (apps) {
        ingestApps(
          (apps || []).map(function (app) {
            return {
              id: app.id,
              name: app.name || app.id,
              iconPath: app.iconPath || "",
              show: app.show !== false,
            };
          })
        );
      },
      function () {
        ingestApps(mockApps());
        toast("Không lấy được danh sách ứng dụng.");
      }
    );
  }

  function bindPointer() {
    document.addEventListener("click", function (event) {
      var panelBtn = event.target.closest(".panel-action");
      var ap = event.target.closest(".ap-action");
      var trayBtn = event.target.closest(".tray-btn");
      var tile = event.target.closest(".tile");
      var lp = event.target.closest(".lp-app");
      if (panelBtn && window.HomePanels) {
        var panelActions = document.querySelectorAll("#panel .panel-action");
        var pi;
        for (pi = 0; pi < panelActions.length; pi += 1) {
          if (panelActions[pi] === panelBtn) {
            HomePanels.setFocus(pi);
            break;
          }
        }
        HomePanels.activate();
        return;
      }
      if (ap && window.AirPlayStatus) {
        var actions = document.querySelectorAll(".ap-action");
        var i;
        for (i = 0; i < actions.length; i += 1) {
          if (actions[i] === ap) {
            AirPlayStatus.setFocus(i);
            break;
          }
        }
        AirPlayStatus.activate(launchApp);
        return;
      }
      if (lp) {
        state.focus.zone = "launchpad";
        state.focus.index = Number(lp.getAttribute("data-index"));
        render();
        launchApp(appById(state.launchpadIds[state.focus.index]));
        return;
      }
      if (trayBtn) {
        state.focus.zone = "tray";
        state.focus.index = Number(trayBtn.getAttribute("data-index"));
        render();
        activateTray(state.focus.index);
        return;
      }
      if (tile) {
        state.focus.zone = "dock";
        state.focus.index = Number(tile.getAttribute("data-index"));
        render();
        activateDock(state.focus.index);
      }
    });
  }

  function init() {
    preferDefaultHome();
    tickClock();
    setInterval(tickClock, 1000);
    registerKeys();
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        clearLaunched();
        tickClock();
        return;
      }
      setTimeout(tickHome, 2000);
    });
    setInterval(tickHome, 2500);
    bindPointer();
    if (window.HomePanels) {
      HomePanels.setTryLaunch(tryOpenNetworkSettings);
      HomePanels.applyHoursPref();
    }
    discoverApps();
    if (window.WallpaperAddon) {
      WallpaperAddon.start();
    }
    if (window.WeatherAddon) {
      WeatherAddon.start();
    }
    if (window.CalendarAddon) {
      CalendarAddon.start();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
