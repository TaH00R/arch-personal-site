(function () {
  "use strict";

  const body = document.body;
  const ROOT = body.dataset.root || "";
  const DATA = window.TAHOOR_DATA || {};
  const HOME = body.dataset.cwd === "~";
  const isMobile = () => window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;

  const LS = {
    get(k, d) {
      try {
        const v = localStorage.getItem("sidh." + k);
        return v === null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try { localStorage.setItem("sidh." + k, JSON.stringify(v)); } catch (e) {}
    },
  };

  const TERM_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<rect x="4" y="7" width="40" height="34" rx="5" fill="#181825" stroke="#45475a"></rect>' +
    '<rect x="4" y="7" width="40" height="8" rx="5" fill="#313244"></rect>' +
    '<circle cx="10" cy="11" r="1.5" fill="#f38ba8"></circle><circle cx="15" cy="11" r="1.5" fill="#f9e2af"></circle><circle cx="20" cy="11" r="1.5" fill="#a6e3a1"></circle>' +
    '<path d="M11 24l6 4-6 4" fill="none" stroke="#a6e3a1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>' +
    '<line x1="21" y1="33" x2="32" y2="33" stroke="#cba6f7" stroke-width="2.5" stroke-linecap="round"></line>' +
    "</svg>";

  const FOLDER_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M5 11h13l4 4h21a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z" fill="#89b4fa" stroke="#6c7086"></path>' +
    '<path d="M3 19h42v20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V19z" fill="#74a0f0"></path>' +
    "</svg>";

  const TRACKS = DATA.music || [];

  const DOCS = {
    "projects.md": {
      heading: "# things i've worked on",
      items: (DATA.projects || []).map((p) => [p.name, p.description]),
    },
    "skills.md": {
      heading: "# a collection of my skills",
      items: (DATA.skills || []).map((s) => [s.name, s.description]),
    },
  };

  const DOC_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M11 4h18l8 8v32a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#313244" stroke="#6c7086"></path>' +
    '<path d="M29 4l8 8h-8z" fill="#585b70"></path>' +
    '<line x1="15" y1="24" x2="33" y2="24" stroke="#89b4fa" stroke-width="2"></line>' +
    '<line x1="15" y1="30" x2="33" y2="30" stroke="#6c7086" stroke-width="2"></line>' +
    '<line x1="15" y1="36" x2="27" y2="36" stroke="#6c7086" stroke-width="2"></line>' +
    "</svg>";

  const SOCIALS_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M5 11h13l4 4h21a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z" fill="#f9e2af" stroke="#6c7086"></path>' +
    '<path d="M3 19h42v20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V19z" fill="#f0d68a"></path>' +
    "</svg>";

  const SOCIALS = DATA.socials || [];

  const PLAYLIST = TRACKS.map((t) => Object.assign({}, t, { src: ROOT + t.src, art: ROOT + t.art }));

  let zTop = 10;
  let activeId = null;
  const wins = {};
  let termWin = null;
  let taskbar, taskItems;
  let surf;
  let MUSIC = [];

  function ensureSurf() {
    if (!surf) surf = document.querySelector(".desktop-surface");
    return surf;
  }

  function savePlayer(w) {
    if (!w || !w.audio) return;
    LS.set("player", { open: true, idx: w.idx, time: w.audio.currentTime || 0, paused: w.audio.paused, min: !!w.min });
  }

  function clampPos(el, x, y) {
    const w = el.offsetWidth || 360;
    const h = el.offsetHeight || 60;
    return [
      Math.max(0, Math.min(x, Math.max(0, surf.clientWidth - w))),
      Math.max(0, Math.min(y, Math.max(0, surf.clientHeight - h))),
    ];
  }

  function place(el, saved, defFn) {
    const p = saved || defFn();
    if (p.w) el.style.width = Math.min(p.w, surf.clientWidth) + "px";
    if (p.h) el.style.height = Math.min(p.h, surf.clientHeight) + "px";
    const [x, y] = clampPos(el, p.x, p.y);
    el.style.left = x + "px";
    el.style.top = y + "px";
  }

  function saveGeom(w) {
    if (!w.geomKey) return;
    const g = {
      x: parseFloat(w.el.style.left) || 0,
      y: parseFloat(w.el.style.top) || 0,
    };
    if (w.el.style.width) g.w = parseFloat(w.el.style.width);
    if (w.el.style.height) g.h = parseFloat(w.el.style.height);
    LS.set(w.geomKey, g);
  }

  function setActive(id) {
    activeId = id;
    Object.values(wins).forEach((w) => {
      if (w.tb) w.tb.classList.toggle("active", w.id === id && !w.min && w.el.style.display !== "none");
    });
  }

  function focusWin(w) {
    w.el.style.zIndex = ++zTop;
    setActive(w.id);
  }

  function draggable(w) {
    const handle = w.el.querySelector(".term-titlebar, .win-bar");
    if (!handle) return;
    handle.style.touchAction = "none";
    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".term-dots, .win-dots")) return;
      if (w.max) return;
      e.preventDefault();
      focusWin(w);
      const sr = surf.getBoundingClientRect();
      const r = w.el.getBoundingClientRect();
      const offX = e.clientX - r.left, offY = e.clientY - r.top;
      handle.setPointerCapture(e.pointerId);
      w.el.classList.add("is-dragging");
      const move = (ev) => {
        const [x, y] = clampPos(w.el, ev.clientX - sr.left - offX, ev.clientY - sr.top - offY);
        w.el.style.left = x + "px";
        w.el.style.top = y + "px";
      };
      const up = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        w.el.classList.remove("is-dragging");
        saveGeom(w);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }

  const RZ_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  const MIN_W = 280, MIN_H = 160;

  function makeResizable(w) {
    RZ_DIRS.forEach((dir) => {
      const h = document.createElement("div");
      h.className = "rz rz-" + dir;
      h.style.touchAction = "none";
      w.el.appendChild(h);
      h.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || w.max) return;
        e.preventDefault();
        e.stopPropagation();
        focusWin(w);
        const r = w.el.getBoundingClientRect();
        const sr = surf.getBoundingClientRect();
        const start = {
          px: e.clientX, py: e.clientY,
          x: r.left - sr.left, y: r.top - sr.top,
          w: r.width, h: r.height,
        };
        h.setPointerCapture(e.pointerId);
        w.el.classList.add("is-resizing");
        const move = (ev) => {
          const dx = ev.clientX - start.px, dy = ev.clientY - start.py;
          let x = start.x, y = start.y, wd = start.w, ht = start.h;
          if (dir.includes("e")) wd = start.w + dx;
          if (dir.includes("s")) ht = start.h + dy;
          if (dir.includes("w")) { wd = start.w - dx; x = start.x + dx; }
          if (dir.includes("n")) { ht = start.h - dy; y = start.y + dy; }
          if (wd < MIN_W) { if (dir.includes("w")) x -= MIN_W - wd; wd = MIN_W; }
          if (ht < MIN_H) { if (dir.includes("n")) y -= MIN_H - ht; ht = MIN_H; }
          if (x < 0) { wd += x; x = 0; }
          if (y < 0) { ht += y; y = 0; }
          wd = Math.min(wd, surf.clientWidth - x);
          ht = Math.min(ht, surf.clientHeight - y);
          w.el.style.left = x + "px";
          w.el.style.top = y + "px";
          w.el.style.width = wd + "px";
          w.el.style.height = ht + "px";
        };
        const up = () => {
          h.removeEventListener("pointermove", move);
          h.removeEventListener("pointerup", up);
          w.el.classList.remove("is-resizing");
          saveGeom(w);
        };
        h.addEventListener("pointermove", move);
        h.addEventListener("pointerup", up);
      });
    });
  }

  function minimize(w) {
    w.el.style.display = "none";
    w.min = true;
    if (w.persistState) w.persistState();
    setActive(null);
    if (w.tb) w.tb.classList.add("minimized");
  }

  function restore(w) {
    w.el.style.display = "";
    w.min = false;
    if (w.persistState) w.persistState();
    if (w.tb) w.tb.classList.remove("minimized");
    focusWin(w);
  }

  function toggleMax(w) {
    w.max = !w.max;
    w.el.classList.toggle("maximized", w.max);
    if (w.persistState) w.persistState();
    focusWin(w);
  }

  function closeWin(w) {
    if (w.kind === "terminal") {
      w.el.style.display = "none";
      w.min = false;
      if (w.persistState) w.persistState();
      if (w.tb) w.tb.classList.add("minimized");
      setActive(null);
    } else {
      if (w.audio) w.audio.pause();
      w.el.remove();
      if (w.tb) w.tb.remove();
      delete wins[w.id];
      if (w.kind === "player") { LS.set("player", { open: false }); showNowPlaying(false); }
      LS.set("iv.open", Object.keys(wins).filter((k) => wins[k].kind === "image"));
    }
  }

  function wireControls(w) {
    const bar = w.el.querySelector(".term-titlebar, .win-bar");
    const red = bar.querySelector(".dot-red");
    const yellow = bar.querySelector(".dot-yellow");
    const green = bar.querySelector(".dot-green");
    if (red) red.addEventListener("click", (e) => { e.stopPropagation(); closeWin(w); });
    if (yellow) yellow.addEventListener("click", (e) => { e.stopPropagation(); minimize(w); });
    if (green) green.addEventListener("click", (e) => { e.stopPropagation(); toggleMax(w); });
    bar.querySelector(".term-dots, .win-dots").classList.add("win-controls");
    bar.addEventListener("dblclick", (e) => {
      if (e.target.closest(".term-dots, .win-dots")) return;
      toggleMax(w);
    });
    w.el.addEventListener("pointerdown", () => focusWin(w));
    makeResizable(w);
  }

  function addTaskItem(w) {
    const b = document.createElement("button");
    b.className = "tb-item";
    b.innerHTML =
      (w.kind === "terminal" ? '<span class="tb-ico">' + TERM_SVG + "</span>" : '<span class="tb-dot"></span>') +
      '<span class="tb-title">' + w.title + "</span>";
    b.addEventListener("click", () => {
      if (w.el.style.display === "none" || w.min) restore(w);
      else if (activeId === w.id) minimize(w);
      else focusWin(w);
    });
    taskItems.appendChild(b);
    w.tb = b;
  }

  function registerTerminal() {
    const el = document.querySelector(".terminal");
    if (!el) return null;
    const w = { id: "terminal", el, kind: "terminal", title: el.dataset.wtitle || "alacritty ~ zsh", min: false, max: false };
    w.geomKey = "win.terminal";
    w.persistState = () => LS.set("term.state", { min: w.min, max: w.max, closed: w.el.style.display === "none" });
    place(el, LS.get("win.terminal", null), () => ({ x: (surf.clientWidth - el.offsetWidth) / 2, y: 16 }));
    wireControls(w);
    draggable(w);
    addTaskItem(w);
    wins[w.id] = w;
    const st = LS.get("term.state", null);
    if (st) {
      if (st.max) { w.max = true; el.classList.add("maximized"); }
      if (st.closed || st.min) { el.style.display = "none"; w.min = !!st.min; if (w.tb) w.tb.classList.add("minimized"); }
    }
    focusWin(w);
    return w;
  }

  function openViewer(p) {
    if (wins[p.id]) { restore(wins[p.id]); return; }
    const el = document.createElement("section");
    el.className = "window imgviewer";
    el.innerHTML =
      '<div class="win-bar">' +
      '<span class="win-dots"><i class="dot-red"></i><i class="dot-yellow"></i><i class="dot-green"></i></span>' +
      '<span class="term-title"><b>' + p.file + "</b> — gwenview</span><span></span></div>" +
      '<div class="iv-body"><img src="' + ROOT + p.src + '" alt="' + p.file + '" draggable="false"></div>';
    surf.appendChild(el);
    const w = { id: p.id, el, kind: "image", title: p.file, min: false, max: false };
    w.geomKey = "win.iv." + p.id;
    const n = Object.values(wins).filter((x) => x.kind === "image").length;
    place(el, LS.get("win.iv." + p.id, null), () => ({ x: surf.clientWidth / 2 - 200 + n * 30, y: 40 + n * 30 }));
    wireControls(w);
    draggable(w);
    addTaskItem(w);
    wins[p.id] = w;
    focusWin(w);
    LS.set("iv.open", Object.keys(wins).filter((k) => wins[k].kind === "image"));
  }

  function makeIcon(layer, p) {
    const el = document.createElement("div");
    el.className = "dz-icon";
    el.innerHTML =
      '<div class="dz-thumb"><img src="' + ROOT + p.src + '" alt="' + p.file + '" draggable="false"></div>' +
      '<span class="dz-label">' + p.file + "</span>";
    layer.appendChild(el);
    place(el, LS.get("icon." + p.id, null), () => ({ x: p.def.xf * surf.clientWidth, y: p.def.yf * surf.clientHeight }));
    iconDrag(el, (x, y) => LS.set("icon." + p.id, { x, y }));
    el.addEventListener("dblclick", () => openViewer(p));
    return el;
  }

  function terminalIcon(layer) {
    const el = document.createElement("div");
    el.className = "dz-icon dz-app";
    el.innerHTML = '<div class="dz-appicon">' + TERM_SVG + '</div><span class="dz-label">alacritty</span>';
    layer.appendChild(el);
    place(el, LS.get("icon.terminal", null), () => ({ x: 0.9 * surf.clientWidth, y: 0.78 * surf.clientHeight }));
    iconDrag(el, (x, y) => LS.set("icon.terminal", { x, y }));
    el.addEventListener("dblclick", () => { if (termWin) restore(termWin); });
    return el;
  }

  function iconDrag(el, onEnd) {
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const sr = surf.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const offX = e.clientX - r.left, offY = e.clientY - r.top;
      let moved = false;
      el.setPointerCapture(e.pointerId);
      const move = (ev) => {
        moved = true;
        el.classList.add("is-dragging");
        const [x, y] = clampPos(el, ev.clientX - sr.left - offX, ev.clientY - sr.top - offY);
        el.style.left = x + "px";
        el.style.top = y + "px";
      };
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.classList.remove("is-dragging");
        if (moved) onEnd(parseFloat(el.style.left) || 0, parseFloat(el.style.top) || 0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
    });
  }

  function buildTaskbar() {
    taskbar = document.createElement("div");
    taskbar.className = "taskbar";
    taskbar.innerHTML = '<div class="tb-left"></div><div class="tb-items"></div>';
    body.appendChild(taskbar);
    taskItems = taskbar.querySelector(".tb-items");
    const launch = document.createElement("button");
    launch.className = "tb-launch";
    launch.title = "open terminal";
    launch.innerHTML = TERM_SVG;
    launch.addEventListener("click", () => { if (termWin) restore(termWin); });
    taskbar.querySelector(".tb-left").appendChild(launch);
  }

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    s = Math.floor(s);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  const PLAYER_HTML =
    '<div class="win-bar">' +
    '<span class="win-dots"><i class="dot-red"></i><i class="dot-yellow"></i><i class="dot-green"></i></span>' +
    '<span class="term-title"><b>Elisa</b> <span class="pl-winname"></span></span><span></span></div>' +
    '<div class="pl-body">' +
    '<img class="pl-art" alt="album art" draggable="false">' +
    '<div class="pl-title"></div><div class="pl-artist"></div><div class="pl-metaline"></div>' +
    '<input class="pl-seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="seek">' +
    '<div class="pl-times"><span class="pl-cur">0:00</span><span class="pl-total">0:00</span></div>' +
    '<div class="pl-controls">' +
    '<button class="pl-prev" aria-label="previous"><svg viewBox="0 0 24 24"><path d="M7 6h2v12H7z"/><path d="M20 6v12l-9-6z"/></svg></button>' +
    '<button class="pl-play" aria-label="play or pause"><svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="i-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button>' +
    '<button class="pl-next" aria-label="next"><svg viewBox="0 0 24 24"><path d="M15 6h2v12h-2z"/><path d="M4 6l9 6-9 6z"/></svg></button>' +
    "</div>" +
    '<audio class="pl-audio" preload="metadata"></audio></div>';

  let npEl = null;
  function initPanelNP() {
    const right = document.querySelector(".panel-right");
    if (!right || isMobile()) return;
    npEl = document.createElement("span");
    npEl.className = "panel-np";
    npEl.innerHTML = '<svg class="np-note" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg><span class="np-text"></span>';
    right.insertBefore(npEl, right.firstChild);
  }
  function setNowPlaying(t) {
    if (npEl) npEl.querySelector(".np-text").textContent = t.title + " — " + t.artist;
  }
  function showNowPlaying(on) {
    if (npEl) npEl.classList.toggle("show", on);
  }

  function loadTrack(w, idx, opts) {
    opts = opts || {};
    w.idx = (idx + PLAYLIST.length) % PLAYLIST.length;
    const t = PLAYLIST[w.idx];
    const el = w.el;
    el.querySelector(".pl-art").src = t.art;
    el.querySelector(".pl-title").textContent = t.title;
    el.querySelector(".pl-artist").textContent = t.artist + (t.album ? " — " + t.album : "");
    el.querySelector(".pl-metaline").textContent = (t.genre ? t.genre + " · " : "") + t.dur;
    el.querySelector(".pl-winname").textContent = "— " + t.file;
    w.audio.src = t.src;
    w.startAt = opts.time || 0;
    if (opts.autoplay !== false) w.audio.play().catch(() => {});
    MUSIC.forEach((m, i) => { if (m.el) m.el.classList.toggle("playing", i === w.idx); });
    setNowPlaying(t);
    savePlayer(w);
  }

  function wirePlayer(w) {
    const el = w.el, a = w.audio;
    const seek = el.querySelector(".pl-seek");
    const cur = el.querySelector(".pl-cur");
    const tot = el.querySelector(".pl-total");
    let lastSave = 0;
    el.querySelector(".pl-play").addEventListener("click", () => { if (a.paused) a.play(); else a.pause(); });
    el.querySelector(".pl-prev").addEventListener("click", () => loadTrack(w, w.idx - 1));
    el.querySelector(".pl-next").addEventListener("click", () => loadTrack(w, w.idx + 1));
    a.addEventListener("play", () => { el.classList.add("playing"); showNowPlaying(true); savePlayer(w); });
    a.addEventListener("pause", () => { el.classList.remove("playing"); showNowPlaying(false); savePlayer(w); });
    a.addEventListener("ended", () => loadTrack(w, w.idx + 1));
    a.addEventListener("loadedmetadata", () => {
      tot.textContent = fmt(a.duration);
      if (w.startAt) { try { a.currentTime = w.startAt; } catch (e) {} w.startAt = 0; }
    });
    a.addEventListener("timeupdate", () => {
      if (a.duration) { seek.value = (a.currentTime / a.duration) * 100; cur.textContent = fmt(a.currentTime); }
      const now = Date.now();
      if (now - lastSave > 2000) { lastSave = now; savePlayer(w); }
    });
    seek.addEventListener("input", () => { if (a.duration) a.currentTime = (seek.value / 100) * a.duration; });
  }

  function buildPlayer() {
    ensureSurf();
    const el = document.createElement("section");
    el.className = "window player";
    el.innerHTML = PLAYER_HTML;
    surf.appendChild(el);
    const w = { id: "player", el, kind: "player", title: "Elisa", min: false, max: false, audio: el.querySelector(".pl-audio"), idx: 0 };
    w.persistState = () => savePlayer(w);
    wirePlayer(w);
    if (!isMobile()) {
      w.geomKey = "win.player";
      place(el, LS.get("win.player", null), () => ({ x: surf.clientWidth / 2 - 170, y: 36 }));
      wireControls(w);
      draggable(w);
      addTaskItem(w);
    } else {
      const red = el.querySelector(".dot-red");
      if (red) red.addEventListener("click", () => { w.audio.pause(); el.remove(); delete wins.player; LS.set("player", { open: false }); showNowPlaying(false); });
    }
    wins.player = w;
    return w;
  }

  function openPlayer(idx) {
    let w = wins.player;
    if (!w) w = buildPlayer();
    else {
      w.el.style.display = "";
      w.min = false;
      if (w.tb) w.tb.classList.remove("minimized");
    }
    loadTrack(w, idx, { autoplay: true });
    if (!isMobile()) focusWin(w);
  }

  function restorePlayer() {
    const st = LS.get("player", null);
    if (!st || !st.open) return;
    if (!ensureSurf()) return;
    const w = buildPlayer();
    loadTrack(w, st.idx || 0, { autoplay: !st.paused, time: st.time || 0 });
    if (st.min && !isMobile()) minimize(w);
  }

  function sidhOpen(name) {
    if (!name || !ensureSurf()) return false;
    const n = name.replace(/\/$/, "");
    if (n === "music") { openMusicFolder(); return true; }
    if (n === "socials") { openSocials(); return true; }
    if (DOCS[n]) { openDoc(n); return true; }
    const ph = PHOTOS.find((p) => p.file === name);
    if (ph) { openViewer(ph); return true; }
    const ti = TRACKS.findIndex((t) => t.file === name);
    if (ti >= 0) { openPlayer(ti); return true; }
    return false;
  }
  window.sidhOpen = sidhOpen;

  function buildGrid(container) {
    MUSIC = TRACKS.map((t) => {
      const b = document.createElement("button");
      b.className = "fm-file";
      b.innerHTML =
        '<span class="fm-thumb"><img src="' + ROOT + t.art + '" alt="" loading="lazy"></span>' +
        '<span class="fm-name">' + t.file + "</span>";
      container.appendChild(b);
      return Object.assign({}, t, { el: b, src: ROOT + t.src, art: ROOT + t.art });
    });
    const ev = isMobile() ? "click" : "dblclick";
    MUSIC.forEach((m, i) => m.el.addEventListener(ev, () => openPlayer(i)));
  }

  function openMusicFolder() {
    ensureSurf();
    if (!surf) return;
    let w = wins.music;
    if (w) {
      w.el.style.display = "";
      w.min = false;
      if (w.tb) w.tb.classList.remove("minimized");
      focusWin(w);
      return;
    }
    const el = document.createElement("section");
    el.className = "window filemanager";
    el.innerHTML =
      '<div class="win-bar"><span class="win-dots"><i class="dot-red"></i><i class="dot-yellow"></i><i class="dot-green"></i></span>' +
      '<span class="term-title"><b>Dolphin</b> — /home/tahoor/music</span><span></span></div>' +
      '<div class="term-body fm-body"><div class="fm-toolbar"><span class="fm-path">home / tahoor / music</span>' +
      '<span class="fm-count">' + TRACKS.length + ' items · double-click to play</span></div><div class="fm-grid"></div></div>';
    surf.appendChild(el);
    buildGrid(el.querySelector(".fm-grid"));
    w = { id: "music", el, kind: "folder", title: "Dolphin — ~/music", min: false, max: false };
    w.geomKey = "win.music";
    place(el, LS.get("win.music", null), () => ({ x: surf.clientWidth / 2 - 300, y: 24 }));
    wireControls(w);
    draggable(w);
    addTaskItem(w);
    wins.music = w;
    focusWin(w);
  }

  function musicFolderIcon(layer) {
    const el = document.createElement("div");
    el.className = "dz-icon dz-app";
    el.innerHTML = '<div class="dz-appicon">' + FOLDER_SVG + '</div><span class="dz-label">music</span>';
    layer.appendChild(el);
    place(el, LS.get("icon.music", null), () => ({ x: 0.02 * surf.clientWidth, y: 0.63 * surf.clientHeight }));
    iconDrag(el, (x, y) => LS.set("icon.music", { x, y }));
    el.addEventListener("dblclick", openMusicFolder);
    return el;
  }

  function openDoc(name) {
    ensureSurf();
    if (!surf) return;
    const doc = DOCS[name];
    if (!doc) return;
    const id = "doc:" + name;
    if (wins[id]) {
      const w = wins[id];
      w.el.style.display = "";
      w.min = false;
      if (w.tb) w.tb.classList.remove("minimized");
      focusWin(w);
      return;
    }
    const rows = doc.items
      .map(([t, s]) => '<li class="row"><span class="dot" aria-hidden="true"></span><div><div class="row-title">' + t + '</div><div class="row-sub">' + s + "</div></div></li>")
      .join("");
    const el = document.createElement("section");
    el.className = "window docviewer";
    el.innerHTML =
      '<div class="win-bar"><span class="win-dots"><i class="dot-red"></i><i class="dot-yellow"></i><i class="dot-green"></i></span>' +
      '<span class="term-title"><b>kate</b> — ' + name + "</span><span></span></div>" +
      '<div class="term-body doc-body"><div class="doc-h">' + doc.heading + '</div><ul class="rows">' + rows + "</ul></div>";
    surf.appendChild(el);
    const off = name === "skills.md" ? 40 : 0;
    const w = { id: id, el, kind: "doc", title: "kate — " + name, min: false, max: false };
    w.geomKey = "win." + id;
    place(el, LS.get("win." + id, null), () => ({ x: surf.clientWidth / 2 - 250 + off, y: 26 + off }));
    wireControls(w);
    draggable(w);
    addTaskItem(w);
    wins[id] = w;
    focusWin(w);
  }

  function docIcon(layer, name, xf, yf) {
    const el = document.createElement("div");
    el.className = "dz-icon dz-app";
    el.innerHTML = '<div class="dz-appicon">' + DOC_SVG + '</div><span class="dz-label">' + name + "</span>";
    layer.appendChild(el);
    place(el, LS.get("icon." + name, null), () => ({ x: xf * surf.clientWidth, y: yf * surf.clientHeight }));
    iconDrag(el, (x, y) => LS.set("icon." + name, { x, y }));
    el.addEventListener("dblclick", () => openDoc(name));
    return el;
  }

  function openSocials() {
    ensureSurf();
    if (!surf) return;
    if (wins.socials) {
      const w = wins.socials;
      w.el.style.display = "";
      w.min = false;
      if (w.tb) w.tb.classList.remove("minimized");
      focusWin(w);
      return;
    }
    const items = SOCIALS
      .map((s) => '<a class="soc-item" href="' + s.url + '" target="_blank" rel="noopener"><span class="soc-ic"><i class="fa-brands ' + s.icon + '"></i></span><span class="soc-label">' + s.name + "</span></a>")
      .join("");
    const el = document.createElement("section");
    el.className = "window socialswin";
    el.innerHTML =
      '<div class="win-bar"><span class="win-dots"><i class="dot-red"></i><i class="dot-yellow"></i><i class="dot-green"></i></span>' +
      '<span class="term-title"><b>Dolphin</b> — /home/tahoor/socials</span><span></span></div>' +
      '<div class="term-body soc-body">' + items + "</div>";
    surf.appendChild(el);
    const w = { id: "socials", el, kind: "folder", title: "Dolphin — ~/socials", min: false, max: false };
    w.geomKey = "win.socials";
    place(el, LS.get("win.socials", null), () => ({ x: surf.clientWidth / 2 - 150, y: 40 }));
    wireControls(w);
    draggable(w);
    addTaskItem(w);
    wins.socials = w;
    focusWin(w);
  }

  function socialsIcon(layer) {
    const el = document.createElement("div");
    el.className = "dz-icon dz-app";
    el.innerHTML = '<div class="dz-appicon">' + SOCIALS_SVG + '</div><span class="dz-label">socials</span>';
    layer.appendChild(el);
    place(el, LS.get("icon.socials", null), () => ({ x: 0.02 * surf.clientWidth, y: 0.78 * surf.clientHeight }));
    iconDrag(el, (x, y) => LS.set("icon.socials", { x, y }));
    el.addEventListener("dblclick", openSocials);
    return el;
  }

  function initMusicMobile() {
    if (!(HOME && isMobile())) return;
    const main = document.querySelector("main");
    if (!main) return;
    const sec = document.createElement("section");
    sec.className = "mobile-music";
    sec.innerHTML = '<h2>~/music</h2><div class="fm-grid"></div>';
    main.appendChild(sec);
    buildGrid(sec.querySelector(".fm-grid"));
  }

  function initDesktop() {
    surf = document.querySelector(".desktop-surface");
    if (!surf) return;
    buildTaskbar();
    termWin = registerTerminal();
    if (HOME) {
      const layer = document.querySelector(".desktop-icons");
      if (layer) {
        terminalIcon(layer);
        musicFolderIcon(layer);
        socialsIcon(layer);
        docIcon(layer, "projects.md", 0.9, 0.48);
        docIcon(layer, "skills.md", 0.9, 0.63);
        PHOTOS.forEach((p) => makeIcon(layer, p));
      }
      LS.get("iv.open", []).forEach((id) => {
        const p = PHOTOS.find((x) => x.id === id);
        if (p) openViewer(p);
      });
    }
  }

  function keyOf(li) {
    return (li.textContent || "").replace(/^\s*\d+\s*/, "").trim();
  }
  function renumber(list) {
    Array.from(list.children).forEach((li, i) => {
      const n = li.querySelector(".ws-num");
      if (n) n.textContent = i + 1;
    });
  }
  function initReorder() {
    const list = document.querySelector(".workspaces");
    if (!list) return;
    const order = LS.get("ws.order", null);
    if (order) {
      order.forEach((k) => {
        const li = Array.from(list.children).find((x) => keyOf(x) === k);
        if (li) list.appendChild(li);
      });
    }
    renumber(list);
    if (isMobile()) return;
    Array.from(list.children).forEach((li) => {
      li.setAttribute("draggable", "true");
      const a = li.querySelector("a");
      if (a) a.setAttribute("draggable", "false");
      li.addEventListener("dragstart", (e) => {
        li.classList.add("ws-dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", keyOf(li)); } catch (_) {}
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("ws-dragging");
        LS.set("ws.order", Array.from(list.children).map(keyOf));
        renumber(list);
      });
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = list.querySelector(".ws-dragging");
        if (!dragging || dragging === li) return;
        const r = li.getBoundingClientRect();
        list.insertBefore(dragging, e.clientX - r.left < r.width / 2 ? li : li.nextSibling);
      });
    });
  }

  function tidyIcons() {
    Object.keys(localStorage).forEach((k) => { if (k.indexOf("sidh.icon.") === 0) localStorage.removeItem(k); });
    location.reload();
  }
  function resetLayout() {
    Object.keys(localStorage).forEach((k) => { if (k.indexOf("sidh.") === 0) localStorage.removeItem(k); });
    location.reload();
  }
  function aboutMachine() {
    ensureSurf();
    if (!surf) return;
    if (wins.about) { const w = wins.about; w.el.style.display = ""; w.min = false; if (w.tb) w.tb.classList.remove("minimized"); focusWin(w); return; }
    const info = [
      ["host", "TaHooR@arch"],
      ["os", "Arch Linux x86_64"],
      ["kernel", "Linux 6.x-arch1-1"],
      ["wm", "Hyprland · Wayland"],
      ["shell", "zsh"],
      ["terminal", "Alacritty"],
      ["editor", "Neovim"],
      ["cpu", "13th Gen Intel Core i5"],
      ["gpu", "NVIDIA GeForce RTX 4050 Laptop GPU"],
      ["focus", "Go · C++ · Flutter · Spring Boot · security"],
    ];
    const rows = info.map(([k, v]) => '<li class="row"><span class="dot" aria-hidden="true"></span><div><div class="row-title">' + k + '</div><div class="row-sub">' + v + "</div></div></li>").join("");
    const el = document.createElement("section");
    el.className = "window docviewer";
    el.innerHTML =
      '<div class="win-bar"><span class="win-dots"><i class="dot-red"></i><i class="dot-yellow"></i><i class="dot-green"></i></span>' +
      '<span class="term-title"><b>neofetch</b> — about this machine</span><span></span></div>' +
      '<div class="term-body doc-body"><div class="doc-h"># about this machine</div><ul class="rows">' + rows + "</ul></div>";
    surf.appendChild(el);
    const w = { id: "about", el, kind: "doc", title: "about this machine", min: false, max: false };
    w.geomKey = "win.about";
    place(el, LS.get("win.about", null), () => ({ x: surf.clientWidth / 2 - 230, y: 34 }));
    wireControls(w);
    draggable(w);
    addTaskItem(w);
    wins.about = w;
    focusWin(w);
  }

  function initContextMenu() {
    if (!ensureSurf()) return;
    let menu = null;
    function close() { if (menu) { menu.remove(); menu = null; } }
    surf.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".window") || e.target.closest(".dz-icon")) return;
      e.preventDefault();
      close();
      menu = document.createElement("div");
      menu.className = "ctx-menu";
      const items = [
        ["open terminal", () => termWin && restore(termWin)],
        ["open music", () => openMusicFolder()],
        ["open socials", () => openSocials()],
        ["sep"],
        ["tidy up icons", tidyIcons],
        ["reset layout", resetLayout],
        ["sep"],
        ["about this machine", aboutMachine],
      ];
      items.forEach((it) => {
        if (it[0] === "sep") { const d = document.createElement("div"); d.className = "ctx-sep"; menu.appendChild(d); return; }
        const b = document.createElement("button");
        b.className = "ctx-item";
        b.textContent = it[0];
        b.addEventListener("click", () => { close(); it[1](); });
        menu.appendChild(b);
      });
      document.body.appendChild(menu);
      let x = e.clientX, y = e.clientY;
      if (x + menu.offsetWidth > window.innerWidth) x = window.innerWidth - menu.offsetWidth - 4;
      if (y + menu.offsetHeight > window.innerHeight) y = window.innerHeight - menu.offsetHeight - 4;
      menu.style.left = x + "px";
      menu.style.top = y + "px";
    });
    document.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.addEventListener("blur", close);
  }

  function initLauncher() {
    const overlay = document.createElement("div");
    overlay.className = "launcher";
    overlay.innerHTML = '<div class="launcher-box"><input class="launcher-input" placeholder="type to open a program, photo, song, page..." aria-label="launcher" autocomplete="off" spellcheck="false"><ul class="launcher-list"></ul></div>';
    document.body.appendChild(overlay);
    const input = overlay.querySelector(".launcher-input");
    const list = overlay.querySelector(".launcher-list");
    let items = [], sel = 0;
    const ALL = []
      .concat([
        { label: "home", sub: "page", act: () => (location.href = ROOT || "./") },
        { label: "about", sub: "page", act: () => (location.href = ROOT + "about/") },
        { label: "blog", sub: "page", act: () => (location.href = ROOT + "blogs/") },
        { label: "terminal", sub: "app", act: () => termWin && restore(termWin) },
        { label: "music", sub: "folder", act: () => openMusicFolder() },
        { label: "socials", sub: "folder", act: () => openSocials() },
      ])
      .concat(Object.keys(DOCS).map((n) => ({ label: n, sub: "document", act: () => openDoc(n) })))
      .concat(PHOTOS.map((p) => ({ label: p.file, sub: "image", act: () => openViewer(p) })))
      .concat(TRACKS.map((t, i) => ({ label: t.title, sub: "song · " + t.artist, act: () => openPlayer(i) })));
    function render(q) {
      q = (q || "").toLowerCase().trim();
      items = ALL.filter((x) => (x.label + " " + x.sub).toLowerCase().includes(q)).slice(0, 12);
      sel = 0;
      list.innerHTML = "";
      items.forEach((x, i) => {
        const li = document.createElement("li");
        li.className = "launcher-item" + (i === 0 ? " sel" : "");
        li.innerHTML = '<span class="li-label">' + x.label + '</span><span class="li-sub">' + x.sub + "</span>";
        li.addEventListener("click", () => run(x));
        list.appendChild(li);
      });
    }
    function highlight() { Array.from(list.children).forEach((li, i) => li.classList.toggle("sel", i === sel)); }
    function open() { overlay.classList.add("show"); render(""); input.value = ""; setTimeout(() => input.focus(), 0); }
    function close() { overlay.classList.remove("show"); }
    function run(x) { close(); x.act(); }
    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { sel = Math.min(items.length - 1, sel + 1); highlight(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); highlight(); e.preventDefault(); }
      else if (e.key === "Enter") { if (items[sel]) run(items[sel]); }
      else if (e.key === "Escape") { close(); }
    });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        overlay.classList.contains("show") ? close() : open();
      }
    });
  }

  window.addEventListener("sidh-open-music", openMusicFolder);
  window.addEventListener("beforeunload", () => { if (wins.player) savePlayer(wins.player); });

  document.addEventListener("DOMContentLoaded", () => {
    initReorder();
    if (!isMobile()) {
      initDesktop();
      initPanelNP();
      initContextMenu();
      initLauncher();
    }
    initMusicMobile();
    restorePlayer();
  });
})();
