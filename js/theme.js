/* =========================================================
   BLUE HOUR — theme.js
   主题切换、localStorage 持久化、加载遮罩收尾
   ========================================================= */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ============ 加载遮罩 ============ */
  var loader = document.getElementById('loader');

  function hideLoader() {
    if (loader) loader.classList.add('done');
    var seqs = document.querySelectorAll('.hero .seq');
    for (var i = 0; i < seqs.length; i++) {
      (function (el, delay) {
        setTimeout(function () { el.classList.add('in'); }, delay);
      })(seqs[i], 140 + i * 110);
    }
  }

  if (reduce || document.readyState === 'complete') {
    setTimeout(hideLoader, 200);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hideLoader, 350);
    });
    setTimeout(hideLoader, 2200);
  }

  /* ============ 主题切换 ============ */
  var switchEl = document.querySelector('.theme-switch');
  if (!switchEl) return;

  var pill = switchEl.querySelector('.pill');
  var buttons = Array.prototype.slice.call(switchEl.querySelectorAll('button'));
  var theme = 'night';

  function movePill() {
    if (!pill) return;
    var active = null;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].classList.contains('on')) { active = buttons[i]; break; }
    }
    if (!active) return;
    pill.style.width = active.offsetWidth + 'px';
    pill.style.height = active.offsetHeight + 'px';
    pill.style.left = active.offsetLeft + 'px';
    pill.style.top = active.offsetTop + 'px';
  }

  function setTheme(name, save) {
    if (name !== 'night' && name !== 'sunset') name = 'night';
    theme = name;

    root.setAttribute('data-theme', name);

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('on', buttons[i].dataset.theme === name);
    }

    requestAnimationFrame(movePill);

    if (save !== false) {
      try { localStorage.setItem('bh-theme', name); } catch (e) {}
    }

    try {
      document.dispatchEvent(new CustomEvent('bh:theme', { detail: { theme: name } }));
    } catch (e) {}
  }

  for (var i = 0; i < buttons.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.theme !== theme) setTheme(btn.dataset.theme, true);
      });
    })(buttons[i]);
  }

  setTheme(root.getAttribute('data-theme') || 'night', false);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(movePill).catch(function () {});
  }
  window.addEventListener('resize', movePill);
  window.addEventListener('load', movePill);

  window.BH_THEME = {
    get: function () { return theme; }
  };
})();