(function () {
  "use strict";
  var D = window.PORTFOLIO;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var low = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4) || window.innerWidth < 700;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var projectById = {}; D.projects.forEach(function (p) { projectById[p.id] = p; });
  var clusterById = {}; D.clusters.forEach(function (c) { clusterById[c.id] = c; });
  var caseTitle = { heart: "Hybrid quantum heart disease model", brinjal: "Brinjal disease detector on a camera chip", store: "Roofing e-commerce platform" };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- skills grid (always in the page, with or without 3D) ---------- */
  var grid = $("#skillGrid");
  D.clusters.forEach(function (c) {
    var seen = c.seen.map(function (id) {
      var p = projectById[id];
      return '<a href="' + p.href + '"' + (p.href.indexOf("case") > -1 ? "" : ' data-home') + '>' + esc(p.name) + "</a>";
    }).join("");
    var el = document.createElement("article");
    el.className = "skill" + (c.dashed ? " dashed" : "");
    el.style.setProperty("--c", c.color);
    el.innerHTML = "<h3>" + esc(c.name) + "</h3><p>" + esc(c.blurb) + "</p><ul>" +
      c.skills.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
      (seen ? '<div class="seen"><span class="mono">Seen in</span>' + seen + "</div>" : "");
    grid.appendChild(el);
  });

  /* ---------- panel + chips for the universe ---------- */
  var panel = $("#panel"), chipBox = $(".chips");
  var uni = null, chips = {};
  function chip(key, label, color, isProject) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip" + (isProject ? " proj" : ""); b.setAttribute("aria-pressed", "false");
    b.style.setProperty("--c", color); b.textContent = label;
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true";
      if (uni) uni.select(on ? null : key); else showPanel(on ? null : key);
    });
    chipBox.appendChild(b); chips[key] = b;
  }
  D.clusters.forEach(function (c) { chip("c:" + c.id, c.name, c.color, false); });
  D.projects.forEach(function (p) { chip("p:" + p.id, p.short, "#ffb547", true); });

  function showPanel(key) {
    Object.keys(chips).forEach(function (k) { chips[k].setAttribute("aria-pressed", k === key ? "true" : "false"); });
    if (!key) {
      panel.innerHTML = '<p class="mono ptag">Skills universe</p><p>Each cluster is an area I work in. Amber rings are projects linked to the clusters they use. Pick one to see the evidence.</p>';
      return;
    }
    if (key.indexOf("c:") === 0) {
      var c = clusterById[key.slice(2)];
      var ps = D.projects.filter(function (p) { return p.hubs.indexOf(c.id) > -1; });
      panel.innerHTML = '<p class="mono ptag" style="color:' + c.color + '">Cluster</p><h3>' + esc(c.name) + "</h3><p>" + esc(c.blurb) + "</p>" +
        '<div class="tags">' + c.skills.map(function (s) { return "<span>" + esc(s) + "</span>"; }).join("") + "</div>" +
        (ps.length ? '<p class="mono ptag">Used in</p><div class="links">' + ps.map(function (p) { return '<a href="' + p.href + '"' + (p.href.indexOf("case") > -1 ? "" : " data-home") + ">" + esc(p.name) + " &rarr;</a>"; }).join("") + "</div>" : "");
    } else {
      var p = projectById[key.slice(2)];
      panel.innerHTML = '<p class="mono ptag" style="color:#ffb547">Project</p><h3>' + esc(p.name) + "</h3><p>" + esc(p.line) + '</p><div class="links"><a href="' + p.href + '"' + (p.href.indexOf("case") > -1 ? "" : " data-home") + ">" + (p.href.indexOf("case") > -1 ? "Read the case study" : "See the experience") + " &rarr;</a></div>";
    }
  }
  showPanel(null);

  /* ---------- 3D with graceful fallback (starts the first time the Skills scene opens) ---------- */
  var canvas = $("#uni"), stage = $("#stage"), boot = $("#boot"), uniTried = false;
  function initUniverse() {
    if (uniTried) return; uniTried = true;
    try {
      uni = new window.Universe(canvas, D, {
        reduceMotion: reduce, lowPower: low,
        onSelect: function (n) { showPanel(n ? n.key : null); }
      });
      canvas.style.cursor = "grab";
      uni.kick();
      setTimeout(function () { if (boot) boot.classList.add("gone"); }, 150);
      if (reduce) $("#hint").textContent = "Motion reduced · drag or use the buttons";
    } catch (err) {
      stage.classList.add("nofx");
      if (boot) boot.remove();
      $("#hint").textContent = "";
    }
  }

  /* ---------- scenes: one view at a time, joined by a crossing wipe ---------- */
  var order = ["home", "about", "work", "skills", "journey", "contact"];
  var label = { home: "Home", about: "About", work: "Work", skills: "Skills", journey: "Journey", contact: "Contact" };
  var alias = { top: "home", interests: "about" };
  var scenes = {}; order.forEach(function (id) { scenes[id] = document.getElementById(id); });
  var cases = $$(".case"), baseTitle = document.title;
  var cross = $("#cross"), body = document.body;
  var current = null, busy = false;
  var navLinks = $$(".nav nav a"), dots = $$(".rail-dots a");
  var prevA = $("#railPrev"), nextA = $("#railNext");

  function target() {
    var h = decodeURIComponent((location.hash || "").slice(1));
    if (alias[h]) h = alias[h];
    if (h.indexOf("case-") === 0 && document.getElementById(h)) return h;
    return scenes[h] ? h : "home";
  }
  function show(id) {
    var isCase = id.indexOf("case-") === 0;
    order.forEach(function (k) { scenes[k].classList.toggle("on", k === id); });
    cases.forEach(function (c) { c.hidden = c.id !== id; });
    body.classList.toggle("in-case", isCase);
    var focusEl;
    if (isCase) {
      document.title = (caseTitle[id.slice(5)] || "Case study") + " | Nipathi Ranj K";
      focusEl = $("h1", document.getElementById(id));
    } else {
      document.title = id === "home" ? baseTitle : label[id] + " | Nipathi Ranj K";
      focusEl = $("h1, h2", scenes[id]); if (focusEl && !focusEl.hasAttribute("tabindex")) focusEl.setAttribute("tabindex", "-1");
    }
    window.scrollTo(0, 0);
    if (focusEl) focusEl.focus({ preventScroll: true });
    if (id === "skills") { initUniverse(); if (uni) uni.kick(); }
    if (window.OrbitHero) { if (id === "home") window.OrbitHero.start(); }
    /* rail and header state; a case study counts as part of Work */
    var at = isCase ? "work" : id, i = order.indexOf(at);
    dots.forEach(function (a) { if (a.getAttribute("data-s") === at) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    navLinks.forEach(function (a) { if (a.getAttribute("href") === "#" + at) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    var p = order[(i + order.length - 1) % order.length], n = order[(i + 1) % order.length];
    prevA.setAttribute("href", "#" + p); prevA.setAttribute("aria-label", "Previous scene: " + label[p]);
    nextA.setAttribute("href", "#" + n); $("span", nextA).textContent = label[n]; nextA.setAttribute("aria-label", "Next scene: " + label[n]);
    current = id;
  }
  function route(first) {
    var t = target();
    if (t === current) return;
    if (first || reduce || current === null) { body.classList.toggle("first", !!first); show(t); return; }
    if (busy) return;
    body.classList.remove("first");
    busy = true;
    cross.classList.remove("run"); void cross.offsetWidth; cross.classList.add("run");
    setTimeout(function () { show(target()); }, 560);
    setTimeout(function () { cross.classList.remove("run"); busy = false; if (target() !== current) route(); }, 1000);
  }
  window.addEventListener("hashchange", function () { route(false); });
  route(true);
  setTimeout(function () { body.classList.remove("first"); }, 1500);

  /* arrow keys move between scenes when nothing else has focus */
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var ae = document.activeElement;
    if (ae && ae !== document.body && !(ae.tagName === "H1" || ae.tagName === "H2")) return;
    if (current && current.indexOf("case-") === 0) return;
    var i = order.indexOf(current);
    if (e.key === "ArrowRight") { location.hash = order[Math.min(order.length - 1, i + 1)]; }
    else if (e.key === "ArrowLeft") { location.hash = order[Math.max(0, i - 1)]; }
  });
})();
