/**
 * Network & Technical Encodings
 *
 * URL编码/解码、Shellcode编解码、Handycode（全角字符）编解码、Quoted-printable编解码
 */

// ==================== URL 编码/解码 ====================

/**
 * URL编码（标准 encodeURIComponent）
 * @param {string} input
 * @returns {string}
 */
export function urlEncode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('URL encode: input must be a string');
  }
  if (input === '') return '';
  return encodeURIComponent(input);
}

/**
 * URL解码（标准 decodeURIComponent）
 * @param {string} input
 * @returns {string}
 */
export function urlDecode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('URL decode: input must be a string');
  }
  if (input === '') return '';
  try {
    return decodeURIComponent(input);
  } catch (e) {
    throw new Error(`URL decode failed: invalid percent-encoding sequence`);
  }
}

// ==================== Shellcode 编解码 ====================

/**
 * 将文本编码为十六进制shellcode格式
 * @param {string} input
 * @param {{ format?: 'hex' | 'cstyle' }} [options] - 输出格式，默认 'cstyle'
 * @returns {string}
 */
export function shellcodeEncode(input, options = {}) {
  if (typeof input !== 'string') {
    throw new TypeError('Shellcode encode: input must be a string');
  }
  if (input === '') return '';

  const format = options.format || 'cstyle';
  const bytes = new TextEncoder().encode(input);

  if (format === 'hex') {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // cstyle: \xNN format
  return Array.from(bytes)
    .map(b => '\\x' + b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将shellcode格式还原为原始文本
 * 支持 \xNN 格式和纯十六进制格式
 * @param {string} input
 * @returns {string}
 */
export function shellcodeDecode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Shellcode decode: input must be a string');
  }

  const trimmed = input.trim();
  if (trimmed === '') return '';

  // 尝试 \xNN 格式
  if (trimmed.startsWith('\\x') || trimmed.includes('\\x')) {
    const hexBytes = [];
    const re = /\\x([0-9a-fA-F]{2})/g;
    let match;
    while ((match = re.exec(trimmed)) !== null) {
      hexBytes.push(parseInt(match[1], 16));
    }
    if (hexBytes.length === 0) {
      throw new Error('Shellcode decode failed: no valid \\xNN sequences found');
    }
    return new TextDecoder().decode(new Uint8Array(hexBytes));
  }

  // 尝试纯十六进制格式
  const cleaned = trimmed.replace(/[\s\n\r]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error(
      'Shellcode decode failed: input must be either \\xNN format or pure hex digits'
    );
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error(
      'Shellcode decode failed: hex string must have an even number of characters'
    );
  }

  const hexBytes = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    hexBytes.push(parseInt(cleaned.substring(i, i + 2), 16));
  }

  return new TextDecoder().decode(new Uint8Array(hexBytes));
}

// ==================== Handycode 编解码 ====================

// ASCII 33-126 映射到全角 Unicode FF01-FF5E
// 全角空格 U+3000 (ASCII 32 空格不映射到全角，保留)
const FULLWIDTH_OFFSET = 0xff01 - 33; // U+FF01 对应 ASCII '!'

/**
 * 将ASCII文本转换为全角（Handycode）格式
 * @param {string} input
 * @returns {string}
 */
export function handycodeEncode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Handycode encode: input must be a string');
  }
  if (input === '') return '';

  return input
    .split('')
    .map(ch => {
      const code = ch.charCodeAt(0);
      if (code >= 33 && code <= 126) {
        return String.fromCodePoint(code + FULLWIDTH_OFFSET);
      }
      // 空格转全角空格
      if (code === 32) {
        return '\u3000';
      }
      return ch;
    })
    .join('');
}

/**
 * 将全角（Handycode）字符还原为ASCII
 * @param {string} input
 * @returns {string}
 */
export function handycodeDecode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Handycode decode: input must be a string');
  }
  if (input === '') return '';

  return input
    .split('')
    .map(ch => {
      const code = ch.codePointAt(0);
      // 全角 ASCII 范围
      if (code >= 0xff01 && code <= 0xff5e) {
        return String.fromCodePoint(code - FULLWIDTH_OFFSET);
      }
      // 全角空格
      if (code === 0x3000) {
        return ' ';
      }
      return ch;
    })
    .join('');
}

// ==================== Quoted-printable 编解码 ====================

const QP_MAX_LINE_LENGTH = 76;

/**
 * 将文本编码为Quoted-printable格式（RFC 2045）
 * @param {string} input
 * @returns {string}
 */
export function qpEncode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Quoted-printable encode: input must be a string');
  }
  if (input === '') return '';

  const lines = [];
  let currentLine = '';

  function flushLine(softBreak) {
    if (softBreak && currentLine.length > 0) {
      currentLine += '=';
    }
    lines.push(currentLine);
    currentLine = '';
  }

  const bytes = new TextEncoder().encode(input);

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    let encoded;

    // 检查是否是换行符
    if (byte === 0x0d && i + 1 < bytes.length && bytes[i + 1] === 0x0a) {
      // CRLF
      flushLine(false);
      i++; // 跳过 LF
      continue;
    }
    if (byte === 0x0a) {
      // 单独的 LF
      flushLine(false);
      continue;
    }
    if (byte === 0x0d) {
      // 单独的 CR
      flushLine(false);
      continue;
    }

    // 可打印ASCII字符（空格除外）：直接输出
    // ASCII 33-60, 62-126 是可打印的
    if (
      (byte >= 33 && byte <= 60) ||
      (byte >= 62 && byte <= 126)
    ) {
      encoded = String.fromCharCode(byte);
    } else if (byte === 0x09) {
      // Tab 可以原样输出
      encoded = '\t';
    } else if (byte === 0x20) {
      // 空格：如果在行末，需要编码
      // 先放空格，后续在行截断时处理
      encoded = ' ';
    } else {
      encoded = '=' + byte.toString(16).padStart(2, '0').toUpperCase();
    }

    // 检查是否需要软换行
    const needed = encoded.length;
    if (currentLine.length + needed > QP_MAX_LINE_LENGTH) {
      // 当前行满了，软换行
      // 如果以空格结尾，转成 =20
      if (currentLine.endsWith(' ')) {
        currentLine = currentLine.slice(0, -1) + '=20';
      }
      flushLine(true);
    }

    currentLine += encoded;
  }

  // 处理最后一行末尾的空格
  if (currentLine.endsWith(' ')) {
    currentLine = currentLine.slice(0, -1) + '=20';
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines.join('\r\n');
}

/**
 * 将Quoted-printable格式还原为文本
 * @param {string} input
 * @returns {string}
 */
export function qpDecode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Quoted-printable decode: input must be a string');
  }
  if (input === '') return '';

  const result = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === '=') {
      // 处理 = 转义
      if (i + 1 >= input.length) {
        // 行末 =，软换行
        break;
      }

      if (input[i + 1] === '\r' && i + 2 < input.length && input[i + 2] === '\n') {
        // =\r\n 软换行，跳过
        i += 3;
        continue;
      }
      if (input[i + 1] === '\n') {
        // =\n 软换行
        i += 2;
        continue;
      }

      // 检查 =XX 格式
      if (i + 2 < input.length) {
        const hex = input.substring(i + 1, i + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          result.push(parseInt(hex, 16));
          i += 3;
          continue;
        }
      }

      // 不是有效的转义序列，保留原字符
      result.push('='.charCodeAt(0));
      i++;
      continue;
    }

    // 普通字符
    if (ch === '\r' && i + 1 < input.length && input[i + 1] === '\n') {
      // CRLF -> 保留为换行
      // Quoted-printable 中 CRLF 表示硬换行（段落结束）
      result.push(0x0d, 0x0a);
      i += 2;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      // 单独的 LF/CR 保留
      result.push(ch.charCodeAt(0));
      i++;
      continue;
    }

    result.push(ch.charCodeAt(0));
    i++;
  }

  return new TextDecoder().decode(new Uint8Array(result));
}
