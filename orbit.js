/* Orbit hero: five sections circle a core on separate rings, rotating together so labels never collide.
   Each orbit is a real link. Spokes cross the rings to show every section is one step from home. */
(function () {
  "use strict";
  var wrap = document.getElementById("orbit");
  if (!wrap) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var orbs = Array.prototype.slice.call(wrap.querySelectorAll(".orb"));
  var svgNS = "http://www.w3.org/2000/svg";
  var spokeBox = document.getElementById("spokes");
  var spokes = orbs.map(function () {
    var l = document.createElementNS(svgNS, "line");
    l.setAttribute("x1", 0); l.setAttribute("y1", 0);
    l.setAttribute("stroke", "#ffb547"); l.setAttribute("stroke-opacity", ".28"); l.setAttribute("stroke-width", "1");
    spokeBox.appendChild(l); return l;
  });
  var base = -Math.PI / 2 - 0.35, step = (Math.PI * 2) / orbs.length, rot = 0;
  var paused = false, running = false, last = 0, visible = true, hot = -1;

  function place() {
    orbs.forEach(function (o, i) {
      var r = +o.getAttribute("data-r"), a = base + i * step + rot;
      var x = Math.cos(a) * r, y = Math.sin(a) * r;
      o.parentNode.style.left = (50 + (x / 600) * 100) + "%";
      o.parentNode.style.top = (50 + (y / 600) * 100) + "%";
      spokes[i].setAttribute("x2", x.toFixed(1)); spokes[i].setAttribute("y2", y.toFixed(1));
      spokes[i].setAttribute("stroke-opacity", i === hot ? ".9" : ".28");
      spokes[i].setAttribute("stroke-width", i === hot ? "1.6" : "1");
    });
  }
  function frame(t) {
    if (!running) return;
    var dt = last ? Math.min(64, t - last) : 16; last = t;
    if (!paused && visible) rot += dt * 0.000045;
    place();
    requestAnimationFrame(frame);
  }
  function start() { if (running || reduce) return; running = true; last = 0; requestAnimationFrame(frame); }
  function stop() { running = false; }
  place();

  orbs.forEach(function (o, i) {
    function on() { paused = true; hot = i; if (reduce) place(); }
    function off() { paused = false; hot = -1; if (reduce) place(); }
    o.addEventListener("mouseenter", on); o.addEventListener("mouseleave", off);
    o.addEventListener("focus", on); o.addEventListener("blur", off);
  });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: 0.01 }).observe(wrap);
  } else start();
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (visible) start(); });
  start();

  /* gentle tilt that follows the pointer, only on fine pointers and with motion allowed */
  if (!reduce && window.matchMedia && matchMedia("(pointer: fine)").matches) {
    var host = wrap.parentNode;
    host.addEventListener("pointermove", function (e) {
      var b = host.getBoundingClientRect();
      var nx = (e.clientX - b.left) / b.width - 0.5, ny = (e.clientY - b.top) / b.height - 0.5;
      wrap.style.transform = "rotateX(" + (-ny * 9).toFixed(2) + "deg) rotateY(" + (nx * 11).toFixed(2) + "deg)";
    });
    host.addEventListener("pointerleave", function () { wrap.style.transform = ""; });
  }
  window.OrbitHero = { start: start, stop: stop };
})();
