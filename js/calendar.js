(function (global) {
  "use strict";

  var CAL_URL =
    "https://p134-caldav.icloud.com/published/2/MTcwMDA2NjI4NjE3MDAwNoU6H_rzVhTid__3_QeMhzanHBE_qhbu7br9orldTMoo";
  var REFRESH_MS = 30 * 60 * 1000;
  var WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  function $(id) {
    return document.getElementById(id);
  }

  function unfold(ics) {
    return String(ics || "").replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
  }

  function unescapeText(value) {
    return String(value || "")
      .replace(/\\n/gi, " ")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\")
      .trim();
  }

  function parseDateValue(params, value) {
    var isDate = /VALUE=DATE/i.test(params || "") || (/^\d{8}$/.test(value) && value.indexOf("T") < 0);
    var y;
    var m;
    var d;
    var hh;
    var mm;
    var ss;
    if (!value) {
      return null;
    }
    if (isDate) {
      y = Number(value.slice(0, 4));
      m = Number(value.slice(4, 6)) - 1;
      d = Number(value.slice(6, 8));
      return { date: new Date(y, m, d, 0, 0, 0, 0), allDay: true };
    }
    y = Number(value.slice(0, 4));
    m = Number(value.slice(4, 6)) - 1;
    d = Number(value.slice(6, 8));
    hh = Number(value.slice(9, 11) || 0);
    mm = Number(value.slice(11, 13) || 0);
    ss = Number(value.slice(13, 15) || 0);
    if (/Z$/i.test(value)) {
      return { date: new Date(Date.UTC(y, m, d, hh, mm, ss)), allDay: false };
    }
    return { date: new Date(y, m, d, hh, mm, ss), allDay: false };
  }

  function field(block, name) {
    var re = new RegExp("^" + name + "(;([^:\\n]*))?:([^\\n]*)$", "im");
    var match = re.exec(block);
    if (!match) {
      return null;
    }
    return { params: match[2] || "", value: match[3] || "" };
  }

  function parseEvents(ics) {
    var text = unfold(ics);
    var out = [];
    var parts = text.split("BEGIN:VEVENT");
    var i;
    var block;
    var summary;
    var start;
    var end;
    var startParsed;
    var endParsed;
    for (i = 1; i < parts.length; i += 1) {
      block = parts[i].split("END:VEVENT")[0] || "";
      if (/^STATUS:CANCELLED/im.test(block)) {
        continue;
      }
      summary = field(block, "SUMMARY");
      start = field(block, "DTSTART");
      end = field(block, "DTEND");
      if (!summary || !start) {
        continue;
      }
      startParsed = parseDateValue(start.params, start.value);
      if (!startParsed) {
        continue;
      }
      endParsed = end ? parseDateValue(end.params, end.value) : null;
      if (!endParsed) {
        endParsed = {
          date: new Date(startParsed.date.getTime() + (startParsed.allDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)),
          allDay: startParsed.allDay,
        };
      }
      out.push({
        title: unescapeText(summary.value),
        start: startParsed.date,
        end: endParsed.date,
        allDay: startParsed.allDay,
      });
    }
    return out;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function overlapsDay(event, day) {
    var dayStart = startOfDay(day).getTime();
    var dayEnd = dayStart + 24 * 60 * 60 * 1000;
    var start = event.start.getTime();
    var end = event.end.getTime();
    if (event.allDay) {
      return start < dayEnd && end > dayStart;
    }
    return start < dayEnd && end > dayStart;
  }

  function timeLabel(event) {
    var h;
    var m;
    if (event.allDay) {
      return "Cả ngày";
    }
    h = event.start.getHours();
    m = event.start.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function dayLabel(day, today) {
    if (startOfDay(day).getTime() === startOfDay(today).getTime()) {
      return "Hôm nay";
    }
    return WEEKDAYS[day.getDay()] + " " + day.getDate() + "/" + (day.getMonth() + 1);
  }

  function upcoming(events, days) {
    var today = startOfDay(new Date());
    var seen = {};
    var items = [];
    var i;
    var day;
    var j;
    var event;
    var key;
    for (i = 0; i < days; i += 1) {
      day = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      for (j = 0; j < events.length; j += 1) {
        event = events[j];
        if (!overlapsDay(event, day)) {
          continue;
        }
        key = event.title + "|" + event.start.getTime() + "|" + day.getTime();
        if (seen[key]) {
          continue;
        }
        seen[key] = true;
        items.push({
          day: day,
          event: event,
          sort: event.allDay ? day.getTime() : event.start.getTime(),
        });
      }
    }
    items.sort(function (a, b) {
      return a.sort - b.sort;
    });
    return items.slice(0, 4);
  }

  function render(items) {
    var list = $("cal-list");
    var today = new Date();
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = '<div class="side-empty">7 ngày tới trống lịch</div>';
      return;
    }
    items.forEach(function (item) {
      var row = document.createElement("div");
      var when = document.createElement("span");
      var title = document.createElement("strong");
      row.className = "cal-row";
      when.className = "cal-when";
      when.textContent = dayLabel(item.day, today) + " · " + timeLabel(item.event);
      title.className = "cal-title";
      title.textContent = item.event.title;
      row.appendChild(when);
      row.appendChild(title);
      list.appendChild(row);
    });
  }

  function getText(url, done) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.timeout = 20000;
    try {
      req.setRequestHeader("Accept", "text/calendar, text/plain, */*");
    } catch (e) {
      /* optional */
    }
    req.onreadystatechange = function () {
      if (req.readyState !== 4) {
        return;
      }
      if (req.status >= 200 && req.status < 300 && req.responseText) {
        done(null, req.responseText);
        return;
      }
      done(new Error("calendar " + req.status));
    };
    req.ontimeout = function () {
      done(new Error("timeout"));
    };
    req.onerror = function () {
      done(new Error("network"));
    };
    req.send();
  }

  function load() {
    var list = $("cal-list");
    if (!list) {
      return;
    }
    list.innerHTML = '<div class="side-empty">Đang tải lịch…</div>';
    getText(CAL_URL, function (err, ics) {
      if (err || !ics) {
        list.innerHTML = '<div class="side-empty">Chưa lấy được lịch iCloud</div>';
        return;
      }
      try {
        render(upcoming(parseEvents(ics), 7));
      } catch (e) {
        list.innerHTML = '<div class="side-empty">Lịch lỗi định dạng</div>';
      }
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

  global.CalendarAddon = { start: start, refresh: load };
})(window);
