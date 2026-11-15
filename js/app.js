/* =========================================================
   BLUE HOUR — app.js
   侧栏、筛选、搜索、加载更多、揭示、导航高亮、波纹、倾斜、数字滚动
   ========================================================= */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var bodyEl = document.body;
  var isPostPage = /\/blog\//.test(window.location.pathname);

  /* =========================================================
     1. 侧栏开合
     ========================================================= */
  var tagRail = document.getElementById('tagRail');
  var tagClose = document.getElementById('tagClose');
  var tagScrim = document.getElementById('tagScrim');
  var tagFab = document.getElementById('tagFab');
  var tagClear = document.getElementById('tagClear');

  function openTags() {
    bodyEl.classList.add('tag-open');
    if (tagRail) tagRail.setAttribute('aria-expanded', 'true');
  }
  function closeTags() {
    bodyEl.classList.remove('tag-open');
    if (tagRail) tagRail.setAttribute('aria-expanded', 'false');
  }

  if (tagRail) tagRail.addEventListener('click', openTags);
  if (tagClose) tagClose.addEventListener('click', closeTags);
  if (tagScrim) tagScrim.addEventListener('click', closeTags);
  if (tagFab) tagFab.addEventListener('click', openTags);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeTags();
  });

  function bindTagsLink(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      if (isPostPage) return;
      e.preventDefault();
      openTags();
      var target = document.getElementById('posts');
      if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }
  bindTagsLink(document.getElementById('navTags'));
  bindTagsLink(document.getElementById('footTags'));

  /* =========================================================
     2. 浮尘生成
     ========================================================= */
  var particles = document.getElementById('particles');
  if (particles && !reduce) {
    var classes = ['far', 'mid', 'near'];
    for (var i = 0; i < 34; i++) {
      var p = document.createElement('i');
      var c = classes[i % 3];
      p.className = c;
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (25 + Math.random() * 75) + '%';
      var dur = (c === 'near' ? 9 : c === 'mid' ? 14 : 20) + Math.random() * 8;
      p.style.animationDuration = dur + 's';
      p.style.animationDelay = (-Math.random() * dur) + 's';
      particles.appendChild(p);
    }
  }

  /* =========================================================
     3. 卡片与标签漂浮错峰
     ========================================================= */
  document.querySelectorAll('.col-card, .series-card, .about-card, .fact-list').forEach(function (el, i) {
    if (!el.style.getPropertyValue('--fd')) {
      el.style.setProperty('--fd', ((i * 0.37) % 7).toFixed(2) + 's');
    }
  });
  document.querySelectorAll('.tag-cloud-side .tag-pill').forEach(function (el, i) {
    el.style.setProperty('--fd', ((i * 0.31) % 6).toFixed(2) + 's');
  });

  /* =========================================================
     4. 磁吸按钮（保留，但强度降低，避免"按钮躲鼠标"感）
     ========================================================= */
  if (fine && !reduce) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var R = 80;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < R + Math.max(r.width, r.height) / 2) {
          el.style.transform = 'translate(' + (dx * 0.12) + 'px,' + (dy * 0.15) + 'px)';
        }
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* =========================================================
     5. 按钮波纹
     ========================================================= */
  if (!reduce) {
    var rippleTargets = '.btn, .chip, .theme-switch button, .back-top, .tag-pill, .tag-clear, .tag-panel-close, .tag-rail';
    document.addEventListener('pointerdown', function (e) {
      var el = e.target.closest ? e.target.closest(rippleTargets) : null;
      if (!el) return;
      var style = getComputedStyle(el);
      if (style.position === 'static') el.style.position = 'relative';
      if (style.overflow !== 'hidden') el.style.overflow = 'hidden';
      var r = el.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2;
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
      el.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 750);
    }, { passive: true });
  }

  /* =========================================================
     6. 卡片 3D 倾斜 + 光斑跟随
     ========================================================= */
  if (fine && !reduce) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      var raf = null;
      var tX = 0, tY = 0, cX = 0, cY = 0;
      var max = 6;

      function animate() {
        cX += (tX - cX) * 0.16;
        cY += (tY - cY) * 0.16;
        el.style.transform =
          'perspective(900px) rotateX(' + cY.toFixed(2) + 'deg) rotateY(' + cX.toFixed(2) + 'deg) translateZ(0)';
        if (Math.abs(tX - cX) > 0.01 || Math.abs(tY - cY) > 0.01) {
          raf = requestAnimationFrame(animate);
        } else {
          raf = null;
        }
      }

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tX = px * max * 2;
        tY = -py * max * 2;
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (!raf) raf = requestAnimationFrame(animate);
      });

      el.addEventListener('pointerleave', function () {
        tX = 0; tY = 0;
        if (!raf) raf = requestAnimationFrame(animate);
      });
    });
  } else {
    document.querySelectorAll('.post, .col-card, .series-card, .mini').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* =========================================================
     7. 标签磁性
     ========================================================= */
  if (fine && !reduce) {
    document.querySelectorAll('.tag-cloud-side .tag-pill').forEach(function (tag) {
      tag.addEventListener('pointermove', function (e) {
        var r = tag.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var R = Math.max(r.width, r.height) * 0.9;
        if (dist < R) {
          tag.style.transform =
            'translate(' + (dx / R * 7).toFixed(2) + 'px,' + (dy / R * 7).toFixed(2) + 'px) scale(1.05)';
        }
      });
      tag.addEventListener('pointerleave', function () {
        tag.style.transform = '';
      });
    });
  }

  /* =========================================================
     8. 数字滚动
     ========================================================= */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var numIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        numIO.unobserve(el);
        var target = parseInt(el.dataset.count, 10) || 0;
        var dur = 1200;
        var st = performance.now();
        function step(now) {
          var p = Math.min((now - st) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { numIO.observe(c); });
  } else {
    counters.forEach(function (c) {
      c.textContent = c.dataset.count || '0';
    });
  }

  /* =========================================================
     9. 分隔线揭示
     ========================================================= */
  if ('IntersectionObserver' in window) {
    var divIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          divIO.unobserve(en.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
    document.querySelectorAll('[data-divider]').forEach(function (d) { divIO.observe(d); });
  }

  /* =========================================================
     10. 分类筛选 / 搜索 / 加载更多 / 标签云 / 清除筛选
     ========================================================= */
  var PAGE = 9;
  var limit = PAGE;
  var activeFilter = 'all';

  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var posts = Array.prototype.slice.call(document.querySelectorAll('.post'));
  var searchInput = document.getElementById('search');
  var emptyEl = document.getElementById('empty');
  var loadMoreBtn = document.getElementById('loadMore');
  var moreCount = document.getElementById('moreCount');
  var moreWrap = document.getElementById('moreWrap');

  function matchPost(p, q) {
    var catOk = activeFilter === 'all' || p.dataset.cat === activeFilter;
    if (!catOk) return false;
    if (!q) return true;
    var hay = ((p.dataset.search || '') + ' ' + (p.textContent || '')).toLowerCase();
    return hay.indexOf(q) > -1;
  }

  function applyFilter() {
    if (!posts.length) return;

    var q = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
    var matched = 0;
    var shown = 0;

    posts.forEach(function (p) {
      var ok = matchPost(p, q);
      if (ok) matched++;

      var visible = ok && matched <= limit;
      var wasOff = p.classList.contains('off');

      p.classList.toggle('off', !visible);

      if (visible) {
        shown++;
        p.classList.add('in');
        if (wasOff) {
          p.classList.remove('enter');
          void p.offsetWidth;
          p.style.animationDelay = ((shown - 1) % PAGE) * 0.045 + 's';
          p.classList.add('enter');
        }
      }
    });

    if (emptyEl) emptyEl.classList.toggle('show', matched === 0);
    if (moreWrap) moreWrap.style.display = matched === 0 ? 'none' : '';

    if (loadMoreBtn) {
      var hasMore = matched > limit;
      loadMoreBtn.disabled = !hasMore;
      loadMoreBtn.style.display = hasMore ? '' : 'none';
    }

    if (moreCount) {
      if (matched === 0) moreCount.textContent = '';
      else if (matched > limit) moreCount.textContent = '已显示 ' + shown + ' / ' + matched + ' 篇';
      else moreCount.textContent = '共 ' + matched + ' 篇';
    }
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.toggle('on', x === c); });
      activeFilter = c.dataset.filter || 'all';
      limit = PAGE;
      applyFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      limit = PAGE;
      applyFilter();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      limit += PAGE;
      applyFilter();
    });
  }

  document.querySelectorAll('.tag-cloud-side .tag-pill').forEach(function (tp) {
    tp.addEventListener('click', function (e) {
      var kw = tp.dataset.tag || '';
      var si = document.getElementById('search');
      if (!si) return;
      e.preventDefault();
      si.value = kw;
      limit = PAGE;
      chips.forEach(function (x) { x.classList.toggle('on', x.dataset.filter === 'all'); });
      activeFilter = 'all';
      applyFilter();
      var target = document.getElementById('posts');
      if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (window.matchMedia('(max-width: 700px)').matches) closeTags();
    });
  });

  if (tagClear) {
    tagClear.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      chips.forEach(function (c) { c.classList.toggle('on', c.dataset.filter === 'all'); });
      activeFilter = 'all';
      limit = PAGE;
      applyFilter();
      var target = document.getElementById('posts');
      if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (window.matchMedia('(max-width: 700px)').matches) closeTags();
    });
  }

  applyFilter();

  /* =========================================================
     11. 滚动进度 / 导航吸顶 / 回到顶部
     ========================================================= */
  var bar = document.getElementById('progress');
  var nav = document.getElementById('nav');
  var backTop = document.getElementById('backTop');
  var btProgress = document.getElementById('btProgress');
  var btLen = 2 * Math.PI * 20;

  if (btProgress) {
    btProgress.style.strokeDasharray = btLen.toFixed(2);
    btProgress.style.strokeDashoffset = btLen.toFixed(2);
  }

  function onScroll() {
    var st = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(st / max, 1) : 0;

    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    if (nav) nav.classList.toggle('scrolled', st > 40);
    if (backTop) backTop.classList.toggle('show', st > 600);
    if (btProgress) btProgress.style.strokeDashoffset = (btLen * (1 - p)).toFixed(2);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* =========================================================
     12. 导航高亮
     ========================================================= */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('#mainNav a'));
  var sections = navLinks.map(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return null;
    return document.getElementById(href.slice(1));
  }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = '#' + en.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* =========================================================
     13. 滚动揭示
     ========================================================= */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* =========================================================
     14. 系列进度条
     ========================================================= */
  if ('IntersectionObserver' in window) {
    var seriesIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          seriesIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('.series-card').forEach(function (c) { seriesIO.observe(c); });
  }
})();