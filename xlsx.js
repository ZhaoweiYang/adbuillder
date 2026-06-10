/*
 * 轻量级 XLSX 生成器（零依赖，纯前端）
 * 将二维数组（rows: string[][]）生成为一个 .xlsx 文件的 Uint8Array。
 * 实现要点：
 *  - 使用 inlineStr 内联字符串，避免维护 sharedStrings 表。
 *  - 自带最小化 ZIP（仅 "stored"，不压缩）打包 + CRC32 计算。
 *  - 仅依赖浏览器原生 API（TextEncoder / Blob）。
 */
(function (global) {
  'use strict';

  // ---------- CRC32 ----------
  var crcTable = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) {
      crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // ---------- 工具 ----------
  var encoder = new TextEncoder();

  function strToBytes(str) {
    return encoder.encode(str);
  }

  function xmlEscape(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // 列索引(0-based) -> A, B, ... Z, AA, AB ...
  function colLetter(index) {
    var letter = '';
    index += 1;
    while (index > 0) {
      var rem = (index - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      index = Math.floor((index - 1) / 26);
    }
    return letter;
  }

  // ---------- 构建工作表 XML ----------
  function buildSheetXml(rows) {
    var parts = [];
    parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
    parts.push(
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    );
    parts.push('<sheetData>');
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r] || [];
      parts.push('<row r="' + (r + 1) + '">');
      for (var c = 0; c < row.length; c++) {
        var ref = colLetter(c) + (r + 1);
        var val = row[c];
        if (val === null || val === undefined || val === '') {
          continue; // 空单元格跳过即可
        }
        parts.push(
          '<c r="' +
            ref +
            '" t="inlineStr"><is><t xml:space="preserve">' +
            xmlEscape(val) +
            '</t></is></c>'
        );
      }
      parts.push('</row>');
    }
    parts.push('</sheetData>');
    parts.push('</worksheet>');
    return parts.join('');
  }

  // ---------- 固定结构文件 ----------
  var CONTENT_TYPES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '</Types>';

  var ROOT_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  function workbookXml(sheetName) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' +
      xmlEscape(sheetName) +
      '" sheetId="1" r:id="rId1"/></sheets>' +
      '</workbook>'
    );
  }

  var WORKBOOK_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '</Relationships>';

  // ---------- 最小化 ZIP（stored，不压缩） ----------
  function dosDateTime(date) {
    var d = date || new Date();
    var time =
      (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
    var dt =
      ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time: time & 0xffff, date: dt & 0xffff };
  }

  function buildZip(files) {
    var localParts = [];
    var central = [];
    var offset = 0;
    var dt = dosDateTime(new Date());

    function pushU16(arr, v) {
      arr.push(v & 0xff, (v >>> 8) & 0xff);
    }
    function pushU32(arr, v) {
      arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
    }

    files.forEach(function (file) {
      var nameBytes = strToBytes(file.name);
      var data = file.data; // Uint8Array
      var crc = crc32(data);
      var size = data.length;

      // ---- Local file header ----
      var local = [];
      pushU32(local, 0x04034b50);
      pushU16(local, 20); // version needed
      pushU16(local, 0); // flags
      pushU16(local, 0); // method 0 = stored
      pushU16(local, dt.time);
      pushU16(local, dt.date);
      pushU32(local, crc);
      pushU32(local, size); // compressed size
      pushU32(local, size); // uncompressed size
      pushU16(local, nameBytes.length);
      pushU16(local, 0); // extra len
      var localHeader = new Uint8Array(local);

      var localTotal = localHeader.length + nameBytes.length + data.length;
      var combined = new Uint8Array(localTotal);
      combined.set(localHeader, 0);
      combined.set(nameBytes, localHeader.length);
      combined.set(data, localHeader.length + nameBytes.length);
      localParts.push(combined);

      // ---- Central directory header ----
      var cd = [];
      pushU32(cd, 0x02014b50);
      pushU16(cd, 20); // version made by
      pushU16(cd, 20); // version needed
      pushU16(cd, 0); // flags
      pushU16(cd, 0); // method
      pushU16(cd, dt.time);
      pushU16(cd, dt.date);
      pushU32(cd, crc);
      pushU32(cd, size);
      pushU32(cd, size);
      pushU16(cd, nameBytes.length);
      pushU16(cd, 0); // extra
      pushU16(cd, 0); // comment
      pushU16(cd, 0); // disk number
      pushU16(cd, 0); // internal attrs
      pushU32(cd, 0); // external attrs
      pushU32(cd, offset); // local header offset
      var cdHeader = new Uint8Array(cd);
      var cdEntry = new Uint8Array(cdHeader.length + nameBytes.length);
      cdEntry.set(cdHeader, 0);
      cdEntry.set(nameBytes, cdHeader.length);
      central.push(cdEntry);

      offset += localTotal;
    });

    var centralSize = central.reduce(function (a, b) {
      return a + b.length;
    }, 0);
    var centralOffset = offset;

    // ---- End of central directory ----
    var eocd = [];
    pushU32(eocd, 0x06054b50);
    pushU16(eocd, 0); // disk
    pushU16(eocd, 0); // disk with cd
    pushU16(eocd, files.length);
    pushU16(eocd, files.length);
    pushU32(eocd, centralSize);
    pushU32(eocd, centralOffset);
    pushU16(eocd, 0); // comment len
    var eocdBytes = new Uint8Array(eocd);

    // 拼接全部
    var totalLength =
      localParts.reduce(function (a, b) {
        return a + b.length;
      }, 0) +
      centralSize +
      eocdBytes.length;

    var out = new Uint8Array(totalLength);
    var pos = 0;
    localParts.forEach(function (p) {
      out.set(p, pos);
      pos += p.length;
    });
    central.forEach(function (p) {
      out.set(p, pos);
      pos += p.length;
    });
    out.set(eocdBytes, pos);
    return out;
  }

  /**
   * 生成 xlsx 文件的 Uint8Array。
   * @param {string[][]} rows 二维数组（含表头）
   * @param {string} sheetName 工作表名
   */
  function build(rows, sheetName) {
    sheetName = sheetName || 'Sheet1';
    var files = [
      { name: '[Content_Types].xml', data: strToBytes(CONTENT_TYPES) },
      { name: '_rels/.rels', data: strToBytes(ROOT_RELS) },
      { name: 'xl/workbook.xml', data: strToBytes(workbookXml(sheetName)) },
      { name: 'xl/_rels/workbook.xml.rels', data: strToBytes(WORKBOOK_RELS) },
      { name: 'xl/worksheets/sheet1.xml', data: strToBytes(buildSheetXml(rows)) }
    ];
    return buildZip(files);
  }

  global.MiniXLSX = { build: build };
})(typeof window !== 'undefined' ? window : this);
