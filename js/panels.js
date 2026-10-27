(function (global) {
  "use strict";

  var STORAGE_HOURS = "ath.showHours";
  var APP_VERSION = "0.8.19";
  var AD_RE =
    /(^|[.\-_ ])(ad|ads|advert|advertis|promo|promotion|recommend|samsungads|mdcl|acr|ambient|commerce|campaign|banner|sponsored|interest.?based|viewing.?info|smart.?hub|smarthub|home.?ad|tvplus|free.?ad)([.\-_ ]|$)/i;
  var kind = "";
  var focusIndex = 0;
  var actions = [];
  var tryLaunchNetwork = null;
  var appCatalog = [];

  function $(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    var el = $(id);
    if (el) {
      el.textContent = text;
    }
  }

  function readHoursPref() {
    try {
      return localStorage.getItem(STORAGE_HOURS) !== "0";
    } catch (e) {
      return true;
    }
  }

  function writeHoursPref(on) {
    try {
      localStorage.setItem(STORAGE_HOURS, on ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
  }

  function applyHoursPref() {
    var left = $("side-left");
    var right = $("side-right");
    var cal = $("cal-panel");
    var show = readHoursPref();
    if (left) {
      left.style.display = show ? "" : "none";
    }
    if (right) {
      right.style.display = show ? "" : "none";
    }
    if (cal) {
      cal.style.display = show ? "" : "none";
    }
  }

  function getProp(id, ok, fail) {
    if (typeof tizen === "undefined" || !tizen.systeminfo || !tizen.systeminfo.getPropertyValue) {
      fail();
      return;
    }
    try {
      tizen.systeminfo.getPropertyValue(id, ok, fail);
    } catch (e) {
      fail();
    }
  }

  function networkLabel(type) {
    var map = {
      NONE: "Không có mạng",
      WIFI: "Wi-Fi",
      ETHERNET: "Ethernet",
      CELLULAR: "Di động",
      UNKNOWN: "Không rõ",
    };
    return map[type] || type || "Không rõ";
  }

  function statusLabel(status) {
    if (!status) {
      return "Không rõ";
    }
    var s = String(status).toUpperCase();
    if (s === "ON" || s === "CONNECTED" || s === "AVAILABLE") {
      return "Đã kết nối";
    }
    if (s === "OFF" || s === "DISCONNECTED" || s === "UNAVAILABLE") {
      return "Chưa kết nối";
    }
    return status;
  }

  function probeDevice(done) {
    var info = {
      model: "Samsung TV",
      maker: "Samsung",
      build: "",
      display: "",
      locale: navigator.language || "vi",
    };
    var pending = 3;
    function finish() {
      pending -= 1;
      if (pending <= 0) {
        done(info);
      }
    }
    if (typeof webapis !== "undefined" && webapis.productinfo) {
      try {
        info.model = webapis.productinfo.getRealModel() || webapis.productinfo.getModel() || info.model;
      } catch (e) {
        /* optional */
      }
    }
    getProp(
      "BUILD",
      function (build) {
        if (build) {
          info.maker = build.manufacturer || info.maker;
          info.model = build.model || info.model;
          info.build = build.buildVersion || build.buildId || "";
        }
        finish();
      },
      finish
    );
    getProp(
      "DISPLAY",
      function (display) {
        if (display && display.resolutionWidth) {
          info.display = display.resolutionWidth + "×" + display.resolutionHeight;
        }
        finish();
      },
      finish
    );
    getProp(
      "LOCALE",
      function (locale) {
        if (locale && locale.language) {
          info.locale = locale.language;
        }
        finish();
      },
      finish
    );
  }

  function probeNetwork(done) {
    var info = {
      type: "Đang kiểm tra",
      wifi: "Đang kiểm tra",
      wifiDetail: "",
      ethernet: "Đang kiểm tra",
      ethernetDetail: "",
      note: "App không được phép đổi Wi-Fi/Ethernet trên TV Samsung. Để chọn mạng, dùng nút Settings trên remote → Kết nối / Network.",
    };
    var pending = 3;
    function finish() {
      pending -= 1;
      if (pending <= 0) {
        done(info);
      }
    }
    getProp(
      "NETWORK",
      function (net) {
        info.type = networkLabel(net && net.networkType);
        finish();
      },
      function () {
        info.type = navigator.onLine ? "Có Internet (chi tiết hạn chế)" : "Không có mạng";
        finish();
      }
    );
    getProp(
      "WIFI_NETWORK",
      function (wifi) {
        var status = wifi && (wifi.status || wifi.connectionStatus);
        var ssid = wifi && wifi.ssid ? wifi.ssid : "";
        var ip = wifi && wifi.ipAddress ? wifi.ipAddress : "";
        var signal = wifi && (wifi.signalStrength != null ? wifi.signalStrength : "");
        info.wifi = statusLabel(status);
        info.wifiDetail = [ssid ? "SSID " + ssid : "", ip ? "IP " + ip : "", signal !== "" ? "Tín hiệu " + signal : ""]
          .filter(Boolean)
          .join(" · ");
        finish();
      },
      function () {
        info.wifi = "Không đọc được (API hạn chế)";
        info.wifiDetail = "";
        finish();
      }
    );
    getProp(
      "ETHERNET_NETWORK",
      function (eth) {
        var status = eth && eth.status;
        var cable = eth && eth.cable;
        var ip = eth && eth.ipAddress ? eth.ipAddress : "";
        info.ethernet = statusLabel(status);
        info.ethernetDetail = [cable ? "Cáp " + cable : "", ip ? "IP " + ip : ""].filter(Boolean).join(" · ");
        finish();
      },
      function () {
        info.ethernet = "Không đọc được (API hạn chế)";
        info.ethernetDetail = "";
        finish();
      }
    );
  }

  function renderFocus() {
    var buttons = document.querySelectorAll("#panel .panel-action");
    Array.prototype.forEach.call(buttons, function (btn, index) {
      btn.className = "panel-action" + (index === focusIndex ? " is-focus" : "");
    });
  }

  function adsSuspects() {
    var out = [];
    var i;
    var app;
    var blob;
    for (i = 0; i < appCatalog.length; i += 1) {
      app = appCatalog[i];
      blob = (app.name || "") + " " + (app.id || "");
      if (AD_RE.test(blob)) {
        out.push(app);
      }
    }
    return out;
  }

  function fillSettings(info) {
    var suspects = adsSuspects();
    var adsHtml;
    var i;
    setText("panel-kicker", "Cấu hình trong app");
    setText("panel-title", "Cài đặt");
    if (!suspects.length) {
      adsHtml =
        "Không thấy app/sideload tên liên quan quảng cáo trong danh sách API (" +
        appCatalog.length +
        " mục). Quảng cáo Smart Hub của Samsung thường nằm trong hệ thống, app thường không đọc/gỡ được.";
    } else {
      adsHtml = "Có " + suspects.length + " mục tên nghi liên quan quảng cáo/đề xuất:";
      for (i = 0; i < suspects.length && i < 8; i += 1) {
        adsHtml +=
          "<span class=\"panel-sub\">• " +
          escapeHtml((suspects[i].name || "?") + " — " + (suspects[i].id || "")) +
          "</span>";
      }
      if (suspects.length > 8) {
        adsHtml += "<span class=\"panel-sub\">… và " + (suspects.length - 8) + " mục khác</span>";
      }
    }
    $("panel-rows").innerHTML =
      '<div class="panel-row"><span class="panel-label">Model TV</span><strong class="panel-value">' +
      escapeHtml(info.maker + " " + info.model) +
      "</strong></div>" +
      '<div class="panel-row"><span class="panel-label">Màn hình</span><strong class="panel-value">' +
      escapeHtml(info.display || "1920×1080") +
      "</strong></div>" +
      '<div class="panel-row"><span class="panel-label">Phiên bản Home</span><strong class="panel-value">' +
      APP_VERSION +
      "</strong></div>" +
      '<div class="panel-row"><span class="panel-label">Ngôn ngữ hệ thống</span><strong class="panel-value">' +
      escapeHtml(info.locale) +
      "</strong></div>" +
      '<div class="panel-row"><span class="panel-label">Cột thời tiết & lịch</span><strong class="panel-value" id="panel-hours-state">' +
      (readHoursPref() ? "Bật" : "Tắt") +
      "</strong></div>" +
      '<div class="panel-row"><span class="panel-label">Kiểm tra quảng cáo (app nhìn thấy)</span><strong class="panel-value">' +
      adsHtml +
      "</strong></div>" +
      '<div class="panel-note">Khi bật TV: Settings → Tất cả cài đặt → Tính năng nâng cao → Tùy chọn màn hình bắt đầu. Tắt “Bắt đầu bằng Smart Hub”. Nếu có “Tự chạy app gần nhất” thì bật. Đang mở Home này, tắt TV bằng nút nguồn trên remote (đừng rút điện), rồi bật lại. Nút Home trên remote vẫn có thể mở Smart Hub.</div>';
    actions = [
      { id: "toggle-hours", label: readHoursPref() ? "Tắt cột thời tiết & lịch" : "Bật cột thời tiết & lịch" },
      { id: "refresh-weather", label: "Làm mới thời tiết" },
      { id: "ads-audit", label: "Xem lại kiểm tra quảng cáo" },
      { id: "close", label: "Đóng" },
    ];
    renderActions();
  }

  function fillInternet(info) {
    setText("panel-kicker", "Trạng thái mạng");
    setText("panel-title", "Internet");
    $("panel-rows").innerHTML =
      '<div class="panel-row"><span class="panel-label">Đường mạng đang dùng</span><strong class="panel-value">' +
      escapeHtml(info.type) +
      "</strong></div>" +
      '<div class="panel-row"><span class="panel-label">Wi-Fi</span><strong class="panel-value">' +
      escapeHtml(info.wifi) +
      (info.wifiDetail ? '<span class="panel-sub">' + escapeHtml(info.wifiDetail) + "</span>" : "") +
      "</strong></div>" +
      '<div class="panel-row"><span class="panel-label">Ethernet</span><strong class="panel-value">' +
      escapeHtml(info.ethernet) +
      (info.ethernetDetail ? '<span class="panel-sub">' + escapeHtml(info.ethernetDetail) + "</span>" : "") +
      "</strong></div>" +
      '<div class="panel-note">' +
      escapeHtml(info.note) +
      "</div>";
    actions = [
      { id: "refresh-net", label: "Làm mới" },
      { id: "try-system", label: "Thử mở Cài đặt mạng TV" },
      { id: "close", label: "Đóng" },
    ];
    renderActions();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderActions() {
    var wrap = $("panel-actions");
    wrap.innerHTML = "";
    actions.forEach(function (action) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "panel-action";
      btn.setAttribute("data-action", action.id);
      btn.textContent = action.label;
      wrap.appendChild(btn);
    });
    if (focusIndex >= actions.length) {
      focusIndex = Math.max(0, actions.length - 1);
    }
    renderFocus();
  }

  function open(which) {
    kind = which;
    focusIndex = 0;
    $("panel").hidden = false;
    if (which === "settings") {
      setText("panel-kicker", "Đang tải…");
      setText("panel-title", "Cài đặt");
      $("panel-rows").innerHTML = "";
      $("panel-actions").innerHTML = "";
      probeDevice(fillSettings);
      return;
    }
    setText("panel-kicker", "Đang tải…");
    setText("panel-title", "Internet");
    $("panel-rows").innerHTML = "";
    $("panel-actions").innerHTML = "";
    probeNetwork(fillInternet);
  }

  function close() {
    kind = "";
    $("panel").hidden = true;
  }

  function isOpen() {
    return $("panel") && !$("panel").hidden;
  }

  function move(dy) {
    if (!actions.length) {
      return;
    }
    focusIndex = (focusIndex + dy + actions.length) % actions.length;
    renderFocus();
  }

  function setFocus(index) {
    focusIndex = index;
    renderFocus();
  }

  function activate() {
    var action = actions[focusIndex];
    if (!action) {
      return;
    }
    if (action.id === "close") {
      close();
      return;
    }
    if (action.id === "toggle-hours") {
      writeHoursPref(!readHoursPref());
      applyHoursPref();
      probeDevice(fillSettings);
      return;
    }
    if (action.id === "refresh-weather") {
      if (global.WeatherAddon && WeatherAddon.refresh) {
        WeatherAddon.refresh();
      }
      close();
      return;
    }
    if (action.id === "ads-audit") {
      probeDevice(fillSettings);
      return;
    }
    if (action.id === "refresh-net") {
      probeNetwork(fillInternet);
      return;
    }
    if (action.id === "try-system") {
      if (typeof tryLaunchNetwork === "function") {
        tryLaunchNetwork();
      }
      return;
    }
  }

  function setTryLaunch(fn) {
    tryLaunchNetwork = fn;
  }

  function setAppCatalog(list) {
    appCatalog = list || [];
  }

  applyHoursPref();

  global.HomePanels = {
    open: open,
    close: close,
    isOpen: isOpen,
    move: move,
    setFocus: setFocus,
    activate: activate,
    setTryLaunch: setTryLaunch,
    setAppCatalog: setAppCatalog,
    applyHoursPref: applyHoursPref,
  };
})(window);
