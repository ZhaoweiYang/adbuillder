/*
 * 应用逻辑：收集表单 -> 组织成 Facebook 批量导入格式的二维数组 -> 生成 xlsx 下载
 *
 * 关键设计：用「列定义 + 取值函数」(SCHEMA) 作为唯一事实来源，
 * 表头与每行数据都由同一份 SCHEMA 生成，从根本上杜绝列错位。
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
  // 选项数据
  // ------------------------------------------------------------------
  // Campaign Objective：导入界面要求“显示名称”而非 API 枚举
  var OBJECTIVES = [
    'Outcome Sales',
    'Outcome Leads',
    'Outcome Engagement',
    'Outcome Awareness',
    'Traffic',
    'App Promotion'
  ];
  var SPECIAL_AD_CATEGORIES = [
    'NONE',
    'HOUSING',
    'EMPLOYMENT',
    'CREDIT',
    'ISSUES_ELECTIONS_POLITICS',
    'ONLINE_GAMBLING_AND_GAMING',
    'FINANCIAL_PRODUCTS_SERVICES'
  ];
  var BID_STRATEGIES = [
    { v: '', label: '（不设置，使用账户默认）' },
    { v: 'LOWEST_COST_WITHOUT_CAP', label: '最高数量 / 最低成本（自动出价）' },
    { v: 'COST_CAP', label: '成本上限 Cost Cap' },
    { v: 'LOWEST_COST_WITH_BID_CAP', label: '竞价上限 Bid Cap' },
    { v: 'LOWEST_COST_WITH_MIN_ROAS', label: '最低 ROAS' }
  ];
  var CREATIVE_TYPES = [
    'Link Page Post Ad',
    'Photo Page Post Ad',
    'Video Page Post Ad',
    'Text Page Post Ad'
  ];
  var OPTIMIZATION_GOALS = [
    'OFFSITE_CONVERSIONS',
    'LINK_CLICKS',
    'LANDING_PAGE_VIEWS',
    'IMPRESSIONS',
    'REACH',
    'POST_ENGAGEMENT',
    'THRUPLAY',
    'VALUE',
    'LEAD_GENERATION',
    'QUALITY_CALL'
  ];
  var BILLING_EVENTS = ['IMPRESSIONS', 'LINK_CLICKS', 'THRUPLAY'];
  // 转化位置 / 落地位置
  var DESTINATION_TYPES = [
    { v: 'WEBSITE', label: '网站 Website' },
    { v: 'APP', label: '应用 App' },
    { v: 'MESSENGER', label: 'Messenger' },
    { v: 'WHATSAPP', label: 'WhatsApp' },
    { v: 'PHONE_CALL', label: '电话 Phone Call' },
    { v: 'ON_AD', label: '即时表单 On Ad' }
  ];
  var GENDERS = [
    { v: 'All', label: '全部' },
    { v: 'Men', label: '男 Men' },
    { v: 'Women', label: '女 Women' }
  ];
  var CTAS = [
    'LEARN_MORE',
    'SHOP_NOW',
    'SIGN_UP',
    'SUBSCRIBE',
    'DOWNLOAD',
    'GET_OFFER',
    'BOOK_TRAVEL',
    'CONTACT_US',
    'SEND_MESSAGE',
    'APPLY_NOW',
    'GET_QUOTE',
    'ORDER_NOW',
    'NO_BUTTON'
  ];

  // 版位（手动版位时勾选；值采用 Facebook 定向规格的内部 token）
  var DEVICE_PLATFORMS = [
    { v: 'mobile', label: '移动设备 Mobile' },
    { v: 'desktop', label: '桌面 Desktop' }
  ];
  var PUBLISHER_PLATFORMS = [
    { v: 'facebook', label: 'Facebook' },
    { v: 'instagram', label: 'Instagram' },
    { v: 'audience_network', label: 'Audience Network' },
    { v: 'messenger', label: 'Messenger' }
  ];
  var FB_POSITIONS = [
    { v: 'feed', label: '信息流 Feed' },
    { v: 'profile_feed', label: '主页信息流' },
    { v: 'marketplace', label: 'Marketplace' },
    { v: 'video_feeds', label: '视频信息流' },
    { v: 'right_hand_column', label: '右边栏' },
    { v: 'story', label: '快拍 Stories' },
    { v: 'facebook_reels', label: 'Reels' },
    { v: 'instream_video', label: '插播视频' },
    { v: 'search', label: '搜索结果' }
  ];
  var IG_POSITIONS = [
    { v: 'stream', label: '信息流 Feed' },
    { v: 'story', label: '快拍 Stories' },
    { v: 'explore', label: '探索 Explore' },
    { v: 'explore_home', label: '探索主页' },
    { v: 'reels', label: 'Reels' },
    { v: 'profile_feed', label: '主页信息流' },
    { v: 'ig_search', label: '搜索' }
  ];
  var AN_POSITIONS = [
    { v: 'classic', label: '原生/横幅/插屏' },
    { v: 'rewarded_video', label: '激励视频' }
  ];
  var MSGR_POSITIONS = [
    { v: 'messenger_home', label: '收件箱 Inbox' },
    { v: 'story', label: '快拍 Stories' },
    { v: 'sponsored_messages', label: '赞助消息' }
  ];

  // ------------------------------------------------------------------
  // 列定义（唯一事实来源）：[表头, 取值函数(ad)]
  // ad(name) 用于读取“广告”级字段；其余读取系列/广告组级字段。
  // ------------------------------------------------------------------
  var SCHEMA = [
    // ---- 广告系列 Campaign ----
    ['Campaign Name', function () { return val('campaignName'); }],
    ['Campaign Status', function () { return val('campaignStatus'); }],
    ['Campaign Objective', function () { return val('campaignObjective'); }],
    ['Buying Type', function () { return 'AUCTION'; }],
    ['Campaign Bid Strategy', function () { return val('campaignBidStrategy'); }],
    ['Special Ad Categories', function () { return val('specialAdCategories'); }],
    ['Campaign Daily Budget', function () { return val('campaignDailyBudget'); }],
    ['Campaign Lifetime Budget', function () { return val('campaignLifetimeBudget'); }],

    // ---- 广告组 Ad Set ----
    ['Ad Set Name', function () { return val('adSetName'); }],
    ['Ad Set Run Status', function () { return val('adSetStatus'); }],
    ['Ad Set Daily Budget', function () { return val('adSetDailyBudget'); }],
    ['Ad Set Lifetime Budget', function () { return val('adSetLifetimeBudget'); }],
    ['Ad Set Time Start', function () { return val('adSetTimeStart'); }],
    ['Ad Set Time Stop', function () { return val('adSetTimeStop'); }],
    ['Destination Type', function () { return val('destinationType'); }],
    ['Optimization Goal', function () { return val('optimizationGoal'); }],
    ['Billing Event', function () { return val('billingEvent'); }],
    ['Bid Amount', function () { return val('bidAmount'); }],
    // 像素与转化
    ['Conversion Tracking Pixels', function () { return val('pixelId'); }],
    ['Application ID', function () { return val('applicationId'); }],
    ['Product Set ID', function () { return val('productSetId'); }],
    // 定向 - 地理
    ['Countries', function () { return val('countries'); }],
    ['Cities', function () { return val('cities'); }],
    ['Regions', function () { return val('regions'); }],
    ['Zip', function () { return val('zip'); }],
    ['Location Types', function () { return val('locationTypes'); }],
    // 定向 - 人口
    ['Age Min', function () { return val('ageMin'); }],
    ['Age Max', function () { return val('ageMax'); }],
    ['Gender', function () { return val('gender'); }],
    ['Locales', function () { return val('locales'); }],
    // 定向 - 受众/兴趣/连接
    ['Custom Audiences', function () { return val('customAudiences'); }],
    ['Excluded Custom Audiences', function () { return val('excludedCustomAudiences'); }],
    ['Connections', function () { return val('connections'); }],
    ['Excluded Connections', function () { return val('excludedConnections'); }],
    ['Friends of Connections', function () { return val('friendsOfConnections'); }],
    ['Targeting Optimization', function () { return val('targetingExpansion'); }],
    // 版位 Placements
    ['Device Platforms', function () { return placement('devicePlatforms'); }],
    ['Publisher Platforms', function () { return placement('publisherPlatforms'); }],
    ['Facebook Positions', function () { return placement('fbPositions'); }],
    ['Instagram Positions', function () { return placement('igPositions'); }],
    ['Audience Network Positions', function () { return placement('anPositions'); }],
    ['Messenger Positions', function () { return placement('msgrPositions'); }],

    // ---- 广告 Ad ----
    ['Ad Name', function (ad) { return ad('adName'); }],
    ['Ad Status', function () { return val('adStatus'); }],
    ['Creative Type', function (ad) { return ad('creativeType'); }],
    ['Instagram Account ID', function () { return val('instagramAccountId'); }],
    ['Title', function (ad) { return ad('title'); }],
    ['Body', function (ad) { return ad('body'); }],
    ['Link', function (ad) { return ad('link'); }],
    ['Display Link', function (ad) { return ad('displayLink'); }],
    ['Link Description', function (ad) { return ad('linkDescription'); }],
    ['Call to Action', function (ad) { return ad('cta'); }],
    ['Image File Name', function (ad) { return ad('imageFileName'); }],
    ['Image Hash', function (ad) { return ad('imageHash'); }],
    ['Video File Name', function (ad) { return ad('videoFileName'); }],
    ['Video ID', function (ad) { return ad('videoId'); }],
    ['URL Tags', function () { return val('urlTags'); }]
  ];

  // ------------------------------------------------------------------
  // 通用 UI 辅助
  // ------------------------------------------------------------------
  function fillSelect(el, items) {
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

  // 渲染一组复选框到容器
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

  // 读取容器内被勾选的值，逗号分隔
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

  // 版位取值：自动版位时返回空（让 Facebook 自动分配）
  function placement(containerId) {
    if (val('placementMode') === 'automatic') return '';
    return getChecked(containerId);
  }

  // ------------------------------------------------------------------
  // 广告条目（可多个）
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
      field('广告名称 Ad Name *', '<input type="text" data-f="adName" placeholder="夏季促销-广告1">') +
      field('创意类型 Creative Type *', selectHtml('creativeType', CREATIVE_TYPES, 'Link Page Post Ad')) +
      field('行动号召 Call to Action', selectHtml('cta', CTAS, 'LEARN_MORE')) +
      field('标题 Title', '<input type="text" data-f="title" placeholder="限时优惠">') +
      field('落地页链接 Link', '<input type="url" data-f="link" placeholder="https://example.com">') +
      field('正文 Body', '<textarea data-f="body" rows="2" placeholder="广告正文文案..."></textarea>', true) +
      field('显示链接 Display Link', '<input type="text" data-f="displayLink" placeholder="example.com">') +
      field('链接描述 Link Description', '<input type="text" data-f="linkDescription" placeholder="补充说明">') +
      field('图片文件名 Image File Name', '<input type="text" data-f="imageFileName" placeholder="banner.jpg">') +
      field('图片 Hash（可选）', '<input type="text" data-f="imageHash" placeholder="账户内图片 hash">') +
      field('视频文件名（视频广告用）', '<input type="text" data-f="videoFileName" placeholder="promo.mp4">') +
      field('视频 ID（视频广告用，可选）', '<input type="text" data-f="videoId" placeholder="账户内视频 ID">') +
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
      // 安全断言：每行长度必须与表头一致
      if (row.length !== header.length) {
        throw new Error('列数不一致：表头 ' + header.length + ' / 数据 ' + row.length);
      }
      rows.push(row);
    });

    return pruneEmptyColumns(rows);
  }

  // 删除所有数据行都为空的列：避免未填写的可选字段产生无谓的导入警告
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
    if (!val('campaignName')) errors.push('请填写广告系列名称');
    if (!val('adSetName')) errors.push('请填写广告组名称');
    if (!val('countries') && !val('cities') && !val('regions')) {
      errors.push('请至少填写一个投放地区（国家/城市/地区）');
    }
    // 转化目标需要像素
    if (val('optimizationGoal') === 'OFFSITE_CONVERSIONS' && !val('pixelId')) {
      errors.push('优化目标为「转化」时，请填写像素 ID（Pixel ID）');
    }
    // 手动版位需选平台
    if (val('placementMode') === 'manual' && !getChecked('publisherPlatforms')) {
      errors.push('手动版位需至少勾选一个发布平台（Publisher Platforms）');
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
      var type = g('creativeType');
      if (type !== 'Text Page Post Ad' && !g('link')) {
        errors.push(label + '请填写落地页链接');
      }
      if (type === 'Video Page Post Ad') {
        if (!g('videoFileName') && !g('videoId')) {
          errors.push(label + '视频广告需填写「视频文件名」或「视频 ID」');
        }
      } else if (type === 'Photo Page Post Ad' || type === 'Link Page Post Ad') {
        if (!g('imageFileName') && !g('imageHash')) {
          errors.push(label + '该创意类型需填写「图片文件名」或「图片 Hash」');
        }
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
    var box = $('message');
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
      var bytes = MiniXLSX.build(rows, 'Ads');
      var name = (val('campaignName') || 'facebook-ads').replace(/[\\/:*?"<>|]/g, '_');
      download(bytes, name + '.xlsx');
      showMessage('✅ 已生成 ' + (rows.length - 1) + ' 个广告（共 ' + rows[0].length + ' 列），文件已开始下载。', 'success');
    } catch (e) {
      showMessage('生成失败：' + e.message, 'error');
      console.error(e);
    }
  }

  function preview() {
    var rows = collectRows();
    var table = $('previewTable');
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
    $('previewWrap').style.display = 'block';
    $('previewWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ------------------------------------------------------------------
  // 初始化
  // ------------------------------------------------------------------
  function togglePlacementMode() {
    var manual = val('placementMode') === 'manual';
    $('manualPlacements').style.display = manual ? '' : 'none';
  }

  function init() {
    adsContainer = $('ads');

    fillSelect($('campaignObjective'), OBJECTIVES);
    fillSelect($('specialAdCategories'), SPECIAL_AD_CATEGORIES);
    fillSelect($('campaignBidStrategy'), BID_STRATEGIES);
    fillSelect($('destinationType'), DESTINATION_TYPES);
    fillSelect($('optimizationGoal'), OPTIMIZATION_GOALS);
    fillSelect($('billingEvent'), BILLING_EVENTS);
    fillSelect($('gender'), GENDERS);

    renderChecks($('devicePlatforms'), DEVICE_PLATFORMS);
    renderChecks($('publisherPlatforms'), PUBLISHER_PLATFORMS);
    renderChecks($('fbPositions'), FB_POSITIONS);
    renderChecks($('igPositions'), IG_POSITIONS);
    renderChecks($('anPositions'), AN_POSITIONS);
    renderChecks($('msgrPositions'), MSGR_POSITIONS);

    $('placementMode').addEventListener('change', togglePlacementMode);
    togglePlacementMode();

    $('addAd').addEventListener('click', addAd);
    $('generate').addEventListener('click', generate);
    $('preview').addEventListener('click', preview);

    addAd();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
