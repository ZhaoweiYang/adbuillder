/*
 * TikTok 广告批量导入生成器
 * 列名与取值已对齐用户提供的官方批量上传模板（中文列名 + 英文取值）。
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
  // 选项（取值对齐官方模板 VALIDATION）
  // ------------------------------------------------------------------
  var OBJECTIVES = [
    'Traffic',
    'Conversions',
    'Website conversions',
    'Product sales',
    'Sales',
    'Video views',
    'Reach',
    'Community interaction',
    'Lead generation',
    'App promotion',
    'App Installs',
    'Brand consideration'
  ];
  var BUDGET_MODES = [
    { v: 'Daily', label: '日预算 Daily' },
    { v: 'Lifetime', label: '总预算 Lifetime' },
    { v: 'No Limit', label: '不限 No Limit' }
  ];
  // 优化位置 Optimization Location
  var PROMOTION_TYPES = [
    { v: 'Website', label: '网站 Website' },
    { v: 'App', label: '应用 App' },
    { v: 'TikTok Instant Form', label: '即时表单 Instant Form' },
    { v: 'TikTok Instant Page', label: '即时落地页 Instant Page' },
    { v: 'TikTok direct messages', label: '私信 Direct Messages' }
  ];
  // 网站 Pixel 事件（自由文本，提供常用值）
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
  // 优化目标（自由文本）
  var OPTIMIZATION_GOALS = [
    { v: 'Conversion', label: '转化 Conversion' },
    { v: 'Click', label: '点击 Click' },
    { v: 'Reach', label: '覆盖 Reach' },
    { v: 'Video View', label: '视频播放 Video View' },
    { v: 'Install', label: '安装 Install' },
    { v: 'Value', label: '价值 Value' },
    { v: 'Lead', label: '线索 Lead' }
  ];
  var BILLING_EVENTS = ['oCPM', 'CPM', 'CPC', 'oCPC', 'CPV-6s-focused', 'CPV-15s-focused'];
  var BID_STRATEGIES = [
    { v: 'Lowest Cost', label: '最低成本 Lowest Cost' },
    { v: 'Cost Cap', label: '成本上限 Cost Cap' },
    { v: 'Max Conversion', label: '最大转化 Max Conversion' },
    { v: 'Highest Value', label: '最高价值 Highest Value' },
    { v: 'Target ROAS', label: '目标 ROAS' }
  ];
  var GENDERS = [
    { v: 'All', label: '全部 All' },
    { v: 'Male', label: '男 Male' },
    { v: 'Female', label: '女 Female' }
  ];
  // 广告样式 Ad Format
  var AD_FORMATS = [
    { v: 'Single video', label: '单视频 Single video' },
    { v: 'Single image', label: '单图 Single image' },
    { v: 'Carousel Image', label: '轮播图 Carousel Image' },
    { v: 'TikTok post', label: 'TikTok 帖子 Post' },
    { v: 'Dynamic format', label: '动态创意 Dynamic format' },
    { v: 'Smart+', label: 'Smart+' }
  ];
  // 行为引导文案 Call to action（自由文本，提供官方常用值）
  var CTAS = [
    'Learn more',
    'Shop now',
    'Sign up',
    'Download',
    'Contact us',
    'Apply now',
    'Book now',
    'Order now',
    'Subscribe',
    'Watch now',
    'Play game',
    'Read more',
    'Install',
    'Get quote',
    'View now',
    'Visit store',
    'Interested',
    'Listen now'
  ];
  // 广告发布身份类型 Identity Type
  var IDENTITY_TYPES = [
    'TikTok Account',
    'TikTok Business Account',
    'Custom Identity',
    'TTBC Authorized Post',
    'TikTok Shop'
  ];
  var AGE_GROUPS = [
    { v: '13-17', label: '13-17' },
    { v: '18-24', label: '18-24' },
    { v: '25-34', label: '25-34' },
    { v: '35-44', label: '35-44' },
    { v: '45-54', label: '45-54' },
    { v: '55+', label: '55+' }
  ];
  var PLACEMENTS = [
    { v: 'TikTok', label: 'TikTok' },
    { v: 'Pangle', label: 'Pangle' },
    { v: 'Global App Bundle', label: 'Global App Bundle' }
  ];

  // ------------------------------------------------------------------
  // 列定义（唯一事实来源）：表头为官方模板中文列名
  // ------------------------------------------------------------------
  var SCHEMA = [
    // 推广系列
    ['系列名称', function () { return val('ttCampaignName'); }],
    ['推广系列状态', function () { return 'Off'; }],
    ['推广目标', function () { return val('ttObjective'); }],
    ['推广系列预算优化', function () { return val('ttCbo'); }],
    ['推广系列预算类型', function () { return cboOn() ? val('ttCampaignBudgetMode') : ''; }],
    ['推广系列预算金额', function () { return cboOn() ? val('ttCampaignBudget') : ''; }],

    // 广告组
    ['广告组名称', function () { return val('ttAdGroupName'); }],
    ['广告组状态', function () { return 'Off'; }],
    ['互动类型', function () { return 'TikTok Account'; }],
    ['版位类型', function () { return val('ttPlacementMode') === 'manual' ? 'Select' : 'Automatic'; }],
    ['版位', function () { return placement('ttPlacements'); }],
    ['优化位置', function () { return val('ttPromotionType'); }],
    ['TikTok Pixel ID', function () { return val('ttPixelId'); }],
    ['网站 Pixel 事件', function () { return val('ttOptEvent'); }],
    ['受众定向类型', function () { return 'custom targeting'; }],
    ['自定义受众 ', function () { return val('ttCustomAudiences'); }], // 模板该列名带末尾空格
    ['排除受众 ID', function () { return val('ttExcludedAudiences'); }],
    ['地域', function () { return val('ttLocation'); }],
    ['性别', function () { return val('ttGender'); }],
    ['年龄', function () { return getChecked('ttAgeGroups'); }],
    ['语言', function () { return val('ttLanguages'); }],
    ['兴趣分类', function () { return val('ttInterests'); }],
    ['视频互动', function () { return val('ttBehaviors'); }],
    ['广告组预算类型', function () { return cboOn() ? '' : val('ttAdGroupBudgetMode'); }],
    ['广告组预算金额', function () { return cboOn() ? '' : val('ttAdGroupBudget'); }],
    ['开始时间', function () { return val('ttStart'); }],
    ['结束时间', function () { return val('ttEnd'); }],
    ['分时段', function () { return val('ttDayparting'); }],
    ['优化目标', function () { return val('ttOptGoal'); }],
    ['计费方式', function () { return val('ttBillingEvent'); }],
    ['竞价策略', function () { return val('ttBidStrategy'); }],
    ['出价', function () { return val('ttBid'); }],

    // 广告
    ['广告名称', function (ad) { return ad('adName'); }],
    ['广告状态', function () { return 'Off'; }],
    ['广告发布身份类型', function () { return val('ttIdentityType'); }],
    ['广告发布身份ID', function () { return val('ttIdentity'); }],
    ['广告样式', function (ad) { return ad('adFormat'); }],
    ['图片名称', function (ad) { return ad('imageIds'); }],
    ['视频名称', function (ad) { return ad('videoId'); }],
    ['广告文案', function (ad) { return ad('adText'); }],
    ['行动引导文案类型', function () { return 'Standard'; }],
    ['行为引导文案', function (ad) { return ad('cta'); }],
    ['网页类型', function () { return 'Custom link'; }],
    ['落地页链接', function (ad) { return ad('url'); }]
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

  // CBO 开启 => 预算在系列层级；关闭 => 预算在广告组层级
  function cboOn() {
    return val('ttCbo') === 'On';
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
      field('广告名称 *', '<input type="text" data-f="adName" placeholder="春季新品-广告1">') +
      field('广告样式 *', selectHtml('adFormat', AD_FORMATS, 'Single video')) +
      field('行为引导文案 CTA', selectHtml('cta', CTAS, 'Learn more')) +
      field('视频名称（单视频用）', '<input type="text" data-f="videoId" placeholder="素材库中的视频名称">') +
      field('图片名称（单图/轮播用）', '<input type="text" data-f="imageIds" placeholder="多个用逗号分隔">') +
      field('广告文案 Ad Text', '<textarea data-f="adText" rows="2" placeholder="广告文案..."></textarea>', true) +
      field('落地页链接 URL', '<input type="url" data-f="url" placeholder="https://example.com">') +
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
    return pruneEmptyColumns(rows);
  }

  // 删除所有数据行都为空的列，避免未填写字段产生无谓警告
  function pruneEmptyColumns(rows) {
    if (rows.length < 2) return rows;
    var header = rows[0];
    var keep = [];
    for (var c = 0; c < header.length; c++) {
      var has = false;
      for (var r = 1; r < rows.length; r++) {
        if (rows[r][c] !== undefined && rows[r][c] !== '') {
          has = true;
          break;
        }
      }
      if (has) keep.push(c);
    }
    return rows.map(function (row) {
      return keep.map(function (c) {
        return row[c];
      });
    });
  }

  function validate() {
    var errors = [];
    if (!val('ttCampaignName')) errors.push('请填写广告系列名称');
    if (!val('ttAdGroupName')) errors.push('请填写广告组名称');
    if (!val('ttLocation')) errors.push('请填写投放地区 地域');
    if (val('ttOptGoal') === 'Conversion' && !val('ttPixelId')) {
      errors.push('优化目标为「转化」时，请填写 TikTok Pixel ID');
    }
    if (val('ttPlacementMode') === 'manual' && !getChecked('ttPlacements')) {
      errors.push('手动版位需至少勾选一个版位');
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
      if (fmt === 'Single video' && !g('videoId')) {
        errors.push(label + '单视频广告需填写「视频名称」');
      } else if ((fmt === 'Single image' || fmt === 'Carousel Image') && !g('imageIds')) {
        errors.push(label + '图片/轮播广告需填写「图片名称」');
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
      var bytes = MiniXLSX.build(rows, '模板');
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
    if (!adsContainer) return;

    fillSelect($('ttObjective'), OBJECTIVES);
    fillSelect($('ttCampaignBudgetMode'), BUDGET_MODES);
    fillSelect($('ttPromotionType'), PROMOTION_TYPES);
    fillSelect($('ttOptEvent'), OPTIMIZATION_EVENTS);
    fillSelect($('ttOptGoal'), OPTIMIZATION_GOALS);
    fillSelect($('ttBillingEvent'), BILLING_EVENTS);
    fillSelect($('ttBidStrategy'), BID_STRATEGIES);
    fillSelect($('ttGender'), GENDERS);
    fillSelect($('ttAdGroupBudgetMode'), BUDGET_MODES);
    fillSelect($('ttIdentityType'), IDENTITY_TYPES);

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
