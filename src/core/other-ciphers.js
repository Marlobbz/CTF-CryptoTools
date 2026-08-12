/**
 * Other Ciphers for CTF
 *
 * 敲击码（Tap Code）、A1z26密码、二进制01编码
 */

// ==================== 敲击码 (Tap Code) ====================

// 5x5 Polybius 方阵，C 和 K 共用一格（位置 1,3），J 通常被映射到 I
// A=1,1  B=1,2  C/K=1,3  D=1,4  E=1,5
// F=2,1  G=2,2  H=2,3  I=2,4  J=2,4
// L=3,1  M=3,2  N=3,3  O=3,4  P=3,5
// Q=4,1  R=4,2  S=4,3  T=4,4  U=4,5
// V=5,1  W=5,2  X=5,3  Y=5,4  Z=5,5

const TAP_CODE_MAP = {
  A: [1, 1], B: [1, 2], C: [1, 3], D: [1, 4], E: [1, 5],
  F: [2, 1], G: [2, 2], H: [2, 3], I: [2, 4], J: [2, 4],
  K: [1, 3],
  L: [3, 1], M: [3, 2], N: [3, 3], O: [3, 4], P: [3, 5],
  Q: [4, 1], R: [4, 2], S: [4, 3], T: [4, 4], U: [4, 5],
  V: [5, 1], W: [5, 2], X: [5, 3], Y: [5, 4], Z: [5, 5],
};

// 反向映射: "1,1" -> A, "2,4" -> I/J, "1,3" -> C/K
function buildTapDecodeMap() {
  const map = {};
  for (const [letter, coords] of Object.entries(TAP_CODE_MAP)) {
    const key = `${coords[0]},${coords[1]}`;
    if (!map[key]) {
      map[key] = letter;
    }
    // C/K 和 I/J 都映射到第一个字母
  }
  return map;
}

const TAP_DECODE_MAP = buildTapDecodeMap();

/**
 * 将文本编码为敲击码（Tap Code）
 * 每个字母表示为 行敲击 . 空格 列敲击 .
 * 字母对之间用空格分隔
 * @param {string} input
 * @returns {string}
 */
export function tapCodeEncode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Tap code encode: input must be a string');
  }
  if (input === '') return '';

  const tokens = [];
  const upper = input.toUpperCase();

  for (const ch of upper) {
    if (ch === ' ') {
      tokens.push('/'); // 单词分隔符
      continue;
    }
    const coords = TAP_CODE_MAP[ch];
    if (!coords) {
      throw new Error(`Tap code encode: unsupported character '${ch}'`);
    }
    const rowDots = '.'.repeat(coords[0]);
    const colDots = '.'.repeat(coords[1]);
    tokens.push(`${rowDots} ${colDots}`);
  }

  return tokens.join(' ');
}

/**
 * 将敲击码还原为文本
 * 支持格式如 ". .  .. ..." 或 "... ...  . .." 每对用空格分隔
 * 对之间可能也有空格分开
 * @param {string} input
 * @returns {string}
 */
export function tapCodeDecode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Tap code decode: input must be a string');
  }

  const trimmed = input.trim();
  if (trimmed === '') return '';

  // 先按 '/' 或多个空格分割（单词之间）
  const parts = [];
  // 按空格分割所有token
  const rawTokens = trimmed.split(/\s+/);

  // 过滤掉空token，识别 / 分隔符
  let i = 0;
  while (i < rawTokens.length) {
    const token = rawTokens[i];
    if (token === '/') {
      parts.push({ type: 'space' });
      i++;
      continue;
    }
    // 两个连续的dot-token组成一个字母
    if (token.match(/^\.+$/) && i + 1 < rawTokens.length && rawTokens[i + 1].match(/^\.+$/)) {
      const row = token.length;
      const col = rawTokens[i + 1].length;
      parts.push({ type: 'coord', row, col });
      i += 2;
      continue;
    }
    // 单个dot-token（可能前一个已经是coord了，这里跳过）
    if (token.match(/^\.+$/)) {
      // 尝试作为单独的行/列
      const row = token.length;
      if (i + 1 < rawTokens.length && rawTokens[i + 1].match(/^\.+$/)) {
        const col = rawTokens[i + 1].length;
        parts.push({ type: 'coord', row, col });
        i += 2;
      } else {
        throw new Error(`Tap code decode: unmatched dot token at position ${i}: '${token}'`);
      }
      continue;
    }
    // 非点字符 -> 当作分隔符或直接忽略
    i++;
  }

  const result = [];
  for (const part of parts) {
    if (part.type === 'space') {
      result.push(' ');
      continue;
    }
    if (part.type === 'coord') {
      const key = `${part.row},${part.col}`;
      const letter = TAP_DECODE_MAP[key];
      if (!letter) {
        throw new Error(
          `Tap code decode: invalid coordinate (${part.row},${part.col})`
        );
      }
      result.push(letter.toLowerCase());
    }
  }

  return result.join('');
}

// ==================== A1z26 密码 ====================

/**
 * 将字母转换为对应的数字位置（A=1, B=2, ..., Z=26）
 * @param {string} input
 * @param {{ separator?: string }} [options] - 分隔符，默认 '-'
 * @returns {string}
 */
export function a1z26Encode(input, options = {}) {
  if (typeof input !== 'string') {
    throw new TypeError('A1z26 encode: input must be a string');
  }
  if (input === '') return '';

  const separator = options.separator !== undefined ? options.separator : '-';
  const numbers = [];

  for (const ch of input.toUpperCase()) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      numbers.push(code - 64); // A=65 -> 1
    } else if (ch === ' ') {
      numbers.push(' '); // 空格保留
    } else {
      // 非字母原样保留
      numbers.push(ch);
    }
  }

  return numbers.join(separator);
}

/**
 * 将数字序列还原为字母
 * @param {string} input - 数字序列，如 "1-2-3" 或 "1 2 3"
 * @param {{ separator?: string }} [options] - 分隔符，默认自动检测
 * @returns {string}
 */
export function a1z26Decode(input, options = {}) {
  if (typeof input !== 'string') {
    throw new TypeError('A1z26 decode: input must be a string');
  }

  const trimmed = input.trim();
  if (trimmed === '') return '';

  // 自动检测分隔符
  let separator = options.separator;
  if (separator === undefined) {
    // 检测分隔符：空格或连字符
    if (trimmed.includes('-')) {
      separator = '-';
    } else if (trimmed.includes(' ')) {
      separator = ' ';
    } else {
      // 没有分隔符，尝试按单个字符解析（1-26 的范围）
      separator = null;
    }
  }

  const parts = separator ? trimmed.split(separator) : trimmed.split('');
  const result = [];

  for (const part of parts) {
    const s = part.trim();
    if (s === '') continue;

    const num = parseInt(s, 10);
    if (isNaN(num)) {
      // 非数字原样保留
      result.push(s);
      continue;
    }
    if (num < 1 || num > 26) {
      throw new Error(
        `A1z26 decode: number ${num} out of range (1-26)`
      );
    }
    result.push(String.fromCharCode(num + 64));
  }

  return result.join('');
}

// ==================== 二进制01编码 ====================

/**
 * 将文本转换为二进制01编码
 * @param {string} input
 * @param {{ separator?: string, bitLength?: number }} [options]
 *   - separator: 分隔符，默认 ' '
 *   - bitLength: 每组位数，默认 8
 * @returns {string}
 */
export function binaryEncode(input, options = {}) {
  if (typeof input !== 'string') {
    throw new TypeError('Binary encode: input must be a string');
  }
  if (input === '') return '';

  const separator = options.separator !== undefined ? options.separator : ' ';
  const bitLength = options.bitLength !== undefined ? options.bitLength : 8;
  const bytes = new TextEncoder().encode(input);

  return Array.from(bytes)
    .map(b => b.toString(2).padStart(bitLength, '0'))
    .join(separator);
}

/**
 * 将二进制字符串还原为文本
 * 自动支持8位和7位二进制
 * @param {string} input - 二进制字符串，如 "01000001 01000010"
 * @param {{ separator?: string }} [options] - 分隔符，默认自动检测
 * @returns {string}
 */
export function binaryDecode(input, options = {}) {
  if (typeof input !== 'string') {
    throw new TypeError('Binary decode: input must be a string');
  }

  const trimmed = input.trim();
  if (trimmed === '') return '';

  // 清理输入
  const cleaned = trimmed.replace(/[\s,;]+/g, ' ').trim();

  const parts = cleaned.split(' ');
  const bytes = [];

  for (const part of parts) {
    if (part === '') continue;
    // 验证是否为有效二进制
    if (!/^[01]+$/.test(part)) {
      throw new Error(`Binary decode: invalid binary token '${part}'`);
    }
    const byte = parseInt(part, 2);
    if (isNaN(byte)) {
      throw new Error(`Binary decode: failed to parse '${part}'`);
    }
    bytes.push(byte);
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}
