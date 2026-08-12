// ============================================================
// 经典古典密码编解码模块
// 每个密码提供 encode(input, options?) 和 decode(input, options?)
// ============================================================

// -------------------- 1. 莫斯密码 (Morse) --------------------

const MORSE_TABLE = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',
  E: '.',     F: '..-.',  G: '--.',   H: '....',
  I: '..',    J: '.---',  K: '-.-',   L: '.-..',
  M: '--',    N: '-.',    O: '---',   P: '.--.',
  Q: '--.-',  R: '.-.',   S: '...',   T: '-',
  U: '..-',   V: '...-',  W: '.--',   X: '-..-',
  Y: '-.--',  Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--',
  4: '....-', 5: '.....', 6: '-....', 7: '--...',
  8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.',
};

const MORSE_REVERSE = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([k, v]) => [v, k])
);

export const morse = {
  encode(input, _options) {
    if (!input) return '';
    const chars = [];
    for (const ch of input.toUpperCase()) {
      if (ch === ' ') {
        chars.push('/');
      } else if (MORSE_TABLE[ch] !== undefined) {
        chars.push(MORSE_TABLE[ch]);
      } else {
        throw new Error(`莫斯密码编码失败：不支持的字符 "${ch}"`);
      }
    }
    return chars.join(' ');
  },

  decode(input, _options) {
    if (!input) return '';
    const tokens = input.trim().split(/\s+/);
    const result = [];
    for (const token of tokens) {
      if (token === '/') {
        result.push(' ');
      } else if (MORSE_REVERSE[token] !== undefined) {
        result.push(MORSE_REVERSE[token]);
      } else {
        throw new Error(`莫斯密码解码失败：无法识别的莫斯码 "${token}"`);
      }
    }
    return result.join('');
  },
};

// -------------------- 2. 培根密码 (Bacon) --------------------

// 标准培根字母映射: A=0=AAAAA ... Z=25=BBAAB
function buildBaconStandard() {
  const map = {};
  for (let i = 0; i < 26; i++) {
    const binary = i.toString(2).padStart(5, '0');
    const bacon = binary.replace(/0/g, 'A').replace(/1/g, 'B');
    map[String.fromCharCode(65 + i)] = bacon;
  }
  return map;
}

function buildBaconIJUV(standard) {
  // I/J 都用 I 的编码, U/V 都用 U 的编码
  const map = { ...standard };
  map['J'] = standard['I'];
  map['V'] = standard['U'];
  return map;
}

const BACON_STANDARD = buildBaconStandard();
const BACON_IJUV = buildBaconIJUV(BACON_STANDARD);

// 解码表: bacon码 -> 字母
function buildBaconDecodeTable(variant) {
  const table = variant === 'ijuv' ? BACON_IJUV : BACON_STANDARD;
  const decode = {};
  for (const [letter, bacon] of Object.entries(table)) {
    // 对于 ijuv 模式, J->I, V->U，所以 decode 表中保留第一个遇到的映射
    if (!decode[bacon]) {
      decode[bacon] = letter;
    }
  }
  return decode;
}

export const bacon = {
  encode(input, options = {}) {
    if (!input) return '';
    const { variant = 'standard' } = options;
    const table = variant === 'ijuv' ? BACON_IJUV : BACON_STANDARD;
    const result = [];
    for (const ch of input.toUpperCase()) {
      if (ch >= 'A' && ch <= 'Z') {
        result.push(table[ch]);
      } else if (ch === 'J' && variant === 'ijuv') {
        result.push(table['I']);
      } else if (ch === 'V' && variant === 'ijuv') {
        result.push(table['U']);
      } else {
        // 非字母保留原样
        result.push(ch);
      }
    }
    return result.join('');
  },

  decode(input, options = {}) {
    if (!input) return '';
    const { variant = 'standard' } = options;
    const decodeTable = buildBaconDecodeTable(variant);

    // 提取连续的 A/B 序列（忽略大小写），非字母保留
    const result = [];
    let buffer = '';
    for (const ch of input.toUpperCase()) {
      if (ch === 'A' || ch === 'B') {
        buffer += ch;
        if (buffer.length === 5) {
          if (decodeTable[buffer] !== undefined) {
            result.push(decodeTable[buffer]);
          } else {
            throw new Error(`培根密码解码失败：无法识别的培根码 "${buffer}"`);
          }
          buffer = '';
        }
      } else {
        // 非 A/B 字符：先清空 buffer（如果 buffer 非空且不足5位）
        if (buffer.length > 0) {
          throw new Error(`培根密码解码失败：不完整的培根码 "${buffer}"（长度不为5）`);
        }
        result.push(ch);
      }
    }
    if (buffer.length > 0) {
      throw new Error(`培根密码解码失败：不完整的培根码 "${buffer}"（长度不为5）`);
    }
    return result.join('');
  },
};

// -------------------- 3. 云影密码 (YunYing / 01248) --------------------

// 云影密码：将字母序号(1-26)用 8/4/2/1 贪心分解，数字升序拼接
// 字母间用 "0" 分隔

const YUNYING_DIGITS = [8, 4, 2, 1];
const YUNYING_SEPARATOR = '0';

function yunyingEncodeLetter(n) {
  // n: 1-26 字母位置
  let remaining = n;
  const digits = [];
  for (const d of YUNYING_DIGITS) {
    while (remaining >= d) {
      digits.push(d);
      remaining -= d;
    }
  }
  // 升序排列
  digits.sort((a, b) => a - b);
  return digits.join('');
}

function yunyingDecodeLetter(s) {
  if (s === '') return null;
  let sum = 0;
  for (const ch of s) {
    const d = parseInt(ch, 10);
    if (isNaN(d)) return null;
    sum += d;
  }
  return sum >= 1 && sum <= 26 ? sum : null;
}

export const yunying = {
  encode(input) {
    if (!input) return '';
    const groups = [];
    for (const ch of input.toUpperCase()) {
      if (ch < 'A' || ch > 'Z') {
        throw new Error(`云影密码编码失败：不支持的字符 "${ch}"`);
      }
      const n = ch.charCodeAt(0) - 64; // A=1 ... Z=26
      groups.push(yunyingEncodeLetter(n));
    }
    return groups.join(YUNYING_SEPARATOR);
  },

  decode(input) {
    if (!input) return '';
    // 按分隔符 "0" 分割
    const parts = input.split(YUNYING_SEPARATOR);
    const result = [];
    for (const part of parts) {
      const n = yunyingDecodeLetter(part);
      if (n === null) {
        throw new Error(`云影密码解码失败：无法解析的数字组 "${part}"`);
      }
      result.push(String.fromCharCode(64 + n));
    }
    return result.join('');
  },
};

// -------------------- 4. 埃特巴什码 (Atbash) --------------------

function atbashChar(ch) {
  if (ch >= 'A' && ch <= 'Z') {
    return String.fromCharCode(90 - (ch.charCodeAt(0) - 65)); // Z - offset
  }
  if (ch >= 'a' && ch <= 'z') {
    return String.fromCharCode(122 - (ch.charCodeAt(0) - 97)); // z - offset
  }
  return ch;
}

export const atbash = {
  encode(input) {
    if (!input) return '';
    let result = '';
    for (const ch of input) {
      result += atbashChar(ch);
    }
    return result;
  },

  decode(input) {
    // 对称密码，encode == decode
    if (!input) return '';
    let result = '';
    for (const ch of input) {
      result += atbashChar(ch);
    }
    return result;
  },
};

// -------------------- 5. 波利比奥斯方阵密码 (Polybius Square) --------------------

// 默认方阵：A-Z 按顺序填充 5x5，I/J 共用位置 (行2, 列4)
function buildDefaultSquare() {
  const square = [];
  const letters = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // J 被 I 替代
  for (let row = 0; row < 5; row++) {
    square[row] = [];
    for (let col = 0; col < 5; col++) {
      square[row][col] = letters[row * 5 + col];
    }
  }
  return square;
}

function buildPositionMap(square) {
  const map = {};
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const ch = square[r][c];
      if (!map[ch]) {
        map[ch] = { row: r + 1, col: c + 1 };
      }
    }
  }
  // I 和 J 映射到同一位置
  if (map['I']) {
    map['J'] = map['I'];
  }
  return map;
}

function buildReverseMap(square) {
  const map = {};
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const key = `${r + 1}${c + 1}`;
      map[key] = square[r][c];
    }
  }
  return map;
}

const DEFAULT_SQUARE = buildDefaultSquare();

export const polybius = {
  encode(input, options = {}) {
    if (!input) return '';
    const { square = DEFAULT_SQUARE } = options;
    const posMap = buildPositionMap(square);
    const result = [];
    for (const ch of input.toUpperCase()) {
      if (ch < 'A' || ch > 'Z') {
        throw new Error(`波利比奥斯方阵编码失败：不支持的字符 "${ch}"`);
      }
      const pos = posMap[ch];
      if (!pos) {
        throw new Error(`波利比奥斯方阵编码失败：不支持的字符 "${ch}"`);
      }
      result.push(`${pos.row}${pos.col}`);
    }
    return result.join('');
  },

  decode(input, options = {}) {
    if (!input) return '';
    const { square = DEFAULT_SQUARE } = options;
    const revMap = buildReverseMap(square);

    // 输入每两位一组
    const cleaned = input.replace(/\s+/g, '');
    if (cleaned.length % 2 !== 0) {
      throw new Error('波利比奥斯方阵解码失败：输入长度必须为偶数');
    }

    const result = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      const key = cleaned[i] + cleaned[i + 1];
      const row = parseInt(cleaned[i], 10);
      const col = parseInt(cleaned[i + 1], 10);
      if (row < 1 || row > 5 || col < 1 || col > 5 || isNaN(row) || isNaN(col)) {
        throw new Error(`波利比奥斯方阵解码失败：无效的坐标 "${key}"`);
      }
      if (!revMap[key]) {
        throw new Error(`波利比奥斯方阵解码失败：无效的坐标 "${key}"`);
      }
      result.push(revMap[key]);
    }
    return result.join('');
  },
};

// -------------------- 6. 凯撒密码 (Caesar) --------------------

function caesarShift(ch, shift) {
  if (ch >= 'A' && ch <= 'Z') {
    return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift + 26) % 26) + 65);
  }
  if (ch >= 'a' && ch <= 'z') {
    return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift + 26) % 26) + 97);
  }
  return ch;
}

export const caesar = {
  encode(input, options = {}) {
    if (!input) return '';
    const { shift = 3 } = options;
    let result = '';
    for (const ch of input) {
      result += caesarShift(ch, shift);
    }
    return result;
  },

  decode(input, options = {}) {
    if (!input) return '';
    const { shift = 3 } = options;
    let result = '';
    for (const ch of input) {
      result += caesarShift(ch, -shift);
    }
    return result;
  },
};

// -------------------- 7. 栅栏密码 (Rail Fence) --------------------

export const railFence = {
  encode(input, options = {}) {
    if (!input) return '';
    const { rails = 3 } = options;
    if (rails < 2) return input;
    if (rails >= input.length) return input;

    // 创建 rails 行
    const fence = Array.from({ length: rails }, () => []);
    let rail = 0;
    let direction = 1; // 1 = 向下, -1 = 向上

    for (const ch of input) {
      fence[rail].push(ch);
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction = -direction;
      }
    }

    return fence.map(row => row.join('')).join('');
  },

  decode(input, options = {}) {
    if (!input) return '';
    const { rails = 3 } = options;
    if (rails < 2) return input;
    if (rails >= input.length) return input;

    const len = input.length;

    // 先计算每行有多少个字符（按 Z 字形走一遍标记位置）
    const railLengths = new Array(rails).fill(0);
    let rail = 0;
    let direction = 1;
    for (let i = 0; i < len; i++) {
      railLengths[rail]++;
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction = -direction;
      }
    }

    // 将密文按行切分
    const rows = [];
    let offset = 0;
    for (let r = 0; r < rails; r++) {
      rows.push(input.slice(offset, offset + railLengths[r]).split(''));
      offset += railLengths[r];
    }

    // 按 Z 字形读取还原
    const result = [];
    rail = 0;
    direction = 1;
    const rowIdx = new Array(rails).fill(0);
    for (let i = 0; i < len; i++) {
      result.push(rows[rail][rowIdx[rail]]);
      rowIdx[rail]++;
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction = -direction;
      }
    }

    return result.join('');
  },
};

// ============================================================
// 统一导出
// ============================================================

export default {
  morse,
  bacon,
  yunying,
  atbash,
  polybius,
  caesar,
  railFence,
};
