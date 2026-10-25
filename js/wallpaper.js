(function (global) {
  "use strict";

  var ROTATE_MS = 2 * 60 * 1000;
  var FADE_MS = 1400;
  var WALLPAPERS = [
    "images/wallpapers/wp01.jpg",
    "images/wallpapers/wp02.jpg",
    "images/wallpapers/wp03.jpg",
    "images/wallpapers/wp04.jpg",
    "images/wallpapers/wp05.jpg",
  ];

  var index = 0;
  var showingA = true;
  var timer = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function layers() {
    return { a: $("wallpaper-a"), b: $("wallpaper-b") };
  }

  function setBg(el, url) {
    if (!el) {
      return;
    }
    el.style.backgroundImage = 'url("' + url + '")';
  }

  function show(url, animate) {
    var pair = layers();
    var next = showingA ? pair.b : pair.a;
    var prev = showingA ? pair.a : pair.b;
    if (!next || !prev) {
      return;
    }
    setBg(next, url);
    if (!animate) {
      next.className = "wallpaper-layer is-on";
      prev.className = "wallpaper-layer";
      showingA = !showingA;
      return;
    }
    next.className = "wallpaper-layer is-on";
    prev.className = "wallpaper-layer";
    showingA = !showingA;
  }

  function next() {
    index = (index + 1) % WALLPAPERS.length;
    show(WALLPAPERS[index], true);
  }

  function start() {
    if (!WALLPAPERS.length || !$("wallpaper-a")) {
      return;
    }
    index = Math.floor(Math.random() * WALLPAPERS.length);
    show(WALLPAPERS[index], false);
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(next, ROTATE_MS);
  }

  global.WallpaperAddon = {
    start: start,
    next: next,
    list: WALLPAPERS.slice(),
  };
})(window);
