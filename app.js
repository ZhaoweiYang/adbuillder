/*
 * 应用逻辑：收集表单 -> 组织成 Facebook 批量导入格式的二维数组 -> 生成 xlsx 下载
 */
(function () {
  'use strict';

  // Facebook 批量导入常用列（顺序即文件中的列顺序）。
  // 列名采用 Facebook 批量上传模板的英文表头，导入时可被自动识别。
  var COLUMNS = [
    'Campaign Name',
    'Campaign Status',
    'Campaign Objective',
    'Buying Type',
    'Campaign Daily Budget',
    'Campaign Lifetime Budget',
    'Ad Set Name',
    'Ad Set Run Status',
    'Ad Set Daily Budget',
    'Ad Set Lifetime Budget',
    'Ad Set Time Start',
    'Ad Set Time Stop',
    'Optimization Goal',
    'Billing Event',
    'Bid Amount',
    'Countries',
    'Cities',
    'Age Min',
    'Age Max',
    'Gender',
    'Ad Name',
    'Ad Status',
    'Title',
    'Body',
    'Link',
    'Display Link',
    'Link Description',
    'Call to Action',
    'Image File Name',
    'Image Hash',
    'Video File Name',
    'URL Tags'
  ];

  // 选项数据
  var OBJECTIVES = [
    'OUTCOME_TRAFFIC',
    'OUTCOME_AWARENESS',
    'OUTCOME_ENGAGEMENT',
    'OUTCOME_LEADS',
    'OUTCOME_SALES',
    'OUTCOME_APP_PROMOTION'
  ];
  var OPTIMIZATION_GOALS = [
    'LINK_CLICKS',
    'LANDING_PAGE_VIEWS',
    'IMPRESSIONS',
    'REACH',
    'POST_ENGAGEMENT',
    'OFFSITE_CONVERSIONS',
    'LEAD_GENERATION'
  ];
  var BILLING_EVENTS = ['IMPRESSIONS', 'LINK_CLICKS'];
  var GENDERS = [
    { v: 'All', label: '全部' },
    { v: 'Male', label: '男' },
    { v: 'Female', label: '女' }
  ];
  var CTAS = [
    'LEARN_MORE',
    'SHOP_NOW',
    'SIGN_UP',
    'SUBSCRIBE',
    'DOWNLOAD',
    'CONTACT_US',
    'GET_OFFER',
    'BOOK_TRAVEL',
    'NO_BUTTON'
  ];

  var $ = function (id) {
    return document.getElementById(id);
  };

  function fillSelect(el, items) {
    items.forEach(function (item) {
      var opt = document.createElement('option');
      if (typeof item === 'string') {
        opt.value = item;
        opt.textContent = item;
      } else {
        opt.value = item.v;
        opt.textContent = item.label + ' (' + item.v + ')';
      }
      el.appendChild(opt);
    });
  }

  // ---------- 广告条目（可多个） ----------
  var adsContainer;
  var adIndex = 0;

  function adTemplate(idx) {
    return (
      '<div class="ad-card" data-ad>' +
      '<div class="ad-card-head">' +
      '<span class="ad-card-title">广告 #<span data-adnum></span></span>' +
      '<button type="button" class="btn-remove" data-remove>删除</button>' +
      '</div>' +
      '<div class="grid">' +
      field('广告名称 Ad Name', '<input type="text" data-f="adName" placeholder="夏季促销-广告1">') +
      field('Call to Action', selectHtml('cta', CTAS, 'LEARN_MORE')) +
      field('标题 Title', '<input type="text" data-f="title" placeholder="限时优惠">') +
      field('落地页链接 Link', '<input type="url" data-f="link" placeholder="https://example.com">') +
      field('正文 Body', '<textarea data-f="body" rows="2" placeholder="广告正文文案..."></textarea>', true) +
      field('显示链接 Display Link', '<input type="text" data-f="displayLink" placeholder="example.com">') +
      field('链接描述 Link Description', '<input type="text" data-f="linkDescription" placeholder="补充说明">') +
      field('图片文件名 Image File Name', '<input type="text" data-f="imageFileName" placeholder="banner.jpg">') +
      field('图片 Hash（可选）', '<input type="text" data-f="imageHash" placeholder="账户内图片 hash">') +
      field('视频文件名（可选）', '<input type="text" data-f="videoFileName" placeholder="promo.mp4">') +
      '</div>' +
      '</div>'
    );
  }

  function field(label, inner, full) {
    return (
      '<label class="field' +
      (full ? ' full' : '') +
      '"><span>' +
      label +
      '</span>' +
      inner +
      '</label>'
    );
  }

  function selectHtml(name, items, def) {
    var html = '<select data-f="' + name + '">';
    items.forEach(function (i) {
      html +=
        '<option value="' + i + '"' + (i === def ? ' selected' : '') + '>' + i + '</option>';
    });
    html += '</select>';
    return html;
  }

  function addAd() {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = adTemplate(adIndex);
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
      var removeBtn = card.querySelector('[data-remove]');
      removeBtn.style.display = cards.length > 1 ? '' : 'none';
    });
  }

  // ---------- 收集数据 ----------
  function val(id) {
    var el = $(id);
    return el ? el.value.trim() : '';
  }

  function collectRows() {
    var campaign = {
      name: val('campaignName'),
      status: val('campaignStatus'),
      objective: val('campaignObjective'),
      buyingType: 'AUCTION',
      dailyBudget: val('campaignDailyBudget'),
      lifetimeBudget: val('campaignLifetimeBudget')
    };
    var adset = {
      name: val('adSetName'),
      status: val('adSetStatus'),
      dailyBudget: val('adSetDailyBudget'),
      lifetimeBudget: val('adSetLifetimeBudget'),
      timeStart: val('adSetTimeStart'),
      timeStop: val('adSetTimeStop'),
      optimizationGoal: val('optimizationGoal'),
      billingEvent: val('billingEvent'),
      bidAmount: val('bidAmount'),
      countries: val('countries'),
      cities: val('cities'),
      ageMin: val('ageMin'),
      ageMax: val('ageMax'),
      gender: val('gender')
    };

    var rows = [COLUMNS.slice()];
    var adCards = adsContainer.querySelectorAll('[data-ad]');

    adCards.forEach(function (card) {
      function f(name) {
        var el = card.querySelector('[data-f="' + name + '"]');
        return el ? el.value.trim() : '';
      }
      var row = [
        campaign.name,
        campaign.status,
        campaign.objective,
        campaign.buyingType,
        campaign.dailyBudget,
        campaign.lifetimeBudget,
        adset.name,
        adset.status,
        adset.dailyBudget,
        adset.lifetimeBudget,
        adset.timeStart,
        adset.timeStop,
        adset.optimizationGoal,
        adset.billingEvent,
        adset.bidAmount,
        adset.countries,
        adset.cities,
        adset.ageMin,
        adset.ageMax,
        adset.gender,
        f('adName'),
        val('adStatus'),
        f('title'),
        f('body'),
        f('link'),
        f('displayLink'),
        f('linkDescription'),
        f('cta'),
        f('imageFileName'),
        f('imageHash'),
        f('videoFileName'),
        val('urlTags')
      ];
      rows.push(row);
    });

    return rows;
  }

  function validate(rows) {
    var errors = [];
    if (!val('campaignName')) errors.push('请填写广告系列名称');
    if (!val('adSetName')) errors.push('请填写广告组名称');
    if (!val('countries')) errors.push('请填写投放国家/地区（Countries）');
    var adCards = adsContainer.querySelectorAll('[data-ad]');
    if (adCards.length === 0) errors.push('至少需要一个广告');
    adCards.forEach(function (card, i) {
      var adName = card.querySelector('[data-f="adName"]').value.trim();
      var link = card.querySelector('[data-f="link"]').value.trim();
      if (!adName) errors.push('广告 #' + (i + 1) + '：请填写广告名称');
      if (!link) errors.push('广告 #' + (i + 1) + '：请填写落地页链接');
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
  }

  function generate() {
    showMessage('', '');
    var rows = collectRows();
    var errors = validate(rows);
    if (errors.length) {
      showMessage('⚠️ ' + errors.join('；'), 'error');
      return;
    }
    try {
      var bytes = MiniXLSX.build(rows, 'Ads');
      var name = (val('campaignName') || 'facebook-ads').replace(/[\\/:*?"<>|]/g, '_');
      download(bytes, name + '.xlsx');
      showMessage('✅ 已生成 ' + (rows.length - 1) + ' 个广告，文件已开始下载。', 'success');
    } catch (e) {
      showMessage('生成失败：' + e.message, 'error');
      console.error(e);
    }
  }

  // 预览前 N 行（调试/确认用）
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
  }

  // ---------- 初始化 ----------
  function init() {
    adsContainer = $('ads');

    fillSelect($('campaignObjective'), OBJECTIVES);
    fillSelect($('optimizationGoal'), OPTIMIZATION_GOALS);
    fillSelect($('billingEvent'), BILLING_EVENTS);
    fillSelect($('gender'), GENDERS);

    $('addAd').addEventListener('click', addAd);
    $('generate').addEventListener('click', generate);
    $('preview').addEventListener('click', preview);

    addAd(); // 默认一个广告
  }

  document.addEventListener('DOMContentLoaded', init);
})();
