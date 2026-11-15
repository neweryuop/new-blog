/* =========================================================
   BLUE HOUR — background.js
   星空 / 流星 / 粒子网络 / 背景视差 / Hero 滚动淡出
   已移除：鼠标拖尾、点击爆发、涟漪（保持光标轻快）
   ========================================================= */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var root = document.documentElement;

  var bgCanvas = document.getElementById('bg');
  if (!bgCanvas) return;

  var bgCtx = bgCanvas.getContext('2d');

  // 停用 fx 图层（原本用于拖尾、爆发、涟漪）
  var fxCanvas = document.getElementById('fx');
  if (fxCanvas) fxCanvas.style.display = 'none';

  var W = 0, H = 0, DPR = 1;

  /* ---------- 调色板 ---------- */
  var PALETTE = {
    night:  { star: { r: 178, g: 204, b: 255, a: 1   }, accent: { r: 126, g: 166, b: 255 } },
    sunset: { star: { r: 255, g: 200, b: 150, a: .55 }, accent: { r: 224, g: 104, b: 58  } }
  };
  var theme = 'night';
  var starCur = { r: PALETTE.night.star.r, g: PALETTE.night.star.g, b: PALETTE.night.star.b, a: PALETTE.night.star.a };
  var accCur  = { r: PALETTE.night.accent.r, g: PALETTE.night.accent.g, b: PALETTE.night.accent.b };

  document.addEventListener('bh:theme', function (e) {
    theme = (e.detail && e.detail.theme) || 'night';
  });

  /* ---------- 状态 ---------- */
  var stars = [];
  var meteors = [];
  var nodes = [];

  var isSmall = window.innerWidth < 800;
  var NODE_COUNT = isSmall ? 34 : 78;
  var LINK_DIST = 118;
  var MOUSE_LINK = 200;

  var mouse = { x: -9999, y: -9999, active: false };

  var heroInner = document.querySelector('.hero-inner');
  var scrollY = window.scrollY;
  var heroMouseX = 0, heroMouseY = 0;

  var pxCur = 0, pyCur = 0, rotCur = 0;
  var t0 = performance.now();
  var nextMeteor = 3500 + Math.random() * 5000;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- 尺寸与重建 ---------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;

    bgCanvas.width = Math.floor(W * DPR);
    bgCanvas.height = Math.floor(H * DPR);
    bgCanvas.style.width = W + 'px';
    bgCanvas.style.height = H + 'px';
    bgCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    buildStars();
    buildNodes();
  }

  function buildStars() {
    var count = Math.min(240, Math.round((W * H) / 9000));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.25, 1.55),
        base: rand(0.1, 0.65),
        sp: rand(0.25, 1.15),
        ph: rand(0, Math.PI * 2),
        vy: rand(0.006, 0.056)
      });
    }
  }

  function buildNodes() {
    isSmall = window.innerWidth < 800;
    NODE_COUNT = isSmall ? 34 : 78;
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-0.25, 0.25),
        vy: rand(-0.25, 0.25),
        r: rand(0.8, 2.2),
        base: rand(0.2, 0.6)
      });
    }
  }

  function spawnMeteor() {
    var fromLeft = Math.random() > 0.5;
    meteors.push({
      x: fromLeft ? Math.random() * W * 0.5 : W - Math.random() * W * 0.5,
      y: Math.random() * H * 0.4,
      vx: (fromLeft ? 1 : -1) * rand(4, 8),
      vy: rand(2, 4.5),
      life: 1,
      len: rand(90, 180)
    });
  }

  /* ---------- 鼠标跟踪（仅供粒子网络与视差使用） ---------- */
  if (fine && !reduce) {
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      heroMouseX = (e.clientX / window.innerWidth - 0.5);
      heroMouseY = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    window.addEventListener('mouseleave', function () {
      mouse.active = false;
    });
    window.addEventListener('mouseenter', function () {
      mouse.active = true;
    });
  }

  window.addEventListener('scroll', function () {
    scrollY = window.scrollY;
  }, { passive: true });

  /* ---------- 星空 ---------- */
  function drawStars(t) {
    var SR = starCur.r | 0, SG = starCur.g | 0, SB = starCur.b | 0;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
      var alpha = s.base * tw * starCur.a;
      if (alpha <= 0.004) continue;
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = 'rgba(' + SR + ',' + SG + ',' + SB + ',' + alpha.toFixed(3) + ')';
      bgCtx.fill();

      s.y += s.vy;
      if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
    }
  }

  /* ---------- 流星 ---------- */
  function drawMeteors(now) {
    if (now > nextMeteor) {
      spawnMeteor();
      nextMeteor = now + 5000 + Math.random() * 9000;
    }

    var SR = starCur.r | 0, SG = starCur.g | 0, SB = starCur.b | 0;

    for (var i = meteors.length - 1; i >= 0; i--) {
      var m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life -= 0.012;

      if (m.life <= 0 || m.x < -240 || m.x > W + 240 || m.y > H + 240) {
        meteors.splice(i, 1);
        continue;
      }

      var tailX = m.x - m.vx * m.len / 5;
      var tailY = m.y - m.vy * m.len / 5;

      var lg = bgCtx.createLinearGradient(m.x, m.y, tailX, tailY);
      lg.addColorStop(0, 'rgba(' + SR + ',' + SG + ',' + SB + ',' + (0.6 * m.life).toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(' + SR + ',' + SG + ',' + SB + ',0)');

      bgCtx.beginPath();
      bgCtx.strokeStyle = lg;
      bgCtx.lineWidth = 1.2;
      bgCtx.moveTo(m.x, m.y);
      bgCtx.lineTo(tailX, tailY);
      bgCtx.stroke();
    }
  }

  /* ---------- 粒子网络 ---------- */
  function updateNodes() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];

      if (mouse.active) {
        var dx = mouse.x - n.x;
        var dy = mouse.y - n.y;
        var d = Math.sqrt(dx * dx + dy * dy);

        if (d < 240 && d > 0.001) {
          var f = 1 - d / 240;
          if (d < 64) {
            n.vx -= (dx / d) * f * 0.9;
            n.vy -= (dy / d) * f * 0.9;
          } else {
            n.vx += (dx / d) * f * 0.045;
            n.vy += (dy / d) * f * 0.045;
            n.vx += (-dy / d) * f * 0.10;
            n.vy += (dx / d) * f * 0.10;
          }
        }
      }

      n.vx *= 0.965;
      n.vy *= 0.965;
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < -30) n.x = W + 30;
      if (n.x > W + 30) n.x = -30;
      if (n.y < -30) n.y = H + 30;
      if (n.y > H + 30) n.y = -30;
    }
  }

  function drawNodeLinks() {
    var AR = accCur.r | 0, AG = accCur.g | 0, AB = accCur.b | 0;

    bgCtx.lineWidth = 0.6;
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i];
        var b = nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          var d = Math.sqrt(d2);
          var alpha = (1 - d / LINK_DIST) * 0.28;
          bgCtx.strokeStyle = 'rgba(' + AR + ',' + AG + ',' + AB + ',' + alpha.toFixed(3) + ')';
          bgCtx.beginPath();
          bgCtx.moveTo(a.x, a.y);
          bgCtx.lineTo(b.x, b.y);
          bgCtx.stroke();
        }
      }
    }
  }

  function drawMouseLinks() {
    if (!mouse.active) return;

    var AR = accCur.r | 0, AG = accCur.g | 0, AB = accCur.b | 0;

    bgCtx.lineWidth = 0.9;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var dx = n.x - mouse.x;
      var dy = n.y - mouse.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < MOUSE_LINK) {
        var a = (1 - d / MOUSE_LINK) * 0.55;
        bgCtx.strokeStyle = 'rgba(' + AR + ',' + AG + ',' + AB + ',' + a.toFixed(3) + ')';
        bgCtx.beginPath();
        bgCtx.moveTo(n.x, n.y);
        bgCtx.lineTo(mouse.x, mouse.y);
        bgCtx.stroke();
      }
    }
  }

  function drawNodes() {
    var AR = accCur.r | 0, AG = accCur.g | 0, AB = accCur.b | 0;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var a = n.base;
      if (mouse.active) {
        var dx = n.x - mouse.x;
        var dy = n.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 240) a = Math.min(1, a + (1 - d / 240) * 0.55);
      }
      bgCtx.beginPath();
      bgCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      bgCtx.fillStyle = 'rgba(' + AR + ',' + AG + ',' + AB + ',' + a.toFixed(3) + ')';
      bgCtx.fill();
    }
  }

  /* ---------- 主循环 ---------- */
  function frame(now) {
    var t = (now - t0) / 1000;

    // 颜色平滑靠近目标主题
    var target = PALETTE[theme] || PALETTE.night;
    var k = 0.05;
    starCur.r += (target.star.r - starCur.r) * k;
    starCur.g += (target.star.g - starCur.g) * k;
    starCur.b += (target.star.b - starCur.b) * k;
    starCur.a += (target.star.a - starCur.a) * k;
    accCur.r += (target.accent.r - accCur.r) * k;
    accCur.g += (target.accent.g - accCur.g) * k;
    accCur.b += (target.accent.b - accCur.b) * k;

    bgCtx.clearRect(0, 0, W, H);
    drawStars(t);
    drawMeteors(now);

    updateNodes();
    drawNodeLinks();
    drawMouseLinks();
    drawNodes();

    // 背景视差
    if (fine && !reduce) {
      var tx = (mouse.x / W - 0.5) * 2;
      var ty = (mouse.y / H - 0.5) * 2;
      pxCur += (tx - pxCur) * 0.045;
      pyCur += (ty - pyCur) * 0.045;
      rotCur += 0.02;

      root.style.setProperty('--px', pxCur.toFixed(4));
      root.style.setProperty('--py', pyCur.toFixed(4));
      root.style.setProperty('--rot', (rotCur * 0.4).toFixed(2) + 'deg');
    }

    // Hero 滚动收缩 + 鼠标视差
    if (heroInner && !reduce) {
      var v = Math.min(scrollY / 800, 1);
      var heroScale = 1 - v * 0.06;
      var heroOpacity = Math.max(0, 1 - v * 1.15);
      var mx = heroMouseX * -16;
      var my = heroMouseY * -10;
      heroInner.style.transform =
        'translate3d(' + mx.toFixed(2) + 'px,' + my.toFixed(2) + 'px,0) scale(' + heroScale.toFixed(3) + ')';
      heroInner.style.opacity = heroOpacity.toFixed(2);
    }

    requestAnimationFrame(frame);
  }

  /* ---------- 启动 ---------- */
  resize();
  window.addEventListener('resize', resize);

  if (!reduce) {
    requestAnimationFrame(frame);
  } else {
    bgCtx.clearRect(0, 0, W, H);
    var SR = starCur.r | 0, SG = starCur.g | 0, SB = starCur.b | 0;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = 'rgba(' + SR + ',' + SG + ',' + SB + ',' + (s.base * 0.8).toFixed(3) + ')';
      bgCtx.fill();
    }
  }
})();