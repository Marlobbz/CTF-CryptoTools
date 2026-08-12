import { describe, it, expect } from '@jest/globals';

// ================================================================
// 性能测试
// 对每种编码测试处理不同大小输入的耗时
// 要求处理时间在合理范围内
// ================================================================

import {
  encodeBase16, decodeBase16,
  encodeBase32, decodeBase32,
  encodeBase36, decodeBase36,
  encodeBase58, decodeBase58,
  encodeBase62, decodeBase62,
  encodeBase64, decodeBase64,
  encodeBase85, decodeBase85,
  encodeBase91, decodeBase91,
  encodeBase92, decodeBase92,
} from '../src/core/base-encodings.js';

import {
  rot5Encode, rot5Decode,
  rot13Encode, rot13Decode,
  rot18Encode, rot18Decode,
  rot47Encode, rot47Decode,
} from '../src/core/rot-ciphers.js';

import {
  urlEncode, urlDecode,
  shellcodeEncode, shellcodeDecode,
  handycodeEncode, handycodeDecode,
  qpEncode, qpDecode,
} from '../src/core/network-encodings.js';

import {
  uuencode_encode, uuencode_decode,
  xxencode_encode, xxencode_decode,
} from '../src/core/transmission-encodings.js';

import {
  tapCodeEncode, tapCodeDecode,
  a1z26Encode, a1z26Decode,
  binaryEncode, binaryDecode,
} from '../src/core/other-ciphers.js';

import { emoji, coreSocialistValues, buddha } from '../src/core/special-encodings.js';

/** 生成可打印ASCII测试文本 */
function generateTestText(size) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !?.';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars[(i * 7 + i * i) % chars.length];
  }
  return result;
}

/** 生成纯数字测试文本 */
function generateNumericText(size) {
  let result = '';
  for (let i = 0; i < size; i++) {
    result += String((i * 7) % 10);
  }
  return result;
}

/** 生成纯字母测试文本 */
function generateAlphaText(size) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars[(i * 7 + i * i) % chars.length];
  }
  return result;
}

function measureTime(fn, input) {
  const start = performance.now();
  fn(input);
  return performance.now() - start;
}

const SIZES = [1024, 10240, 102400]; // 1KB, 10KB, 100KB
const SMALL_SIZES = [64, 256, 1024]; // 64B, 256B, 1KB
const TINY_SIZES = [64, 256]; // BigInt-based encodings

function sizeLabel(n) {
  return n >= 102400 ? `${n / 1024}KB` : n >= 1024 ? `${n / 1024}KB` : `${n}B`;
}

// ================================================================
// 进制编码性能
// ================================================================
describe('进制编码性能测试', () => {
  const encodings = [
    ['Base16', encodeBase16, decodeBase16],
    ['Base32', encodeBase32, decodeBase32],
    ['Base64', encodeBase64, decodeBase64],
    ['Base85', encodeBase85, decodeBase85],
    ['Base91', encodeBase91, decodeBase91],
    ['Base92', encodeBase92, decodeBase92],
  ];

  for (const [name, enc, dec] of encodings) {
    describe(name, () => {
      for (const size of SIZES) {
        it(`encode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = generateTestText(size);
          expect(measureTime(enc, input)).toBeLessThan(5000);
        });
        it(`decode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = generateTestText(size);
          const encoded = enc(input);
          expect(measureTime(dec, encoded)).toBeLessThan(5000);
        });
      }
    });
  }
});

// ================================================================
// BigInt进制编码（只测极小数据）
// ================================================================
describe('BigInt进制编码性能测试', () => {
  const encodings = [
    ['Base36', encodeBase36, decodeBase36],
    ['Base58', encodeBase58, decodeBase58],
    ['Base62', encodeBase62, decodeBase62],
  ];

  for (const [name, enc, dec] of encodings) {
    describe(name, () => {
      for (const size of TINY_SIZES) {
        it(`encode ${sizeLabel(size)} ≤ 2s`, () => {
          const input = generateTestText(size);
          expect(measureTime(enc, input)).toBeLessThan(2000);
        });
        it(`decode ${sizeLabel(size)} ≤ 2s`, () => {
          const input = generateTestText(size);
          const encoded = enc(input);
          expect(measureTime(dec, encoded)).toBeLessThan(2000);
        });
      }
    });
  }
});

// ================================================================
// ROT系列
// ================================================================
describe('ROT系列性能测试', () => {
  const encodings = [
    ['ROT5', rot5Encode, rot5Decode, generateNumericText],
    ['ROT13', rot13Encode, rot13Decode, generateTestText],
    ['ROT18', rot18Encode, rot18Decode, generateTestText],
    ['ROT47', rot47Encode, rot47Decode, generateTestText],
  ];

  for (const [name, enc, dec, gen] of encodings) {
    describe(name, () => {
      for (const size of SIZES) {
        it(`encode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = gen(size);
          expect(measureTime(enc, input)).toBeLessThan(5000);
        });
        it(`decode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = gen(size);
          const encoded = enc(input);
          expect(measureTime(dec, encoded)).toBeLessThan(5000);
        });
      }
    });
  }
});

// ================================================================
// 网络编码
// ================================================================
describe('网络编码性能测试', () => {
  const encodings = [
    ['URL编码', urlEncode, urlDecode],
    ['Shellcode', shellcodeEncode, shellcodeDecode],
    ['Handycode', handycodeEncode, handycodeDecode],
    ['Quoted-printable', qpEncode, qpDecode],
    ['UUencode', uuencode_encode, uuencode_decode],
    ['XXencode', xxencode_encode, xxencode_decode],
  ];

  for (const [name, enc, dec] of encodings) {
    describe(name, () => {
      for (const size of SIZES) {
        it(`encode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = generateTestText(size);
          expect(measureTime(enc, input)).toBeLessThan(5000);
        });
        it(`decode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = generateTestText(size);
          const encoded = enc(input);
          expect(measureTime(dec, encoded)).toBeLessThan(5000);
        });
      }
    });
  }
});

// ================================================================
// 其他密码性能（敲击码只支持大写字母）
// ================================================================
describe('其他密码性能测试', () => {
  describe('敲击码', () => {
    for (const size of SIZES) {
      it(`encode ${sizeLabel(size)} ≤ 5s`, () => {
        const input = generateAlphaText(size);
        expect(measureTime(tapCodeEncode, input)).toBeLessThan(5000);
      });
      it(`decode ${sizeLabel(size)} ≤ 5s`, () => {
        const input = generateAlphaText(size);
        const encoded = tapCodeEncode(input);
        expect(measureTime(tapCodeDecode, encoded)).toBeLessThan(5000);
      });
    }
  });

  describe('A1z26', () => {
    for (const size of SIZES) {
      it(`encode ${sizeLabel(size)} ≤ 5s`, () => {
        const input = generateAlphaText(size);
        expect(measureTime(a1z26Encode, input)).toBeLessThan(5000);
      });
      it(`decode ${sizeLabel(size)} ≤ 5s`, () => {
        const input = generateAlphaText(size);
        const encoded = a1z26Encode(input);
        expect(measureTime(a1z26Decode, encoded)).toBeLessThan(5000);
      });
    }
  });

  describe('二进制编码', () => {
    for (const size of SIZES) {
      it(`encode ${sizeLabel(size)} ≤ 5s`, () => {
        const input = generateTestText(size);
        expect(measureTime(binaryEncode, input)).toBeLessThan(5000);
      });
      it(`decode ${sizeLabel(size)} ≤ 5s`, () => {
        const input = generateTestText(size);
        const encoded = binaryEncode(input);
        expect(measureTime(binaryDecode, encoded)).toBeLessThan(5000);
      });
    }
  });
});

// ================================================================
// 特殊编码（大数据极慢，只测小数据）
// ================================================================
describe('特殊编码性能测试', () => {
  const encodings = [
    ['Emoji编码', emoji.encode, emoji.decode],
    ['核心价值观', coreSocialistValues.encode, coreSocialistValues.decode],
    ['与佛论禅', buddha.encode, buddha.decode],
  ];

  for (const [name, enc, dec] of encodings) {
    describe(name, () => {
      for (const size of SMALL_SIZES) {
        it(`encode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = generateTestText(size);
          expect(measureTime(enc, input)).toBeLessThan(5000);
        });
        it(`decode ${sizeLabel(size)} ≤ 5s`, () => {
          const input = generateTestText(size);
          const encoded = enc(input);
          expect(measureTime(dec, encoded)).toBeLessThan(5000);
        });
      }
    });
  }
});
