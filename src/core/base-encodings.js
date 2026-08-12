// =============================================================================
// Base Encodings 双向编解码模块
// 提供 Base16/32/36/58/62/64/85/91/92 的 encode 和 decode 函数
// =============================================================================

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// =============================================================================
// Base16 (Hexadecimal)
// =============================================================================

const HEX_ALPHABET = '0123456789abcdef';

/**
 * Base16 编码（hex 小写）
 * @param {string} input
 * @returns {string}
 */
export function encodeBase16(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += HEX_ALPHABET[bytes[i] >> 4];
    result += HEX_ALPHABET[bytes[i] & 0x0f];
  }
  return result;
}

/**
 * Base16 解码（hex 大小写均支持）
 * @param {string} input
 * @returns {string}
 */
export function decodeBase16(input) {
  if (input === '') return '';
  if (input.length % 2 !== 0) {
    throw new Error('Base16 decode error: input length must be even');
  }
  const re = /^[0-9a-fA-F]*$/;
  if (!re.test(input)) {
    throw new Error('Base16 decode error: input contains invalid characters');
  }
  const bytes = new Uint8Array(input.length / 2);
  for (let i = 0; i < input.length; i += 2) {
    bytes[i / 2] = (parseInt(input[i], 16) << 4) | parseInt(input[i + 1], 16);
  }
  return decoder.decode(bytes);
}

// =============================================================================
// Base32 (RFC 4648, no padding)
// =============================================================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Base32 编码（RFC 4648，无 padding）
 * @param {string} input
 * @returns {string}
 */
export function encodeBase32(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);
  let result = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(buffer >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bits)) & 0x1f];
  }
  return result;
}

/**
 * Base32 解码（RFC 4648，大小写均支持，无 padding 也能解码）
 * @param {string} input
 * @returns {string}
 */
export function decodeBase32(input) {
  if (input === '') return '';
  // 去掉可能的 padding 并转大写
  const cleaned = input.toUpperCase().replace(/=+$/, '');
  if (!/^[A-Z2-7]*$/.test(cleaned)) {
    throw new Error('Base32 decode error: input contains invalid characters');
  }

  const bytes = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) {
      throw new Error(`Base32 decode error: invalid character '${cleaned[i]}'`);
    }
    buffer = (buffer << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }
  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// Base36 (0-9 A-Z)
// =============================================================================

const BASE36_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Base36 编码
 * 将输入字符串的字节视为一个大整数，转换为 Base36
 * @param {string} input
 * @returns {string}
 */
export function encodeBase36(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);

  // 将字节数组转为大整数（BigInt），然后转为 base36
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }

  if (value === 0n) return '0';

  let result = '';
  while (value > 0n) {
    const rem = Number(value % 36n);
    result = BASE36_ALPHABET[rem] + result;
    value = value / 36n;
  }
  return result;
}

/**
 * Base36 解码（大小写均支持）
 * @param {string} input
 * @returns {string}
 */
export function decodeBase36(input) {
  if (input === '') return '';
  const cleaned = input.toLowerCase();
  if (!/^[0-9a-z]+$/.test(cleaned)) {
    throw new Error('Base36 decode error: input contains invalid characters');
  }

  let value = 0n;
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE36_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Base36 decode error: invalid character '${cleaned[i]}'`);
    }
    value = value * 36n + BigInt(idx);
  }

  // 将 BigInt 转换回字节
  if (value === 0n) return '\x00';

  const bytes = [];
  while (value > 0n) {
    bytes.unshift(Number(value & 0xffn));
    value = value >> 8n;
  }
  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// Base58 (Bitcoin style)
// =============================================================================

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Base58 编码（Bitcoin 风格）
 * @param {string} input
 * @returns {string}
 */
export function encodeBase58(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);

  // 统计前导零
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }

  // 将字节转为 BigInt
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }

  let result = '';
  while (value > 0n) {
    const rem = Number(value % 58n);
    result = BASE58_ALPHABET[rem] + result;
    value = value / 58n;
  }

  // 补齐前导零（Base58 用 '1' 表示零）
  for (let i = 0; i < leadingZeros; i++) {
    result = '1' + result;
  }

  return result || '1';
}

/**
 * Base58 解码（Bitcoin 风格）
 * @param {string} input
 * @returns {string}
 */
export function decodeBase58(input) {
  if (input === '') return '';
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(input)) {
    throw new Error('Base58 decode error: input contains invalid characters');
  }

  // 统计前导 '1'
  let leadingOnes = 0;
  for (let i = 0; i < input.length && input[i] === '1'; i++) {
    leadingOnes++;
  }

  let value = 0n;
  for (let i = 0; i < input.length; i++) {
    const idx = BASE58_ALPHABET.indexOf(input[i]);
    if (idx === -1) {
      throw new Error(`Base58 decode error: invalid character '${input[i]}'`);
    }
    value = value * 58n + BigInt(idx);
  }

  // 转换回字节
  const bytes = [];
  while (value > 0n) {
    bytes.unshift(Number(value & 0xffn));
    value = value >> 8n;
  }

  // 补齐前导零字节
  for (let i = 0; i < leadingOnes; i++) {
    bytes.unshift(0);
  }

  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// Base62 (0-9 A-Z a-z)
// =============================================================================

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Base62 编码
 * @param {string} input
 * @returns {string}
 */
export function encodeBase62(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);

  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }

  if (value === 0n) return '0';

  let result = '';
  while (value > 0n) {
    const rem = Number(value % 62n);
    result = BASE62_ALPHABET[rem] + result;
    value = value / 62n;
  }
  return result;
}

/**
 * Base62 解码
 * @param {string} input
 * @returns {string}
 */
export function decodeBase62(input) {
  if (input === '') return '';
  if (!/^[0-9A-Za-z]+$/.test(input)) {
    throw new Error('Base62 decode error: input contains invalid characters');
  }

  let value = 0n;
  for (let i = 0; i < input.length; i++) {
    const idx = BASE62_ALPHABET.indexOf(input[i]);
    if (idx === -1) {
      throw new Error(`Base62 decode error: invalid character '${input[i]}'`);
    }
    value = value * 62n + BigInt(idx);
  }

  if (value === 0n) return '\x00';

  const bytes = [];
  while (value > 0n) {
    bytes.unshift(Number(value & 0xffn));
    value = value >> 8n;
  }
  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// Base64 (Standard)
// =============================================================================

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Base64 编码（标准）
 * @param {string} input
 * @returns {string}
 */
export function encodeBase64(input) {
  if (input === '') return '';
  // 使用 btoa ——但 Node ESM 中没有 btoa，手动实现
  const bytes = encoder.encode(input);
  let result = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i];
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      result += BASE64_ALPHABET[(buffer >>> bits) & 0x3f];
    }
  }
  if (bits > 0) {
    result += BASE64_ALPHABET[(buffer << (6 - bits)) & 0x3f];
  }
  // 补齐到 4 的倍数
  while (result.length % 4 !== 0) {
    result += '=';
  }
  return result;
}

/**
 * Base64 解码（标准）
 * @param {string} input
 * @returns {string}
 */
export function decodeBase64(input) {
  if (input === '') return '';
  const cleaned = input.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error('Base64 decode error: input contains invalid characters');
  }

  // 去掉 padding
  const stripped = cleaned.replace(/=+$/, '');
  const bytes = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < stripped.length; i++) {
    const idx = BASE64_ALPHABET.indexOf(stripped[i]);
    if (idx === -1) {
      throw new Error(`Base64 decode error: invalid character '${stripped[i]}'`);
    }
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }
  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// Base85 (Ascii85 / RFC 1924 style)
// =============================================================================

/**
 * Base85 编码（Ascii85 风格，4字节 -> 5字符）
 * 使用 ! 到 u 的字符集
 * @param {string} input
 * @returns {string}
 */
export function encodeBase85(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);

  let result = '';
  for (let i = 0; i < bytes.length; i += 4) {
    const chunk = bytes.slice(i, i + 4);
    if (chunk.length === 4) {
      // 使用乘法而非位运算，避免 JS 32位有符号整数溢出
      let value = chunk[0] * 16777216 + chunk[1] * 65536 + chunk[2] * 256 + chunk[3];
      if (value === 0) {
        result += 'z';
        continue;
      }
      const encoded = new Array(5);
      for (let j = 4; j >= 0; j--) {
        encoded[j] = String.fromCharCode(33 + (value % 85));
        value = Math.floor(value / 85);
      }
      result += encoded.join('');
    } else {
      // 处理剩余字节
      let value = 0;
      for (let j = 0; j < chunk.length; j++) {
        value = value * 256 + chunk[j];
      }
      const outLen = chunk.length + 1;
      const encoded = new Array(outLen);
      for (let j = outLen - 1; j >= 0; j--) {
        encoded[j] = String.fromCharCode(33 + (value % 85));
        value = Math.floor(value / 85);
      }
      result += encoded.join('');
    }
  }
  return result;
}

/**
 * Base85 解码（Ascii85 风格，大小写 z 均支持）
 * @param {string} input
 * @returns {string}
 */
export function decodeBase85(input) {
  if (input === '') return '';
  // 忽略空白
  const cleaned = input.replace(/\s/g, '');
  // 逐字符验证：有效字符为 ! (33) 到 u (117) 以及 z/Z
  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i);
    if (!((code >= 33 && code <= 117) || code === 122 || code === 90)) {
      throw new Error(`Base85 decode error: invalid character '${cleaned[i]}' at position ${i}`);
    }
  }

  const bytes = [];
  let i = 0;
  while (i < cleaned.length) {
    if (cleaned[i].toLowerCase() === 'z') {
      // 'z' 表示 4 个零字节
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }

    // 收集最多 5 个字符
    const group = [];
    while (i < cleaned.length && group.length < 5) {
      const ch = cleaned[i];
      if (ch.toLowerCase() === 'z') break;
      group.push(ch);
      i++;
    }

    if (group.length === 0) continue;

    let value = 0;
    for (let j = 0; j < group.length; j++) {
      value = value * 85 + (group[j].charCodeAt(0) - 33);
    }

    // 输出字节数 = group.length - 1
    const outLen = group.length - 1;
    for (let j = outLen - 1; j >= 0; j--) {
      bytes.push((value >>> (8 * j)) & 0xff);
    }
  }
  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// Base91 (basE91)
// =============================================================================

// Base91 字母表：0x21(!) 到 0x7E(~) 共 94 个可打印字符
const BASE91_TABLE = (() => {
  const table = [];
  for (let i = 0x21; i <= 0x7e; i++) {
    table.push(String.fromCharCode(i));
  }
  return table.join('');
})();

/**
 * Base91 编码
 * 算法核心：每 13 字节编码为 16 字符，余数特殊处理
 * @param {string} input
 * @returns {string}
 */
export function encodeBase91(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);

  let result = '';
  let b = 0;
  let n = 0;

  for (let i = 0; i < bytes.length; i++) {
    b |= bytes[i] << n;
    n += 8;

    if (n > 13) {
      let v = b & 8191; // 0x1FFF = 8191
      if (v > 88) {
        b = b >> 13;
        n -= 13;
      } else {
        v = b & 16383; // 0x3FFF = 16383
        b = b >> 14;
        n -= 14;
      }
      result += BASE91_TABLE[v % 91];
      result += BASE91_TABLE[Math.floor(v / 91)];
    }
  }

  if (n > 0) {
    // 处理剩余位
    result += BASE91_TABLE[b % 91];
    if (n > 7 || b > 90) {
      result += BASE91_TABLE[Math.floor(b / 91)];
    }
  }

  return result;
}

/**
 * Base91 解码
 * @param {string} input
 * @returns {string}
 */
export function decodeBase91(input) {
  if (input === '') return '';

  // 构建反向查找表
  const reverseTable = {};
  for (let i = 0; i < BASE91_TABLE.length; i++) {
    reverseTable[BASE91_TABLE[i]] = i;
  }

  // 验证字符
  for (let i = 0; i < input.length; i++) {
    if (!(reverseTable.hasOwnProperty(input[i]))) {
      throw new Error(`Base91 decode error: invalid character '${input[i]}' (code ${input.charCodeAt(i)})`);
    }
  }

  const bytes = [];
  let b = 0;
  let n = 0;
  let v = -1;

  for (let i = 0; i < input.length; i++) {
    const c = reverseTable[input[i]];
    if (v < 0) {
      v = c;
    } else {
      v += c * 91;
      b |= v << n;
      n += (v & 8191) > 88 ? 13 : 14;

      // 输出完整字节
      while (n >= 8) {
        bytes.push(b & 0xff);
        b = b >> 8;
        n -= 8;
      }
      v = -1;
    }
  }

  if (v >= 0) {
    // 最后一个字节
    b |= v << n;
    bytes.push(b & 0xff);
  }

  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// Base92
// 在 Base91 基础上扩展，增加 ~ 字符，排除 " 字符以避免 JSON 冲突
// =============================================================================

// Base92 字母表：0x21-0x7E 中排除 " (0x22)，共 93 个字符映射为 92 个有效编码字符（0-91）
const BASE92_TABLE = (() => {
  const table = [];
  for (let i = 0x21; i <= 0x7e; i++) {
    if (i === 0x22) continue; // 排除双引号
    table.push(String.fromCharCode(i));
  }
  return table.join(''); // 92 个字符
})();

/**
 * Base92 编码
 * 在 Base91 基础上扩展：每 13 字节编码为 16 字符，余数特殊处理，使用 92 进制
 * @param {string} input
 * @returns {string}
 */
export function encodeBase92(input) {
  if (input === '') return '';
  const bytes = encoder.encode(input);

  let result = '';
  let b = 0;
  let n = 0;

  for (let i = 0; i < bytes.length; i++) {
    b |= bytes[i] << n;
    n += 8;

    if (n > 13) {
      let v = b & 8191; // 0x1FFF
      if (v > 88) {
        b = b >> 13;
        n -= 13;
      } else {
        v = b & 16383; // 0x3FFF
        b = b >> 14;
        n -= 14;
      }
      result += BASE92_TABLE[v % 92];
      result += BASE92_TABLE[Math.floor(v / 92)];
    }
  }

  if (n > 0) {
    // 处理剩余位
    result += BASE92_TABLE[b % 92];
    if (n > 7 || b > 91) {
      result += BASE92_TABLE[Math.floor(b / 92)];
    }
  }

  return result;
}

/**
 * Base92 解码
 * @param {string} input
 * @returns {string}
 */
export function decodeBase92(input) {
  if (input === '') return '';

  // 构建反向查找表
  const reverseTable = {};
  for (let i = 0; i < BASE92_TABLE.length; i++) {
    reverseTable[BASE92_TABLE[i]] = i;
  }

  // 验证字符
  for (let i = 0; i < input.length; i++) {
    if (!(reverseTable.hasOwnProperty(input[i]))) {
      throw new Error(`Base92 decode error: invalid character '${input[i]}' (code ${input.charCodeAt(i)})`);
    }
  }

  const bytes = [];
  let b = 0;
  let n = 0;
  let v = -1;

  for (let i = 0; i < input.length; i++) {
    const c = reverseTable[input[i]];
    if (v < 0) {
      v = c;
    } else {
      v += c * 92;
      b |= v << n;
      n += (v & 8191) > 88 ? 13 : 14;

      // 输出完整字节
      while (n >= 8) {
        bytes.push(b & 0xff);
        b = b >> 8;
        n -= 8;
      }
      v = -1;
    }
  }

  if (v >= 0) {
    b |= v << n;
    bytes.push(b & 0xff);
  }

  return decoder.decode(new Uint8Array(bytes));
}

// =============================================================================
// 统一导出对象（按编码名称索引）
// =============================================================================

export default {
  base16: { encode: encodeBase16, decode: decodeBase16 },
  base32: { encode: encodeBase32, decode: decodeBase32 },
  base36: { encode: encodeBase36, decode: decodeBase36 },
  base58: { encode: encodeBase58, decode: decodeBase58 },
  base62: { encode: encodeBase62, decode: decodeBase62 },
  base64: { encode: encodeBase64, decode: decodeBase64 },
  base85: { encode: encodeBase85, decode: decodeBase85 },
  base91: { encode: encodeBase91, decode: decodeBase91 },
  base92: { encode: encodeBase92, decode: decodeBase92 },
};
