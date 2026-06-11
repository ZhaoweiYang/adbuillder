/*
 * TikTok 广告批量导入生成器（与 Facebook 模块结构一致，独立运行）
 *
 * 注意：TikTok Ads Manager 的批量上传通常要求使用其后台下载的官方模板，
 * 列名/校验较严格。本模块为“尽力而为”的通用导出，字段值格式可能需按
 * 实际导入报错或官方模板微调。
 */
(function () {
  'use strict';

  var $ = function (id) {
    return document.getElementById(id);
  };
  function val(id) {
    var el = $(id);
    return el ? el.value.trim() : '';
  }

  // ------------------------------------------------------------------
  // 选项
  // ------------------------------------------------------------------
  var OBJECTIVES = [
    'Reach',
    'Traffic',
    'Video Views',
    'Community Interaction',
    'Product Sales',
    'Website Conversions',
    'Lead Generation',
    'App Promotion'
  ];
  var BUDGET_MODES = [
    { v: 'Daily', label: '日预算 Daily' },
    { v: 'Lifetime', label: '总预算 Lifetime' },
    { v: 'No Limit', label: '不限 No Limit' }
  ];
  var PROMOTION_TYPES = [
    { v: 'Website', label: '网站 Website' },
    { v: 'App', label: '应用 App' },
    { v: 'Lead Generation', label: '线索 Lead Generation' },
    { v: 'Product Sales', label: '商品销售 Product Sales' },
    { v: 'Follower', label: '涨粉 Follower' }
  ];
  // 转化/优化事件
  var OPTIMIZATION_EVENTS = [
    '',
    'Complete Payment',
    'Add to Cart',
    'Add Payment Info',
    'Place an Order',
    'Form',
    'Button',
    'Complete Registration',
    'View Content',
    'Add to Wishlist',
    'Search',
    'Subscribe',
    'Download',
    'Contact'
  ];
  var OPTIMIZATION_GOALS = [
    { v: 'Conversion', label: '转化 Conversion' },
    { v: 'Click', label: '点击 Click' },
    { v: 'Reach', label: '覆盖 Reach' },
    { v: 'Video View', label: '视频播放 Video View' },
    { v: 'Install', label: '安装 Install' },
    { v: 'Value', label: '价值 Value' },
    { v: 'Lead', label: '线索 Lead' }
  ];
  var BILLING_EVENTS = ['oCPM', 'CPC', 'CPM', 'CPV'];
  var BID_STRATEGIES = [
    { v: 'Lowest Cost', label: '最低成本（自动出价）' },
    { v: 'Cost Cap', label: '成本上限 Cost Cap' },
    { v: 'Bid Cap', label: '竞价上限 Bid Cap' }
  ];
  var GENDERS = [
    { v: 'Unlimited', label: '不限 Unlimited' },
    { v: 'Male', label: '男 Male' },
    { v: 'Female', label: '女 Female' }
  ];
  var AD_FORMATS = [
    { v: 'Single Video', label: '单视频 Single Video' },
    { v: 'Single Image', label: '单图 Single Image' },
    { v: 'Carousel', label: '轮播 Carousel' }
  ];
  var CTAS = [
    'Learn More',
    'Shop Now',
    'Sign Up',
    'Download',
    'Contact Us',
    'Apply Now',
    'Book Now',
    'Watch Now',
    'Order Now',
    'Get Quote',
    'Subscribe',
    'Play Game',
    'Read More'
  ];

  // 年龄段（多选）
  var AGE_GROUPS = [
    { v: '13-17', label: '13-17' },
    { v: '18-24', label: '18-24' },
    { v: '25-34', label: '25-34' },
    { v: '35-44', label: '35-44' },
    { v: '45-54', label: '45-54' },
    { v: '55+', label: '55+' }
  ];
  // 版位（手动）
  var PLACEMENTS = [
    { v: 'TikTok', label: 'TikTok' },
    { v: 'Pangle', label: 'Pangle' },
    { v: 'Global App Bundle', label: 'Global App Bundle' }
  ];

  // ------------------------------------------------------------------
  // 列定义（唯一事实来源）：[表头, 取值函数(ad)]
  // ------------------------------------------------------------------
  var SCHEMA = [
    // 广告系列
    ['Campaign Name', function () { return val('ttCampaignName'); }],
    ['Objective Type', function () { return val('ttObjective'); }],
    ['Campaign Budget Optimization', function () { return val('ttCbo'); }],
    ['Campaign Budget Mode', function () { return val('ttCampaignBudgetMode'); }],
    ['Campaign Budget', function () { return val('ttCampaignBudget'); }],

    // 广告组
    ['Ad Group Name', function () { return val('ttAdGroupName'); }],
    ['Promotion Type', function () { return val('ttPromotionType'); }],
    ['Pixel ID', function () { return val('ttPixelId'); }],
    ['Optimization Event', function () { return val('ttOptEvent'); }],
    ['Placement Type', function () { return val('ttPlacementMode') === 'manual' ? 'Select Placement' : 'Automatic Placement'; }],
    ['Placement', function () { return placement('ttPlacements'); }],
    ['Location', function () { return val('ttLocation'); }],
    ['Gender', function () { return val('ttGender'); }],
    ['Age Groups', function () { return getChecked('ttAgeGroups'); }],
    ['Languages', function () { return val('ttLanguages'); }],
    ['Interest Categories', function () { return val('ttInterests'); }],
    ['Behaviors', function () { return val('ttBehaviors'); }],
    ['Custom Audiences', function () { return val('ttCustomAudiences'); }],
    ['Excluded Audiences', function () { return val('ttExcludedAudiences'); }],
    ['Budget Mode', function () { return val('ttAdGroupBudgetMode'); }],
    ['Budget', function () { return val('ttAdGroupBudget'); }],
    ['Schedule Start Time', function () { return val('ttStart'); }],
    ['Schedule End Time', function () { return val('ttEnd'); }],
    ['Dayparting', function () { return val('ttDayparting'); }],
    ['Optimization Goal', function () { return val('ttOptGoal'); }],
    ['Bid Strategy', function () { return val('ttBidStrategy'); }],
    ['Bid', function () { return val('ttBid'); }],
    ['Billing Event', function () { return val('ttBillingEvent'); }],

    // 广告
    ['Ad Name', function (ad) { return ad('adName'); }],
    ['Identity Name', function () { return val('ttIdentity'); }],
    ['Ad Format', function (ad) { return ad('adFormat'); }],
    ['Video ID', function (ad) { return ad('videoId'); }],
    ['Image IDs', function (ad) { return ad('imageIds'); }],
    ['Ad Text', function (ad) { return ad('adText'); }],
    ['Call To Action', function (ad) { return ad('cta'); }],
    ['Display Name', function (ad) { return ad('displayName'); }],
    ['Landing Page URL', function (ad) { return ad('url'); }]
  ];

  // ------------------------------------------------------------------
  // UI 辅助
  // ------------------------------------------------------------------
  function fillSelect(el, items) {
    if (!el) return;
    items.forEach(function (item) {
      var opt = document.createElement('option');
      if (typeof item === 'string') {
        opt.value = item;
        opt.textContent = item === '' ? '（不设置）' : item;
      } else {
        opt.value = item.v;
        opt.textContent = item.label;
      }
      el.appendChild(opt);
    });
  }

  function renderChecks(container, items) {
    if (!container) return;
    items.forEach(function (item) {
      var label = document.createElement('label');
      label.className = 'check';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.value = item.v;
      var span = document.createElement('span');
      span.textContent = item.label;
      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });
  }

  function getChecked(containerId) {
    var container = $(containerId);
    if (!container) return '';
    var checked = container.querySelectorAll('input[type=checkbox]:checked');
    return Array.prototype.map
      .call(checked, function (c) {
        return c.value;
      })
      .join(', ');
  }

  function placement(containerId) {
    if (val('ttPlacementMode') !== 'manual') return '';
    return getChecked(containerId);
  }

  // ------------------------------------------------------------------
  // 广告条目
  // ------------------------------------------------------------------
  var adsContainer;

  function field(label, inner, full) {
    return (
      '<label class="field' + (full ? ' full' : '') + '"><span>' + label + '</span>' + inner + '</label>'
    );
  }
  function selectHtml(name, items, def) {
    var html = '<select data-f="' + name + '">';
    items.forEach(function (i) {
      var v = typeof i === 'string' ? i : i.v;
      var text = typeof i === 'string' ? i : i.label;
      html += '<option value="' + v + '"' + (v === def ? ' selected' : '') + '>' + text + '</option>';
    });
    html += '</select>';
    return html;
  }

  function adTemplate() {
    return (
      '<div class="ad-card" data-ad>' +
      '<div class="ad-card-head">' +
      '<span class="ad-card-title">广告 #<span data-adnum></span></span>' +
      '<button type="button" class="btn-remove" data-remove>删除</button>' +
      '</div>' +
      '<div class="grid">' +
      field('广告名称 Ad Name *', '<input type="text" data-f="adName" placeholder="春季新品-广告1">') +
      field('广告形式 Ad Format *', selectHtml('adFormat', AD_FORMATS, 'Single Video')) +
      field('行动号召 Call To Action', selectHtml('cta', CTAS, 'Learn More')) +
      field('视频 ID Video ID（单视频用）', '<input type="text" data-f="videoId" placeholder="账户素材库中的视频 ID">') +
      field('图片 ID Image IDs（单图/轮播用）', '<input type="text" data-f="imageIds" placeholder="多个用逗号分隔">') +
      field('广告文案 Ad Text', '<textarea data-f="adText" rows="2" placeholder="广告文案..."></textarea>', true) +
      field('落地页 URL Landing Page', '<input type="url" data-f="url" placeholder="https://example.com">') +
      field('显示名称 Display Name', '<input type="text" data-f="displayName" placeholder="品牌/应用名">') +
      '</div>' +
      '</div>'
    );
  }

  function addAd() {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = adTemplate();
    var node = wrapper.firstChild;
    adsContainer.appendChild(node);
    refreshAdNumbers();
    node.querySelector('[data-remove]').addEventListener('click', function () {
      node.remove();
      refreshAdNumbers();
    });
  }
  function refreshAdNumbers() {
    var cards = adsContainer.querySelectorAll('[data-ad]');
    cards.forEach(function (card, i) {
      card.querySelector('[data-adnum]').textContent = i + 1;
      card.querySelector('[data-remove]').style.display = cards.length > 1 ? '' : 'none';
    });
  }

  // ------------------------------------------------------------------
  // 收集 / 校验 / 生成
  // ------------------------------------------------------------------
  function collectRows() {
    var header = SCHEMA.map(function (col) {
      return col[0];
    });
    var rows = [header];
    var adCards = adsContainer.querySelectorAll('[data-ad]');
    adCards.forEach(function (card) {
      function ad(name) {
        var el = card.querySelector('[data-f="' + name + '"]');
        return el ? el.value.trim() : '';
      }
      var row = SCHEMA.map(function (col) {
        return col[1](ad);
      });
      if (row.length !== header.length) {
        throw new Error('列数不一致：表头 ' + header.length + ' / 数据 ' + row.length);
      }
      rows.push(row);
    });
    return rows;
  }

  function validate() {
    var errors = [];
    if (!val('ttCampaignName')) errors.push('请填写广告系列名称');
    if (!val('ttAdGroupName')) errors.push('请填写广告组名称');
    if (!val('ttLocation')) errors.push('请填写投放地区 Location');
    if (val('ttOptGoal') === 'Conversion' && !val('ttPixelId')) {
      errors.push('优化目标为「转化」时，请填写像素 ID');
    }
    if (val('ttPlacementMode') === 'manual' && !getChecked('ttPlacements')) {
      errors.push('手动版位需至少勾选一个版位 Placement');
    }
    var adCards = adsContainer.querySelectorAll('[data-ad]');
    if (adCards.length === 0) errors.push('至少需要一个广告');
    adCards.forEach(function (card, i) {
      function g(name) {
        var el = card.querySelector('[data-f="' + name + '"]');
        return el ? el.value.trim() : '';
      }
      var label = '广告 #' + (i + 1) + '：';
      if (!g('adName')) errors.push(label + '请填写广告名称');
      var fmt = g('adFormat');
      if (fmt === 'Single Video' && !g('videoId')) {
        errors.push(label + '单视频广告需填写「视频 ID」');
      } else if ((fmt === 'Single Image' || fmt === 'Carousel') && !g('imageIds')) {
        errors.push(label + '图片/轮播广告需填写「图片 ID」');
      }
    });
    return errors;
  }

  function download(bytes, filename) {
    var blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function showMessage(text, type) {
    var box = $('ttMessage');
    box.textContent = text;
    box.className = 'message ' + (type || '');
    box.style.display = text ? 'block' : 'none';
    if (text) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function generate() {
    showMessage('', '');
    var errors = validate();
    if (errors.length) {
      showMessage('⚠️ ' + errors.join('；'), 'error');
      return;
    }
    try {
      var rows = collectRows();
      var bytes = MiniXLSX.build(rows, 'TikTok Ads');
      var name = (val('ttCampaignName') || 'tiktok-ads').replace(/[\\/:*?"<>|]/g, '_');
      download(bytes, name + '.xlsx');
      showMessage('✅ 已生成 ' + (rows.length - 1) + ' 个广告（共 ' + rows[0].length + ' 列），文件已开始下载。', 'success');
    } catch (e) {
      showMessage('生成失败：' + e.message, 'error');
      console.error(e);
    }
  }

  function preview() {
    var rows = collectRows();
    var table = $('ttPreviewTable');
    table.innerHTML = '';
    rows.slice(0, 6).forEach(function (row, ri) {
      var tr = document.createElement('tr');
      row.forEach(function (cell) {
        var td = document.createElement(ri === 0 ? 'th' : 'td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    $('ttPreviewWrap').style.display = 'block';
    $('ttPreviewWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ------------------------------------------------------------------
  // 初始化
  // ------------------------------------------------------------------
  function togglePlacementMode() {
    $('ttManualPlacements').style.display = val('ttPlacementMode') === 'manual' ? '' : 'none';
  }

  function init() {
    adsContainer = $('ttAds');
    if (!adsContainer) return; // TikTok 区块不存在则跳过

    fillSelect($('ttObjective'), OBJECTIVES);
    fillSelect($('ttCampaignBudgetMode'), BUDGET_MODES);
    fillSelect($('ttPromotionType'), PROMOTION_TYPES);
    fillSelect($('ttOptEvent'), OPTIMIZATION_EVENTS);
    fillSelect($('ttOptGoal'), OPTIMIZATION_GOALS);
    fillSelect($('ttBillingEvent'), BILLING_EVENTS);
    fillSelect($('ttBidStrategy'), BID_STRATEGIES);
    fillSelect($('ttGender'), GENDERS);
    fillSelect($('ttAdGroupBudgetMode'), BUDGET_MODES);

    renderChecks($('ttAgeGroups'), AGE_GROUPS);
    renderChecks($('ttPlacements'), PLACEMENTS);

    $('ttPlacementMode').addEventListener('change', togglePlacementMode);
    togglePlacementMode();

    $('ttAddAd').addEventListener('click', addAd);
    $('ttGenerate').addEventListener('click', generate);
    $('ttPreview').addEventListener('click', preview);

    addAd();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
