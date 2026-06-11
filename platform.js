/*
 * 平台切换：在 Facebook / TikTok 表单之间切换显示。
 */
(function () {
  'use strict';

  function activate(platform) {
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-platform') === platform;
      tab.classList.toggle('active', on);
    });
    var fb = document.getElementById('platform-facebook');
    var tt = document.getElementById('platform-tiktok');
    if (fb) fb.hidden = platform !== 'facebook';
    if (tt) tt.hidden = platform !== 'tiktok';
    document.body.setAttribute('data-platform', platform);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        activate(tab.getAttribute('data-platform'));
      });
    });
    activate('facebook');
  });
})();
