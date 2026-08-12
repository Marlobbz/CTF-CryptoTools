import { describe, it, expect } from '@jest/globals';
import {
  encodeBase16, decodeBase16,
  encodeBase32, decodeBase32,
  encodeBase64, decodeBase64,
} from '../src/core/base-encodings.js';
import { rot13Encode, rot13Decode } from '../src/core/rot-ciphers.js';
import { morse } from '../src/core/classic-ciphers.js';
import { urlEncode, urlDecode } from '../src/core/network-encodings.js';
import { binaryEncode, binaryDecode } from '../src/core/other-ciphers.js';

// ================================================================
// 端到端集成测试
// 模拟CTF真实场景中的多层嵌套编码
// ================================================================

describe('CTF场景集成测试', () => {
  describe('场景1: 单层编码往返', () => {
    it('Base64 编解码往返', () => {
      const flag = 'flag{simple_test}';
      const enc = encodeBase64(flag);
      const dec = decodeBase64(enc);
      expect(dec).toBe(flag);
    });

    it('ROT13 对称编码', () => {
      const message = 'SensitiveData';
      const encoded = rot13Encode(message);
      const decoded = rot13Decode(encoded);
      expect(decoded).toBe(message);
    });
  });

  describe('场景2: 双层嵌套编码 - Base64 -> Base32', () => {
    it('Base64编码后再Base32编码，然后反向解码', () => {
      const flag = 'flag{nested_b64_b32}';

      // 编码链路
      const b64 = encodeBase64(flag);
      const b32 = encodeBase32(b64);

      // 解码链路
      const b32Dec = decodeBase32(b32);
      const flagDec = decodeBase64(b32Dec);

      expect(flagDec).toBe(flag);
    });
  });

  describe('场景3: 三层嵌套编码 - ROT13 -> Base64 -> Hex', () => {
    it('ROT13 -> Base64 -> Hex 编码链，反向解码成功', () => {
      const flag = 'flag{multi_layer}';

      // 编码链路: ROT13 -> Base64 -> Hex
      const step1 = rot13Encode(flag);
      const step2 = encodeBase64(step1);
      const step3 = encodeBase16(step2);

      // 解码链路: Hex -> Base64 -> ROT13
      const dec1 = decodeBase16(step3);
      const dec2 = decodeBase64(dec1);
      const final = rot13Decode(dec2);

      expect(final).toBe(flag);
    });
  });

  describe('场景4: 多层嵌套 + 特殊场景', () => {
    it('Hex -> Base32 -> URL编码 -> 逆向还原', () => {
      const flag = 'ctf{challenge_2024}';

      // 编码链
      const hex = encodeBase16(flag);
      const b32 = encodeBase32(hex);
      const urled = urlEncode(b32);

      // 解码链（逆向）
      const unurled = urlDecode(urled);
      const b32Decoded = decodeBase32(unurled);
      const hexDecoded = decodeBase16(b32Decoded);

      expect(hexDecoded).toBe(flag);
    });

    it('莫斯密码 -> Base64 编码（CTF常见模式）', () => {
      const message = 'SOS';
      const morseEnc = morse.encode(message);
      const b64Enc = encodeBase64(morseEnc);

      // 逆向解码
      const b64Dec = decodeBase64(b64Enc);
      const morseDec = morse.decode(b64Dec);

      expect(morseDec).toBe(message);
    });
  });

  describe('场景5: 复杂混合编码 - 模拟真实CTF题目', () => {
    it('二进制 -> Base64 -> ROT13 多层编码', () => {
      const flag = 'FLAG{TEST_CASE}';

      // 编码
      const bin = binaryEncode(flag, { separator: ' ' });
      const b64 = encodeBase64(bin);
      const rot13 = rot13Encode(b64);

      // 解码
      const unrot = rot13Decode(rot13);
      const unb64 = decodeBase64(unrot);
      const unbin = binaryDecode(unb64);

      expect(unbin).toBe(flag);
    });

    it('Base32 -> URL -> Base64 多层编码', () => {
      const flag = 'flag{complex_nesting}';

      const step1 = encodeBase32(flag);
      const step2 = urlEncode(step1);
      const step3 = encodeBase64(step2);

      const rev1 = decodeBase64(step3);
      const rev2 = urlDecode(rev1);
      const rev3 = decodeBase32(rev2);

      expect(rev3).toBe(flag);
    });
  });

  describe('场景6: 错误恢复与错误处理', () => {
    it('解码链中某一步失败 - 错误应该能捕获', () => {
      // 构造一个在Base64解码阶段会失败的输入
      // Hex编码了非法Base64字符串
      const invalidBase64 = '!!!not base64!!!';
      const hexOfInvalid = encodeBase16(invalidBase64);

      // Hex解码能成功
      const hexDec = decodeBase16(hexOfInvalid);
      expect(hexDec).toBe(invalidBase64);

      // 但Base64解码会失败
      expect(() => decodeBase64(hexDec)).toThrow();
    });

    it('多层嵌套中，中间层数据被破坏导致最终解码失败', () => {
      const flag = 'flag{safe}';

      // 正常编码链
      const b64 = encodeBase64(flag);
      const hex = encodeBase16(b64);

      // 篡改hex中间部分（模拟数据传输错误）
      const tamperedHex = hex.slice(0, 4) + 'FFFF' + hex.slice(8);

      // Hex解码仍能工作（只要字符合法）
      const tamperedB64 = decodeBase16(tamperedHex);

      // Base64解码可能失败或产生乱码
      try {
        const result = decodeBase64(tamperedB64);
        // 如果能解码，结果不应该等于原文
        expect(result).not.toBe(flag);
      } catch {
        // 抛出错误也是合理的
        expect(true).toBe(true);
      }
    });

    it('URL编码中包含恶意百分号序列的处理', () => {
      // 正确编码一段文本
      const enc = urlEncode('test');
      // 添加无效的百分号序列
      expect(() => urlDecode(enc + '%ZZ')).toThrow();
    });
  });

  describe('场景7: Flag常见模式测试', () => {
    it('flag{}格式在各种编码中的往返', () => {
      const flags = [
        'flag{simple}',
        'FLAG{uppercase}',
        'ctf{number_123}',
        'flag{special_chars_!@#}',
        'flag{unicode_你好}',
      ];

      for (const flag of flags) {
        // Base16
        expect(decodeBase16(encodeBase16(flag))).toBe(flag);
        // Base64
        expect(decodeBase64(encodeBase64(flag))).toBe(flag);
        // ROT13
        expect(rot13Decode(rot13Encode(flag))).toBe(flag);
      }
    });
  });
});
