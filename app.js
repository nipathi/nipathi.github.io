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

  /* ---------- 3D with graceful fallback ---------- */
  var canvas = $("#uni"), stage = $("#stage"), boot = $("#boot");
  try {
    uni = new window.Universe(canvas, D, {
      reduceMotion: reduce, lowPower: low,
      onSelect: function (n) { showPanel(n ? n.key : null); }
    });
    canvas.style.cursor = "grab";
    uni.kick();
    setTimeout(function () { if (boot) boot.classList.add("gone"); }, 150);
    if (reduce) $("#hint").textContent = "Motion reduced · drag or use the buttons below";
  } catch (err) {
    stage.classList.add("nofx");
    if (boot) boot.remove();
    $("#hint").textContent = "";
  }

  /* ---------- routing between home and case studies ---------- */
  var cases = $$(".case"), home = $("#home");
  var baseTitle = document.title;
  function route() {
    var h = decodeURIComponent((location.hash || "").slice(1));
    var c = h.indexOf("case-") === 0 ? document.getElementById(h) : null;
    cases.forEach(function (x) { x.hidden = x !== c; });
    home.hidden = !!c;
    if (c) {
      document.title = (caseTitle[h.slice(5)] || "Case study") + " | Nipathi Ranj K";
      window.scrollTo(0, 0);
      var t = $("h1", c); if (t) t.focus({ preventScroll: true });
    } else {
      document.title = baseTitle;
      if (h && document.getElementById(h)) {
        var el = document.getElementById(h);
        requestAnimationFrame(function () { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
      } else if (!h) { window.scrollTo(0, 0); }
    }
    if (uni) uni.kick();
  }
  /* links that must leave a case study and land on a home section */
  $$("[data-home]").forEach(function (a) {
    a.addEventListener("click", function () {
      if (home.hidden) { setTimeout(route, 0); }
    });
  });
  window.addEventListener("hashchange", route);
  route();

  /* ---------- scroll progress and active section ---------- */
  var bar = $("#progress"), links = $$(".nav nav a");
  var secs = ["work", "skills", "journey", "contact"].map(function (id) { return document.getElementById(id); });
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ")";
      var cur = null;
      if (!home.hidden) secs.forEach(function (s) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = s.id; });
      links.forEach(function (a) { var on = a.getAttribute("href") === "#" + cur; if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
