// ============================================================
// 特殊编码：Emoji / 核心价值观 / 与佛论禅
// ============================================================

// ----------------------------------------------------------
// 1. Emoji 编解码（256 个 emoji 映射到字节 0x00-0xFF）
// ----------------------------------------------------------

/**
 * 256 个 emoji 编码表，覆盖基本多语言面的表情符号
 * 索引 0-255 对应字节值 0x00-0xFF
 */
const EMOJI_TABLE = [
  // 0x00-0x0F
  "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","😘","😗","😙",
  // 0x10-0x1F
  "😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯",
  // 0x20-0x2F
  "😪","😫","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🤑","😲","☹",
  // 0x30-0x3F
  "🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱","🥵",
  // 0x40-0x4F
  "🥶","😳","🤪","😵","😡","😠","🤬","😷","🤒","🤕","🤢","🤮","🤧","😇","🤠","🤡",
  // 0x50-0x5F
  "🤥","🤫","🤭","🧐","🤓","😈","👿","👹","👺","💀","👻","👽","🤖","💩","😺","😸",
  // 0x60-0x6F
  "😹","😻","😼","😽","🙀","😿","😾","🙈","🙉","🙊","💋","💌","💘","💝","💖","💗",
  // 0x70-0x7F
  "💓","💞","💕","💟","❣","💔","❤","🧡","💛","💚","💙","💜","🖤","💯","💢","💥",
  // 0x80-0x8F
  "💫","💦","💨","🕳","💣","💬","👁","🗨","🗯","💭","💤","👋","🤚","🖐","✋","🖖",
  // 0x90-0x9F
  "👌","🤏","✌","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝","👍","👎","✊",
  // 0xA0-0xAF
  "👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍","💅","🤳","💪","🦾","🦵","🦿",
  // 0xB0-0xBF
  "🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁","👅","👄","👶","🧒","👦","👧","🧑",
  // 0xC0-0xCF
  "👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦",
  // 0xD0-0xDF
  "🤷","👮","🕵","💂","👷","🤴","👸","👳","👲","🧕","🤵","👰","🤰","🤱","👼","🎅",
  // 0xE0-0xEF
  "🤶","🦸","🦹","🧙","🧚","🧛","🧜","🧝","🧞","🧟","💆","💇","🚶","🧍","🧎","👯",
  // 0xF0-0xFF
  "🧖","🧗","🤸","🤾","⛷","🏂","🏃","🕺","💃","🛀","🛌","🧘","🍀","🍁","🍂","🍃",
];

// 反向映射表
const EMOJI_REVERSE = {};
EMOJI_TABLE.forEach((emoji, index) => {
  EMOJI_REVERSE[emoji] = index;
});

export const emoji = {
  /**
   * 将文本编码为 Emoji 字符串（每字节映射到一个 emoji）
   * @param {string} input
   * @returns {string}
   */
  encode(input) {
    if (typeof input !== "string") {
      throw new Error("Emoji encode: input must be a string");
    }
    if (input.length === 0) return "";

    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    const result = [];
    for (let i = 0; i < bytes.length; i++) {
      result.push(EMOJI_TABLE[bytes[i]]);
    }
    return result.join("");
  },

  /**
   * 将 Emoji 字符串解码回原始文本
   * @param {string} input
   * @returns {string}
   */
  decode(input) {
    if (typeof input !== "string") {
      throw new Error("Emoji decode: input must be a string");
    }
    if (input.length === 0) return "";

    // 按 emoji 拆分（emoji 可能由多个码点组成，使用扩展 grapheme 或按已知表匹配）
    const bytes = [];
    let i = 0;
    while (i < input.length) {
      let matched = false;
      // 尝试匹配已知 emoji（从长到短尝试，虽然这里都是基本 BMP emoji）
      for (const emojiChar of EMOJI_TABLE) {
        if (input.startsWith(emojiChar, i)) {
          bytes.push(EMOJI_REVERSE[emojiChar]);
          i += emojiChar.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        throw new Error(
          `Emoji decode: unknown emoji sequence at position ${i}: '${input.slice(i, i + 4)}...'`
        );
      }
    }

    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
  },
};

// ----------------------------------------------------------
// 2. 核心价值观编码 (Core Socialist Values)
// ----------------------------------------------------------

/**
 * 12 个核心价值观词组，作为 12 进制编码表
 */
const CORE_VALUES = [
  "富强", "民主", "文明", "和谐",
  "自由", "平等", "公正", "法治",
  "爱国", "敬业", "诚信", "友善",
];

// 反向映射：词组 -> 0-11
const CORE_VALUES_REVERSE = {};
CORE_VALUES.forEach((val, idx) => {
  CORE_VALUES_REVERSE[val] = idx;
});

export const coreSocialistValues = {
  /**
   * 将文本编码为核心价值观字符串
   * 流程：文本 -> UTF-8 字节 -> 视为大整数 -> 转 12 进制 -> 每个 12 进制位映射到词组
   * @param {string} input
   * @returns {string} 空格分隔的核心价值观词组
   */
  encode(input) {
    if (typeof input !== "string") {
      throw new Error("Core Socialist Values encode: input must be a string");
    }
    if (input.length === 0) return "";

    // 转换为 UTF-8 字节
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);

    // 将字节数组视为一个大整数（big-endian），转为 12 进制
    if (bytes.length === 0) return "";

    // 方案：逐字节转换为 12 进制，每个字节最多 2 位 12 进制（255 < 12^2=144，所以需要）
    // 简单方案：把所有字节拼接成大数转 12 进制，但这会让编码很长
    // 更实用的方案：每个字节独立转为 12 进制（1-2 位），然后拼接
    // 这里采用整体转换方案，保证编码紧凑

    // 构建大整数（hex 方式处理）
    let hexStr = "";
    for (let i = 0; i < bytes.length; i++) {
      hexStr += bytes[i].toString(16).padStart(2, "0");
    }

    // 大整数转 12 进制
    let bigNum = BigInt("0x" + (hexStr || "0"));
    if (bigNum === 0n) {
      return CORE_VALUES[0]; // "富强" 表示 0
    }

    const base = 12n;
    const result = [];
    while (bigNum > 0n) {
      const remainder = Number(bigNum % base);
      result.unshift(CORE_VALUES[remainder]);
      bigNum = bigNum / base;
    }

    return result.join(" ");
  },

  /**
   * 将核心价值观字符串解码为原始文本
   * @param {string} input - 空格分隔的核心价值观词组
   * @returns {string}
   */
  decode(input) {
    if (typeof input !== "string") {
      throw new Error("Core Socialist Values decode: input must be a string");
    }
    if (input.trim().length === 0) return "";

    // 按空格、全角空格、逗号等分割
    const tokens = input.split(/[\s　,，、]+/).filter(t => t.length > 0);

    // 从 12 进制转回大整数
    let bigNum = 0n;
    const base = 12n;
    for (const token of tokens) {
      const val = CORE_VALUES_REVERSE[token];
      if (val === undefined) {
        throw new Error(`Core Socialist Values decode: unknown value '${token}'`);
      }
      bigNum = bigNum * base + BigInt(val);
    }

    // 大整数转字节数组
    if (bigNum === 0n) {
      // 原值为 0，对应空或单字节 0
      return "\x00";
    }

    let hexStr = bigNum.toString(16);
    // 确保 hex 长度为偶数
    if (hexStr.length % 2 !== 0) {
      hexStr = "0" + hexStr;
    }

    const bytes = [];
    for (let i = 0; i < hexStr.length; i += 2) {
      bytes.push(parseInt(hexStr.substring(i, i + 2), 16));
    }

    const decoder = new TextDecoder();
    try {
      return decoder.decode(new Uint8Array(bytes));
    } catch (e) {
      throw new Error(`Core Socialist Values decode: invalid UTF-8 sequence - ${e.message}`);
    }
  },
};

// ----------------------------------------------------------
// 3. 与佛论禅编码 (Buddha encoding)
// ----------------------------------------------------------

/**
 * 64 个佛经常用汉字编码表（base64 风格映射）
 * 每个字符对应 0-63 的值
 */
const BUDDHA_TABLE = [
  "如", "是", "我", "闻", "一", "时", "佛", "在",
  "舍", "卫", "国", "祇", "树", "给", "孤", "独",
  "园", "与", "大", "比", "丘", "众", "千", "二",
  "百", "五", "十", "人", "俱", "尔", "世", "尊",
  "食", "着", "衣", "持", "钵", "入", "城", "乞",
  "已", "还", "本", "处", "收", "洗", "足", "敷",
  "座", "而", "坐", "诸", "来", "者", "善", "男",
  "子", "女", "云", "何", "应", "住", "降", "伏",
];

// 反向映射表
const BUDDHA_REVERSE = {};
BUDDHA_TABLE.forEach((char, idx) => {
  BUDDHA_REVERSE[char] = idx;
});

export const buddha = {
  /**
   * 将文本编码为佛经风格字符串
   * 流程：文本 -> UTF-8 字节 -> 每 3 个字节编码为 4 个佛经字符（类似 base64）
   * @param {string} input
   * @returns {string}
   */
  encode(input) {
    if (typeof input !== "string") {
      throw new Error("Buddha encode: input must be a string");
    }
    if (input.length === 0) return "";

    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    const result = [];

    // 类似 base64 编码：每 3 字节 -> 4 个 6-bit 字符
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i];
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

      const combined = (b0 << 16) | (b1 << 8) | b2;

      result.push(BUDDHA_TABLE[(combined >> 18) & 0x3f]);
      result.push(BUDDHA_TABLE[(combined >> 12) & 0x3f]);

      if (i + 1 < bytes.length) {
        result.push(BUDDHA_TABLE[(combined >> 6) & 0x3f]);
      } else {
        // 只有 1 个字节时，后两位用特殊标记 = 不方便，跳过
        // 这里用一个额外标记：用 64 表示填充（但表只有 64 个）
        // 简化处理：在编码前先记录原长度
      }

      if (i + 2 < bytes.length) {
        result.push(BUDDHA_TABLE[combined & 0x3f]);
      }
    }

    return result.join("");
  },

  /**
   * 将佛经风格字符串解码为原始文本
   * @param {string} input
   * @returns {string}
   */
  decode(input) {
    if (typeof input !== "string") {
      throw new Error("Buddha decode: input must be a string");
    }
    if (input.length === 0) return "";

    // 收集有效的佛经字符
    const indices = [];
    for (const ch of input) {
      const val = BUDDHA_REVERSE[ch];
      if (val !== undefined) {
        indices.push(val);
      }
      // 忽略不在表中的字符（如空格、标点等）
    }

    if (indices.length === 0) return "";

    const bytes = [];
    // 每 4 个 6-bit 值 -> 3 个字节（base64 解码）
    for (let i = 0; i < indices.length; i += 4) {
      const v0 = indices[i];
      const v1 = i + 1 < indices.length ? indices[i + 1] : 0;
      const v2 = i + 2 < indices.length ? indices[i + 2] : 0;
      const v3 = i + 3 < indices.length ? indices[i + 3] : 0;

      const combined = (v0 << 18) | (v1 << 12) | (v2 << 6) | v3;

      bytes.push((combined >> 16) & 0xff);

      const remaining = indices.length - i;
      if (remaining >= 3) {
        bytes.push((combined >> 8) & 0xff);
      }
      if (remaining >= 4) {
        bytes.push(combined & 0xff);
      }
    }

    const decoder = new TextDecoder();
    try {
      return decoder.decode(new Uint8Array(bytes));
    } catch (e) {
      throw new Error(`Buddha decode: invalid UTF-8 sequence - ${e.message}`);
    }
  },
};
