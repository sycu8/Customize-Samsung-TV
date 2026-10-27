(function (global) {
  "use strict";

  var LAT = 10.737;
  var LON = 106.722;
  var PLACE = "Quận 7, TP.HCM";
  var REFRESH_MS = 30 * 60 * 1000;
  var WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  var WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    LAT +
    "&longitude=" +
    LON +
    "&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,is_day" +
    "&hourly=temperature_2m,weather_code,is_day" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&forecast_days=7&timezone=Asia%2FHo_Chi_Minh";
  var AIR_URL =
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" +
    LAT +
    "&longitude=" +
    LON +
    "&current=pm2_5,pm10,us_aqi&timezone=Asia%2FHo_Chi_Minh";

  function $(id) {
    return document.getElementById(id);
  }

  function conditionFor(code, atNight) {
    if (atNight && (code === 0 || code === 1)) {
      return "Trời quang";
    }
    if (code === 0) {
      return "Nắng";
    }
    if (code === 1) {
      return "Nắng nhẹ";
    }
    if (code === 2) {
      return "Ít mây";
    }
    if (code === 3) {
      return "Nhiều mây";
    }
    if (code === 45 || code === 48) {
      return "Sương mù";
    }
    if (code >= 51 && code <= 57) {
      return "Mưa phùn";
    }
    if (code >= 61 && code <= 67) {
      return "Mưa";
    }
    if (code >= 80 && code <= 82) {
      return "Mưa rào";
    }
    if (code >= 95) {
      return "Giông";
    }
    return "Trời ổn";
  }

  function dustLabel(pm25) {
    if (pm25 <= 12) {
      return { text: "Tốt", color: "#30d158" };
    }
    if (pm25 <= 35) {
      return { text: "Trung bình", color: "#ffd60a" };
    }
    if (pm25 <= 55) {
      return { text: "Kém", color: "#ff9f0a" };
    }
    return { text: "Xấu", color: "#ff453a" };
  }

  function getJson(url, done) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.timeout = 12000;
    req.onreadystatechange = function () {
      if (req.readyState !== 4) {
        return;
      }
      if (req.status >= 200 && req.status < 300) {
        try {
          done(null, JSON.parse(req.responseText));
          return;
        } catch (e) {
          done(e);
          return;
        }
      }
      done(new Error("weather " + req.status));
    };
    req.ontimeout = function () {
      done(new Error("timeout"));
    };
    req.onerror = function () {
      done(new Error("network"));
    };
    req.send();
  }

  function hourLabel(iso) {
    var date = new Date(iso);
    var h = date.getHours();
    return (h < 10 ? "0" : "") + h + "h";
  }

  function vietnamDayKey(date) {
    var formatted;
    var shifted;
    var y;
    var m;
    var d;
    try {
      formatted = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
      if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
        return formatted;
      }
    } catch (e) {
      /* use a fixed Vietnam offset below */
    }
    shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    y = shifted.getUTCFullYear();
    m = shifted.getUTCMonth() + 1;
    d = shifted.getUTCDate();
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }

  function nextHours(hourly) {
    var now = Date.now() - 30 * 60 * 1000;
    var out = [];
    var i;
    if (!hourly || !hourly.time) {
      return out;
    }
    for (i = 0; i < hourly.time.length && out.length < 5; i += 1) {
      if (new Date(hourly.time[i]).getTime() >= now) {
        out.push({
          time: hourly.time[i],
          temp: Math.round(hourly.temperature_2m[i]),
          code: hourly.weather_code[i],
          atNight: hourly.is_day ? hourly.is_day[i] === 0 : false,
        });
      }
    }
    return out;
  }

  function nextDays(daily) {
    var out = [];
    var i;
    var date;
    var todayKey = vietnamDayKey(new Date());
    if (!daily || !daily.time) {
      return out;
    }
    for (i = 0; i < daily.time.length; i += 1) {
      if (todayKey && daily.time[i] <= todayKey) {
        continue;
      }
      if (out.length >= 5) {
        break;
      }
      date = new Date(daily.time[i] + "T12:00:00");
      out.push({
        label: WEEKDAYS[date.getDay()],
        date: date.getDate() + "/" + (date.getMonth() + 1),
        max: Math.round(daily.temperature_2m_max[i]),
        min: Math.round(daily.temperature_2m_min[i]),
        code: daily.weather_code[i],
      });
    }
    return out;
  }

  function renderNow(weather, air) {
    var current = weather.current || {};
    var temp = Math.round(current.temperature_2m);
    var humidity = Math.round(current.relative_humidity_2m);
    var pm = air && air.current ? air.current.pm2_5 : null;
    var dust = pm == null ? { text: "--", color: "#d0d0d0" } : dustLabel(pm);
    $("weather-place").textContent = PLACE;
    $("weather-temp").textContent = temp + "°";
    $("weather-sky").textContent = conditionFor(current.weather_code, current.is_day === 0);
    $("weather-humidity").textContent = "Ẩm " + humidity + "%";
    $("weather-dust").textContent =
      "Bụi " + (pm == null ? "--" : Math.round(pm)) + " · " + dust.text;
    $("weather-dust").style.color = dust.color;
  }

  function renderHours(weather) {
    var list = $("weather-hours");
    var hours = nextHours(weather.hourly);
    list.innerHTML = "";
    if (!hours.length) {
      list.innerHTML = '<div class="side-empty">Chưa có dữ liệu</div>';
      return;
    }
    hours.forEach(function (hour) {
      var row = document.createElement("div");
      var time = document.createElement("span");
      var temp = document.createElement("strong");
      row.className = "wx-row";
      time.className = "wx-time";
      time.textContent = hourLabel(hour.time);
      temp.className = "wx-temp";
      temp.textContent = hour.temp + "°  " + conditionFor(hour.code, hour.atNight);
      row.appendChild(time);
      row.appendChild(temp);
      list.appendChild(row);
    });
  }

  function renderDays(weather) {
    var list = $("weather-days");
    var days = nextDays(weather.daily);
    list.innerHTML = "";
    if (!days.length) {
      list.innerHTML = '<div class="side-empty">Chưa có dữ liệu</div>';
      return;
    }
    days.forEach(function (day) {
      var row = document.createElement("div");
      var label = document.createElement("span");
      var temp = document.createElement("strong");
      row.className = "wx-row";
      label.className = "wx-time";
      label.textContent = day.label;
      temp.className = "wx-temp";
      temp.textContent = day.max + "°/" + day.min + "°  " + conditionFor(day.code);
      row.appendChild(label);
      row.appendChild(temp);
      list.appendChild(row);
    });
  }

  function load() {
    getJson(WEATHER_URL, function (err, weather) {
      if (err || !weather) {
        $("weather-sky").textContent = "Chưa lấy được thời tiết";
        return;
      }
      getJson(AIR_URL, function (airErr, air) {
        renderNow(weather, airErr ? null : air);
        renderHours(weather);
        renderDays(weather);
      });
    });
  }

  function start() {
    load();
    setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        load();
      }
    });
  }

  global.WeatherAddon = { start: start, refresh: load };
})(window);
