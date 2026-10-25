(function (global) {
  "use strict";

  var ACTIONS = 2;
  var focusIndex = 0;
  var settingsApp = null;

  function $(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    var el = $(id);
    if (el) {
      el.textContent = text;
    }
  }

  function findSettingsApp(apps) {
    var i;
    var app;
    var re = /airplay|air.?play|smart.?view|screen.?mirroring|apple.?tv/i;
    for (i = 0; i < (apps || []).length; i += 1) {
      app = apps[i];
      if (re.test(app.name || "") || re.test(app.id || "")) {
        return app;
      }
    }
    re = /setting|cài đặt|cai dat/i;
    for (i = 0; i < (apps || []).length; i += 1) {
      app = apps[i];
      if (re.test(app.name || "") || re.test(app.id || "")) {
        return app;
      }
    }
    return null;
  }

  function applyName(name) {
    setText("ap-name", name || "Chưa rõ");
  }

  function probeName() {
    applyName("Samsung TV");
    if (typeof webapis !== "undefined" && webapis.productinfo) {
      try {
        applyName(webapis.productinfo.getRealModel() || webapis.productinfo.getModel());
      } catch (e) {
        /* optional */
      }
    }
    if (typeof tizen !== "undefined" && tizen.systeminfo) {
      try {
        tizen.systeminfo.getPropertyValue(
          "BUILD",
          function (build) {
            if (build && (build.model || build.manufacturer)) {
              applyName((build.manufacturer ? build.manufacturer + " " : "") + (build.model || ""));
            }
          },
          function () {
            /* optional */
          }
        );
      } catch (e2) {
        /* optional */
      }
    }
  }

  function renderFocus() {
    var buttons = document.querySelectorAll(".ap-action");
    Array.prototype.forEach.call(buttons, function (btn, index) {
      btn.className = "ap-action" + (index === focusIndex ? " is-focus" : "");
    });
  }

  function probe() {
    probeName();
    setText("ap-mirror", "Có — AirPlay 2 sẵn trên TV Samsung (chiếu màn hình và loa)");
    setText(
      "ap-others",
      "App Tizen không nghe mDNS như iPhone. Xem máy khác trong Control Center → Screen Mirroring."
    );
    setText("ap-server", settingsApp ? "Mở " + settingsApp.name : "Mở Cài đặt AirPlay trên TV (nếu có)");
    renderFocus();
  }

  function open() {
    focusIndex = 0;
    $("airplay").hidden = false;
    probe();
  }

  function close() {
    $("airplay").hidden = true;
  }

  function isOpen() {
    return $("airplay") && !$("airplay").hidden;
  }

  function move(dy) {
    focusIndex = (focusIndex + dy + ACTIONS) % ACTIONS;
    renderFocus();
  }

  function setFocus(index) {
    focusIndex = index;
    renderFocus();
  }

  function activate(launchFn) {
    if (focusIndex === 1) {
      probe();
      return;
    }
    if (settingsApp && launchFn) {
      launchFn(settingsApp, settingsApp.name);
      return;
    }
    if (typeof launchFn === "function") {
      launchFn(null, "Cài đặt AirPlay");
    }
  }

  function setApps(apps) {
    settingsApp = findSettingsApp(apps);
  }

  global.AirPlayStatus = {
    ID: "__airplay_status",
    open: open,
    close: close,
    isOpen: isOpen,
    move: move,
    setFocus: setFocus,
    activate: activate,
    setApps: setApps,
    probe: probe,
  };
})(window);
