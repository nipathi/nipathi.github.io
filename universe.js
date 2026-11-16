/* Skills universe: a small 3D engine on a 2D canvas.
   Why not WebGL: about 150 points need no shaders, nothing extra to download,
   and picking (hover, click) is exact because we know every projected position. */
(function () {
  "use strict";

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function Universe(canvas, data, opts) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("no 2d context");
    this.data = data;
    this.opts = opts || {};
    this.reduce = !!this.opts.reduceMotion;
    this.low = !!this.opts.lowPower;
    this.yaw = 0.6; this.pitch = 0.28;
    this.tYaw = null; this.tPitch = null;
    this.auto = !this.reduce;
    this.drag = null; this.moved = 0;
    this.hover = null; this.selected = null;
    this.visible = true; this.running = false;
    this.pulses = [];
    this.build();
    this.bind();
    this.resize();
  }

  Universe.prototype.build = function () {
    var r = rng(7), d = this.data, nodes = [], edges = [], byId = {};
    function add(n) { nodes.push(n); byId[n.key] = n; return n; }
    var core = add({ key: "core", type: "core", label: "Nipathi", color: "#edeae2", x: 0, y: 0, z: 0, r: 7 });
    var N = d.clusters.length;
    d.clusters.forEach(function (c, i) {
      var k = i + 0.5, phi = Math.acos(1 - 2 * k / N), th = Math.PI * (1 + Math.sqrt(5)) * k, R = 1.1;
      var hub = add({
        key: "c:" + c.id, type: "hub", id: c.id, label: c.name, color: c.color, dashed: !!c.dashed,
        x: R * Math.cos(th) * Math.sin(phi), y: R * Math.cos(phi), z: R * Math.sin(th) * Math.sin(phi), r: 8
      });
      edges.push([core, hub, c.id]);
      c.skills.forEach(function (s, j) {
        var a = r() * Math.PI * 2, b = Math.acos(2 * r() - 1), L = 0.3 + r() * 0.16;
        var sk = add({
          key: "s:" + c.id + ":" + j, type: "skill", id: c.id, label: s, color: c.color, dashed: !!c.dashed,
          x: hub.x + L * Math.sin(b) * Math.cos(a), y: hub.y + L * Math.cos(b), z: hub.z + L * Math.sin(b) * Math.sin(a), r: 3.2
        });
        edges.push([hub, sk, c.id]);
      });
    });
    d.projects.forEach(function (p) {
      var x = 0, y = 0, z = 0;
      p.hubs.forEach(function (h) { var n = byId["c:" + h]; x += n.x; y += n.y; z += n.z; });
      x /= p.hubs.length; y /= p.hubs.length; z /= p.hubs.length;
      var s = p.hubs.length === 1 ? 0.78 : 0.62;
      var pn = add({ key: "p:" + p.id, type: "project", id: p.id, label: p.name, short: p.short, color: p.color, x: x * s, y: y * s, z: z * s, r: 6, href: p.href, line: p.line });
      p.hubs.forEach(function (h) { edges.push([pn, byId["c:" + h], h, true]); });
    });
    this.nodes = nodes; this.edges = edges; this.byId = byId;
    var self = this, count = this.low ? 18 : 46;
    for (var i = 0; i < count; i++) self.pulses.push(self.newPulse(true));
  };

  Universe.prototype.newPulse = function (randomT) {
    var e = this.edges[Math.floor(Math.random() * this.edges.length)];
    return { e: e, t: randomT ? Math.random() : 0, s: 0.004 + Math.random() * 0.007 };
  };

  Universe.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, this.low ? 1.5 : 2);
    var w = this.cv.clientWidth, h = this.cv.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  };

  Universe.prototype.project = function (n) {
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var x1 = n.x * cy + n.z * sy, z1 = -n.x * sy + n.z * cy;
    var y2 = n.y * cp - z1 * sp, z2 = n.y * sp + z1 * cp;
    var f = 3.4, sc = f / (f - z2), U = Math.min(this.w, this.h) * 0.31;
    n.sx = this.w / 2 + x1 * sc * U; n.sy = this.h / 2 - y2 * sc * U; n.sc = sc; n.sz = z2;
  };

  Universe.prototype.pos = function (n) { return { x: n.x, y: n.y, z: n.z }; };

  Universe.prototype.related = function (n) {
    /* nodes to keep bright when something is selected */
    var set = {}, sel = n, self = this;
    if (!sel) return null;
    if (sel.type === "hub") {
      set[sel.key] = 1;
      this.nodes.forEach(function (m) { if (m.id === sel.id && m.type !== "project") set[m.key] = 1; });
      this.data.projects.forEach(function (p) { if (p.hubs.indexOf(sel.id) > -1) set["p:" + p.id] = 1; });
      set.core = 1;
    } else if (sel.type === "project") {
      set[sel.key] = 1; set.core = 1;
      var p = this.data.projects.filter(function (q) { return "p:" + q.id === sel.key; })[0];
      p.hubs.forEach(function (h) { set["c:" + h] = 1; });
    } else { set[sel.key] = 1; set.core = 1; }
    return set;
  };

  Universe.prototype.draw = function () {
    var ctx = this.ctx, w = this.w, h = this.h, self = this;
    if (!w) return;
    ctx.clearRect(0, 0, w, h);
    this.nodes.forEach(function (n) { self.project(n); });
    var lit = this.related(this.selected || (this.hover && this.hover.type !== "skill" ? this.hover : null));

    /* faint orbit ring for depth */
    ctx.save();
    ctx.strokeStyle = "rgba(154,160,184,0.08)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, Math.min(w, h) * 0.34, Math.min(w, h) * 0.34 * Math.abs(Math.sin(this.pitch + 1.2)), 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    /* edges */
    this.edges.forEach(function (e) {
      var a = e[0], b = e[1], on = !lit || (lit[a.key] && lit[b.key]);
      var depth = (a.sz + b.sz) / 2, al = (0.1 + 0.18 * (depth + 1.2) / 2.4);
      if (e[3]) al += 0.1;
      if (!on) al *= 0.25; else if (lit) al += 0.25;
      ctx.strokeStyle = self.rgba(e[3] ? "#ffb547" : b.color, Math.max(0.03, Math.min(0.9, al)));
      ctx.lineWidth = e[3] ? 1.2 : 0.8;
      if (b.dashed) ctx.setLineDash([3, 4]); else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    });
    ctx.setLineDash([]);

    /* pulses show data flowing along links */
    if (!this.reduce) {
      ctx.globalCompositeOperation = "lighter";
      this.pulses.forEach(function (p) {
        var a = p.e[0], b = p.e[1];
        var x = a.sx + (b.sx - a.sx) * p.t, y = a.sy + (b.sy - a.sy) * p.t;
        var on = !lit || (lit[a.key] && lit[b.key]);
        ctx.fillStyle = self.rgba(b.color, on ? 0.95 : 0.2);
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
    }

    /* nodes, far to near */
    var order = this.nodes.slice().sort(function (a, b) { return a.sz - b.sz; });
    order.forEach(function (n) {
      var on = !lit || lit[n.key], rad = n.r * n.sc * (n.type === "skill" ? 1 : 1) , isSel = n === self.selected || n === self.hover;
      var depthA = 0.55 + 0.45 * (n.sz + 1.3) / 2.6; if (!on) depthA *= 0.25;
      if (n.type !== "skill") {
        var g = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, rad * 3.4);
        g.addColorStop(0, self.rgba(n.color, 0.35 * depthA)); g.addColorStop(1, self.rgba(n.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.sx, n.sy, rad * 3.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(n.sx, n.sy, rad, 0, Math.PI * 2);
      if (n.dashed) {
        ctx.strokeStyle = self.rgba(n.color, depthA); ctx.lineWidth = 1.4; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      } else { ctx.fillStyle = self.rgba(n.color, depthA); ctx.fill(); }
      if (n.type === "project") {
        ctx.strokeStyle = self.rgba("#ffb547", depthA); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(n.sx, n.sy, rad + 4 * n.sc, 0, Math.PI * 2); ctx.stroke();
      }
      if (isSel) { ctx.strokeStyle = "rgba(237,234,226,0.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.sx, n.sy, rad + 6, 0, Math.PI * 2); ctx.stroke(); }
    });

    /* labels: priority order, skipping any that would overlap one already placed */
    var small = w < 420, placed = [];
    ctx.textBaseline = "middle";
    function prio(n) { return n === self.selected || n === self.hover ? 0 : n.type === "project" ? 1 : n.type === "hub" ? 2 : n.type === "core" ? 4 : 3; }
    var cand = this.nodes.filter(function (n) {
      var show = n.type === "hub" || n.type === "project";
      if (n.type === "skill") show = (lit && lit[n.key]) || n === self.hover;
      if (n.type === "core") show = !lit;
      return show && !(lit && !lit[n.key] && n !== self.hover);
    }).sort(function (a, b) { return prio(a) - prio(b) || b.sz - a.sz; });
    cand.forEach(function (n) {
      var fs = (n.type === "skill" ? 11 : 12) * (small ? 0.92 : 1);
      ctx.font = (n.type === "hub" ? "600 " : "400 ") + fs + "px 'JetBrains Mono', ui-monospace, monospace";
      var txt = (n === self.hover || n === self.selected) ? n.label : (n.type === "project" ? n.short : n.label);
      var tw = ctx.measureText(txt).width, tx = n.sx + n.r * n.sc + 8;
      if (tx + tw > w - 6) tx = n.sx - n.r * n.sc - 8 - tw;
      if (tx < 4) tx = 4;
      var box = { x: tx - 3, y: n.sy - fs * 0.8, w: tw + 6, h: fs * 1.6 };
      var clash = placed.some(function (b) { return box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y; });
      if (clash && prio(n) > 0) return;
      placed.push(box);
      var da = Math.max(0.5, 0.55 + 0.45 * (n.sz + 1.2) / 2.4);
      ctx.fillStyle = "rgba(8,11,22,0.62)"; ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = self.rgba(n.type === "project" ? "#ffd48a" : "#edeae2", da);
      ctx.fillText(txt, tx, n.sy + 0.5);
    });
  };

  Universe.prototype.rgba = function (hex, a) {
    var v = hex.charAt(0) === "#" ? hex.slice(1) : hex;
    return "rgba(" + parseInt(v.slice(0, 2), 16) + "," + parseInt(v.slice(2, 4), 16) + "," + parseInt(v.slice(4, 6), 16) + "," + a + ")";
  };

  Universe.prototype.pick = function (x, y) {
    var best = null, bd = 1e9;
    this.nodes.forEach(function (n) {
      var rad = Math.max(n.r * n.sc, 6) + (n.type === "skill" ? 6 : 8), dx = n.sx - x, dy = n.sy - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < rad && d - n.sc * 0.5 < bd) { bd = d; best = n; }
    });
    return best;
  };

  Universe.prototype.focus = function (key) {
    var n = this.byId[key]; if (!n) return;
    var base = n;
    if (n.type === "skill") base = this.byId["c:" + n.id];
    this.tYaw = Math.atan2(-base.x, base.z);
    var z1 = -base.x * Math.sin(this.tYaw) + base.z * Math.cos(this.tYaw);
    this.tPitch = Math.max(-0.8, Math.min(0.8, Math.atan2(base.y, z1)));
    this.kick();
  };

  Universe.prototype.select = function (key, silent) {
    this.selected = key ? this.byId[key] : null;
    if (this.selected) this.focus(this.selected.key);
    this.auto = !this.selected && !this.reduce;
    this.kick();
    if (!silent && this.opts.onSelect) this.opts.onSelect(this.selected);
  };

  Universe.prototype.bind = function () {
    var self = this, cv = this.cv;
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener("pointerdown", function (e) {
      var p = pt(e); self.drag = { x: p.x, y: p.y, yaw: self.yaw, pitch: self.pitch, id: e.pointerId }; self.moved = 0;
      self.tYaw = self.tPitch = null;
    });
    cv.addEventListener("pointermove", function (e) {
      var p = pt(e);
      if (self.drag) {
        var dx = p.x - self.drag.x, dy = p.y - self.drag.y; self.moved = Math.max(self.moved, Math.abs(dx) + Math.abs(dy));
        if (self.moved > 4) {
          try { cv.setPointerCapture(self.drag.id); } catch (err) {}
          self.yaw = self.drag.yaw + dx * 0.008;
          self.pitch = Math.max(-1.1, Math.min(1.1, self.drag.pitch + dy * 0.006));
          self.kick();
        }
      } else {
        var h = self.pick(p.x, p.y);
        if (h !== self.hover) { self.hover = h; cv.style.cursor = h ? "pointer" : "grab"; self.kick(); }
      }
    });
    function end(e) {
      if (!self.drag) return;
      var p = pt(e), wasClick = self.moved <= 4; self.drag = null;
      try { cv.releasePointerCapture(e.pointerId); } catch (err) {}
      if (wasClick) {
        var h = self.pick(p.x, p.y);
        if (h) self.select(h.type === "skill" ? "c:" + h.id : h.key); else if (self.selected) self.select(null);
      }
    }
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", function () { self.drag = null; });
    cv.addEventListener("pointerleave", function () { if (self.hover) { self.hover = null; self.kick(); } });
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(cv);
    else window.addEventListener("resize", function () { self.resize(); });
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; if (self.visible) self.kick(); }, { threshold: 0.01 }).observe(cv);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) self.kick(); });
  };

  /* render loop: continuous when animating, on demand when reduced motion */
  Universe.prototype.kick = function () {
    if (this.running || !this.visible || document.hidden) return;
    this.running = true;
    var self = this;
    (function frame() {
      var moving = self.step();
      self.draw();
      if (self.visible && !document.hidden && (moving || (!self.reduce))) requestAnimationFrame(frame);
      else self.running = false;
    })();
  };

  Universe.prototype.step = function () {
    var moving = false, self = this;
    if (this.tYaw !== null) {
      var dy = this.tYaw - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      var dp = this.tPitch - this.pitch;
      this.yaw += dy * 0.12; this.pitch += dp * 0.12;
      if (Math.abs(dy) + Math.abs(dp) < 0.003) { this.tYaw = this.tPitch = null; } else moving = true;
    } else if (this.auto && !this.drag) { this.yaw += 0.0016; }
    if (!this.reduce) this.pulses.forEach(function (p, i) { p.t += p.s; if (p.t >= 1) self.pulses[i] = self.newPulse(false); });
    return moving || this.drag !== null;
  };

  window.Universe = Universe;
})();
