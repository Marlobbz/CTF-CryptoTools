// CTF密码编解码工具箱 - 统一导出索引

// ========== 进制类编码 ==========
export {
  encodeBase16, decodeBase16,
  encodeBase32, decodeBase32,
  encodeBase36, decodeBase36,
  encodeBase58, decodeBase58,
  encodeBase62, decodeBase62,
  encodeBase64, decodeBase64,
  encodeBase85, decodeBase85,
  encodeBase91, decodeBase91,
  encodeBase92, decodeBase92,
} from './base-encodings.js';

// ========== ROT系列密码 ==========
export {
  rot5Encode, rot5Decode,
  rot13Encode, rot13Decode,
  rot18Encode, rot18Decode,
  rot47Encode, rot47Decode,
} from './rot-ciphers.js';

// ========== 经典古典密码 ==========
export {
  morse, bacon, yunying, atbash, polybius, caesar, railFence,
} from './classic-ciphers.js';

// ========== 传输编码 ==========
export {
  uuencode_encode, uuencode_decode,
  xxencode_encode, xxencode_decode,
  aaencode_encode, aaencode_decode,
  jjencode_encode, jjencode_decode,
} from './transmission-encodings.js';

// ========== 迷惑性脚本编码 ==========
export {
  brainfuck, jsfuck, jother,
} from './esoteric.js';

// ========== 特殊编码 ==========
export {
  emoji, coreSocialistValues, buddha,
} from './special-encodings.js';

// ========== 网络与技术类编码 ==========
export {
  urlEncode, urlDecode,
  shellcodeEncode, shellcodeDecode,
  handycodeEncode, handycodeDecode,
  qpEncode, qpDecode,
} from './network-encodings.js';

// ========== 其他CTF密码 ==========
export {
  tapCodeEncode, tapCodeDecode,
  a1z26Encode, a1z26Decode,
  binaryEncode, binaryDecode,
} from './other-ciphers.js';

// ========== 分组导出，方便按类别查找 ==========
export const CATEGORIES = {
  '进制编码': {
    tools: {
      base16: { name: 'Base16(Hex)', encode: 'encodeBase16', decode: 'decodeBase16' },
      base32: { name: 'Base32', encode: 'encodeBase32', decode: 'decodeBase32' },
      base36: { name: 'Base36', encode: 'encodeBase36', decode: 'decodeBase36' },
      base58: { name: 'Base58', encode: 'encodeBase58', decode: 'decodeBase58' },
      base62: { name: 'Base62', encode: 'encodeBase62', decode: 'decodeBase62' },
      base64: { name: 'Base64', encode: 'encodeBase64', decode: 'decodeBase64' },
      base85: { name: 'Base85', encode: 'encodeBase85', decode: 'decodeBase85' },
      base91: { name: 'Base91', encode: 'encodeBase91', decode: 'decodeBase91' },
      base92: { name: 'Base92', encode: 'encodeBase92', decode: 'decodeBase92' },
    },
  },
  'ROT密码': {
    tools: {
      rot5: { name: 'ROT5（数字旋转）', encode: 'rot5Encode', decode: 'rot5Decode' },
      rot13: { name: 'ROT13（字母旋转）', encode: 'rot13Encode', decode: 'rot13Decode' },
      rot18: { name: 'ROT18（字母+数字）', encode: 'rot18Encode', decode: 'rot18Decode' },
      rot47: { name: 'ROT47（可打印字符）', encode: 'rot47Encode', decode: 'rot47Decode' },
    },
  },
  '古典密码': {
    tools: {
      morse: { name: '莫斯密码', encode: 'morse_encode', decode: 'morse_decode' },
      bacon: { name: '培根密码', encode: 'bacon_encode', decode: 'bacon_decode' },
      yunying: { name: '云影密码', encode: 'yunying_encode', decode: 'yunying_decode' },
      atbash: { name: '埃特巴什码', encode: 'atbash_encode', decode: 'atbash_decode' },
      polybius: { name: '波利比奥斯方阵', encode: 'polybius_encode', decode: 'polybius_decode' },
      caesar: { name: '凯撒密码', encode: 'caesar_encode', decode: 'caesar_decode' },
      railFence: { name: '栅栏密码', encode: 'railFence_encode', decode: 'railFence_decode' },
    },
  },
  '传输编码': {
    tools: {
      uuencode: { name: 'UUencode', encode: 'uuencode_encode', decode: 'uuencode_decode' },
      xxencode: { name: 'XXencode', encode: 'xxencode_encode', decode: 'xxencode_decode' },
      aaencode: { name: 'AAencode', encode: 'aaencode_encode', decode: 'aaencode_decode' },
      jjencode: { name: 'JJencode', encode: 'jjencode_encode', decode: 'jjencode_decode' },
    },
  },
  '脚本编码': {
    tools: {
      brainfuck: { name: 'Brainfuck', encode: 'brainfuck_encode', decode: 'brainfuck_decode' },
      jsfuck: { name: 'JSFuck', encode: 'jsfuck_encode', decode: 'jsfuck_decode' },
      jother: { name: 'Jother', encode: 'jother_encode', decode: 'jother_decode' },
    },
  },
  '特殊编码': {
    tools: {
      emoji: { name: 'Emoji编码', encode: 'emoji_encode', decode: 'emoji_decode' },
      core_values: { name: '核心价值观编码', encode: 'csv_encode', decode: 'csv_decode' },
      buddha: { name: '与佛论禅编码', encode: 'buddha_encode', decode: 'buddha_decode' },
    },
  },
  '网络编码': {
    tools: {
      url: { name: 'URL编码', encode: 'urlEncode', decode: 'urlDecode' },
      shellcode: { name: 'Shellcode编码', encode: 'shellcodeEncode', decode: 'shellcodeDecode' },
      handycode: { name: 'Handycode编码', encode: 'handycodeEncode', decode: 'handycodeDecode' },
      qp: { name: 'Quoted-Printable', encode: 'qpEncode', decode: 'qpDecode' },
    },
  },
  '其他密码': {
    tools: {
      tapCode: { name: '敲击码', encode: 'tapCodeEncode', decode: 'tapCodeDecode' },
      a1z26: { name: 'A1z26密码', encode: 'a1z26Encode', decode: 'a1z26Decode' },
      binary: { name: '二进制编码', encode: 'binaryEncode', decode: 'binaryDecode' },
    },
  },
};

// ========== 查找工具 ==========
export function findTool(encodeFnName) {
  for (const cat of Object.values(CATEGORIES)) {
    for (const [key, tool] of Object.entries(cat.tools)) {
      if (tool.encode === encodeFnName || tool.decode === encodeFnName) {
        return { category: cat, key, tool };
      }
    }
  }
  return null;
}
