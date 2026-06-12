/*
 * 模板功能：把当前表单设置保存为命名模板（localStorage），
 * 可一键套用、删除，并支持设为默认（打开页面自动填充）。
 * Facebook 与 TikTok 各自独立。
 */
(function () {
  'use strict';

  var STORE_KEY = 'adTemplates_v1';

  var PLATFORMS = {
    fb: {
      container: 'platform-facebook',
      adsContainer: 'ads',
      addBtn: 'addAd',
      bar: 'fbTemplateBar'
    },
    tt: {
      container: 'platform-tiktok',
      adsContainer: 'ttAds',
      addBtn: 'ttAddAd',
      bar: 'ttTemplateBar'
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  // ---------- 存储 ----------
  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  // ---------- 序列化当前表单 ----------
  function snapshot(cfg) {
    var root = $(cfg.container);
    var data = { fields: {}, checks: {}, ads: [] };

    // 所有带 id 的 input/select/textarea（广告卡片内的没有 id，单独处理）
    root.querySelectorAll('input[id], select[id], textarea[id]').forEach(function (el) {
      if (el.type === 'checkbox') return;
      data.fields[el.id] = el.value;
    });

    // 复选框组（.checks 容器，按容器 id 记录勾选值）
    root.querySelectorAll('.checks[id]').forEach(function (box) {
      var vals = [];
      box.querySelectorAll('input[type=checkbox]:checked').forEach(function (c) {
        vals.push(c.value);
      });
      data.checks[box.id] = vals;
    });

    // 广告卡片（data-f 字段）
    root.querySelectorAll('#' + cfg.adsContainer + ' [data-ad]').forEach(function (card) {
      var ad = {};
      card.querySelectorAll('[data-f]').forEach(function (el) {
        ad[el.getAttribute('data-f')] = el.value;
      });
      data.ads.push(ad);
    });

    return data;
  }

  // ---------- 套用模板 ----------
  function apply(cfg, data) {
    var root = $(cfg.container);

    Object.keys(data.fields || {}).forEach(function (id) {
      var el = $(id);
      if (el) el.value = data.fields[id];
    });

    Object.keys(data.checks || {}).forEach(function (boxId) {
      var box = $(boxId);
      if (!box) return;
      var vals = data.checks[boxId];
      box.querySelectorAll('input[type=checkbox]').forEach(function (c) {
        c.checked = vals.indexOf(c.value) !== -1;
      });
    });

    // 让依赖 change 的 UI（如手动版位区域显隐）刷新
    root.querySelectorAll('select[id]').forEach(function (sel) {
      sel.dispatchEvent(new Event('change'));
    });

    // 广告卡片：调整数量后逐一填充
    var ads = data.ads || [];
    if (ads.length > 0) {
      var container = $(cfg.adsContainer);
      var cards = container.querySelectorAll('[data-ad]');
      // 删多余
      for (var i = cards.length - 1; i >= ads.length; i--) {
        cards[i].remove();
      }
      // 补不足
      cards = container.querySelectorAll('[data-ad]');
      for (var j = cards.length; j < ads.length; j++) {
        $(cfg.addBtn).click();
      }
      cards = container.querySelectorAll('[data-ad]');
      cards.forEach(function (card, idx) {
        var ad = ads[idx] || {};
        card.querySelectorAll('[data-f]').forEach(function (el) {
          var name = el.getAttribute('data-f');
          if (name in ad) el.value = ad[name];
        });
      });
    }
  }

  // ---------- UI ----------
  function refreshSelect(key, cfg) {
    var store = loadStore();
    var tpls = (store[key] && store[key].templates) || {};
    var defName = store[key] && store[key].defaultName;
    var sel = $(cfg.bar + 'Select');
    sel.innerHTML = '';
    var names = Object.keys(tpls);
    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = names.length ? '— 选择模板 —' : '（暂无模板，先保存一个）';
    sel.appendChild(opt0);
    names.forEach(function (n) {
      var opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n + (n === defName ? '（默认）' : '');
      sel.appendChild(opt);
    });
  }

  function notify(cfg, text) {
    var el = $(cfg.bar + 'Msg');
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(function () {
      el.style.opacity = '0';
    }, 2500);
  }

  function buildBar(key, cfg) {
    var host = $(cfg.bar);
    if (!host) return;
    host.innerHTML =
      '<span class="tpl-label">📋 模板</span>' +
      '<select id="' + cfg.bar + 'Select"></select>' +
      '<button type="button" class="btn-secondary tpl-btn" id="' + cfg.bar + 'Apply">套用</button>' +
      '<button type="button" class="btn-secondary tpl-btn" id="' + cfg.bar + 'Save">保存当前为模板</button>' +
      '<button type="button" class="btn-secondary tpl-btn" id="' + cfg.bar + 'Default">设为默认</button>' +
      '<button type="button" class="btn-remove tpl-btn" id="' + cfg.bar + 'Delete">删除</button>' +
      '<span class="tpl-msg" id="' + cfg.bar + 'Msg"></span>';

    refreshSelect(key, cfg);

    $(cfg.bar + 'Save').addEventListener('click', function () {
      var name = prompt('模板名称：', '');
      if (!name) return;
      name = name.trim();
      if (!name) return;
      var store = loadStore();
      store[key] = store[key] || { templates: {} };
      store[key].templates[name] = snapshot(cfg);
      saveStore(store);
      refreshSelect(key, cfg);
      $(cfg.bar + 'Select').value = name;
      notify(cfg, '✅ 已保存「' + name + '」');
    });

    $(cfg.bar + 'Apply').addEventListener('click', function () {
      var name = $(cfg.bar + 'Select').value;
      if (!name) return notify(cfg, '请先选择一个模板');
      var store = loadStore();
      var tpl = store[key] && store[key].templates && store[key].templates[name];
      if (!tpl) return notify(cfg, '模板不存在');
      apply(cfg, tpl);
      notify(cfg, '✅ 已套用「' + name + '」');
    });

    $(cfg.bar + 'Default').addEventListener('click', function () {
      var name = $(cfg.bar + 'Select').value;
      if (!name) return notify(cfg, '请先选择一个模板');
      var store = loadStore();
      if (!store[key] || !store[key].templates[name]) return notify(cfg, '模板不存在');
      // 再点一次已是默认的模板则取消默认
      store[key].defaultName = store[key].defaultName === name ? '' : name;
      saveStore(store);
      refreshSelect(key, cfg);
      $(cfg.bar + 'Select').value = name;
      notify(cfg, store[key].defaultName ? '✅ 「' + name + '」已设为默认，打开页面自动填充' : '已取消默认');
    });

    $(cfg.bar + 'Delete').addEventListener('click', function () {
      var name = $(cfg.bar + 'Select').value;
      if (!name) return notify(cfg, '请先选择一个模板');
      if (!confirm('确定删除模板「' + name + '」？')) return;
      var store = loadStore();
      if (store[key]) {
        delete store[key].templates[name];
        if (store[key].defaultName === name) store[key].defaultName = '';
        saveStore(store);
      }
      refreshSelect(key, cfg);
      notify(cfg, '已删除「' + name + '」');
    });
  }

  function applyDefault(key, cfg) {
    var store = loadStore();
    var defName = store[key] && store[key].defaultName;
    if (!defName) return;
    var tpl = store[key].templates && store[key].templates[defName];
    if (tpl) {
      apply(cfg, tpl);
      $(cfg.bar + 'Select').value = defName;
      notify(cfg, '已自动套用默认模板「' + defName + '」');
    }
  }

  function init() {
    Object.keys(PLATFORMS).forEach(function (key) {
      var cfg = PLATFORMS[key];
      buildBar(key, cfg);
      applyDefault(key, cfg);
    });
  }

  // 在 app.js / tiktok.js 初始化之后运行（依赖广告卡片与下拉已就绪）
  document.addEventListener('DOMContentLoaded', init);
})();
