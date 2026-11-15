/* =========================================================
   BLUE HOUR — cursor.js
   已停用自定义光标，改回系统默认光标
   保留文件是为了兼容旧 HTML 引用
   ========================================================= */

(function () {
  'use strict';

  // 强制系统光标（覆盖 CSS 里的 cursor: none）
  document.documentElement.style.cursor = 'auto';
  document.body.style.cursor = 'auto';

  // 如果 HTML 里还保留着自定义光标元素，直接隐藏
  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');
  var aura = document.getElementById('cursorAura');

  if (dot) dot.style.display = 'none';
  if (ring) ring.style.display = 'none';
  if (aura) aura.style.display = 'none';
})();