import { describe, it, expect } from '@jest/globals';
import {
  rot5Encode, rot5Decode,
  rot13Encode, rot13Decode,
  rot18Encode, rot18Decode,
  rot47Encode, rot47Decode,
} from '../src/core/rot-ciphers.js';

// ================================================================
// ROT5
// ================================================================
describe('ROT5（数字旋转）', () => {
  describe('encode', () => {
    it('应该正确编码数字: "01234" -> "56789"', () => {
      expect(rot5Encode('01234')).toBe('56789');
    });
    it('应该正确编码数字: "56789" -> "01234"', () => {
      expect(rot5Encode('56789')).toBe('01234');
    });
    it('非数字字符保持不变', () => {
      expect(rot5Encode('abc')).toBe('abc');
    });
    it('混合字符中只转换数字', () => {
      expect(rot5Encode('abc123')).toBe('abc678');
    });
  });

  describe('decode', () => {
    it('decode与encode结果相同（对称密码）', () => {
      expect(rot5Decode('01234')).toBe('56789');
    });
    it('非数字字符保持不变', () => {
      expect(rot5Decode('hello')).toBe('hello');
    });
  });

  describe('往返测试', () => {
    it('encode后再decode能还原', () => {
      const input = 'Phone: 1234567890';
      const enc = rot5Encode(input);
      const dec = rot5Decode(enc);
      expect(dec).toBe(input);
    });
    it('空字符串往返', () => {
      expect(rot5Encode('')).toBe('');
      expect(rot5Decode('')).toBe('');
    });
    it('纯数字字符串往返', () => {
      const input = '0123456789';
      expect(rot5Decode(rot5Encode(input))).toBe(input);
    });
  });
});

// ================================================================
// ROT13
// ================================================================
describe('ROT13（字母旋转）', () => {
  describe('encode', () => {
    it('应该正确编码: "Hello" -> "Uryyb"', () => {
      expect(rot13Encode('Hello')).toBe('Uryyb');
    });
    it('"Uryyb" -> "Hello"（两次ROT13还原）', () => {
      expect(rot13Encode('Uryyb')).toBe('Hello');
    });
    it('大写字母正确旋转', () => {
      expect(rot13Encode('ABC')).toBe('NOP');
    });
    it('小写字母正确旋转', () => {
      expect(rot13Encode('abc')).toBe('nop');
    });
    it('数字保持不变', () => {
      expect(rot13Encode('12345')).toBe('12345');
    });
    it('特殊字符保持不变', () => {
      expect(rot13Encode('!@#$%')).toBe('!@#$%');
    });
    it('混合字符中只旋转字母', () => {
      expect(rot13Encode('Hello123!')).toBe('Uryyb123!');
    });
  });

  describe('decode', () => {
    it('decode与encode结果相同（对称密码）', () => {
      expect(rot13Decode('Hello')).toBe('Uryyb');
    });
    it('"Uryyb" decode 得到 "Hello"', () => {
      expect(rot13Decode('Uryyb')).toBe('Hello');
    });
    it('数字保持不变', () => {
      expect(rot13Decode('12345')).toBe('12345');
    });
  });

  describe('往返测试', () => {
    it('encode后再decode能还原', () => {
      const input = 'Hello World';
      const enc = rot13Encode(input);
      const dec = rot13Decode(enc);
      expect(dec).toBe(input);
    });
    it('空字符串往返', () => {
      expect(rot13Encode('')).toBe('');
      expect(rot13Decode('')).toBe('');
    });
    it('含数字和特殊字符的往返', () => {
      const input = 'Test123!@#';
      expect(rot13Decode(rot13Encode(input))).toBe(input);
    });
    it('连续两次ROT13回到原文', () => {
      const input = 'Sensitive Data';
      expect(rot13Encode(rot13Encode(input))).toBe(input);
    });
  });
});

// ================================================================
// ROT18
// ================================================================
describe('ROT18（字母+数字旋转）', () => {
  describe('encode', () => {
    it('字母部分执行ROT13: "Hello" -> "Uryyb"', () => {
      expect(rot18Encode('Hello')).toBe('Uryyb');
    });
    it('数字部分执行ROT5: "123" -> "678"', () => {
      expect(rot18Encode('123')).toBe('678');
    });
    it('字母和数字混合: "Hello123" -> "Uryyb678"', () => {
      expect(rot18Encode('Hello123')).toBe('Uryyb678');
    });
    it('特殊字符保持不变', () => {
      expect(rot18Encode('!@#')).toBe('!@#');
    });
  });

  describe('decode', () => {
    it('decode与encode结果相同（对称密码）', () => {
      expect(rot18Decode('Uryyb678')).toBe('Hello123');
    });
    it('"Hello123" 经 decode 得 "Uryyb678"', () => {
      expect(rot18Decode('Hello123')).toBe('Uryyb678');
    });
  });

  describe('往返测试', () => {
    it('encode后再decode能还原', () => {
      const input = 'TestABC123XYZ';
      const enc = rot18Encode(input);
      const dec = rot18Decode(enc);
      expect(dec).toBe(input);
    });
    it('空字符串往返', () => {
      expect(rot18Encode('')).toBe('');
      expect(rot18Decode('')).toBe('');
    });
    it('混合字符往返', () => {
      const input = 'Flag{rot18_2024}';
      expect(rot18Decode(rot18Encode(input))).toBe(input);
    });
  });
});

// ================================================================
// ROT47
// ================================================================
describe('ROT47（可打印字符旋转）', () => {
  describe('encode', () => {
    it('字母旋转: "Hello" 应该不等于原文', () => {
      expect(rot47Encode('Hello')).not.toBe('Hello');
    });
    it('数字旋转: "123" 应该不等于原文', () => {
      expect(rot47Encode('123')).not.toBe('123');
    });
    it('特殊字符也旋转', () => {
      expect(rot47Encode('!')).not.toBe('!');
    });
    it('空格和换行符不变（不在33-126范围）', () => {
      expect(rot47Encode(' ')).toBe(' ');
      expect(rot47Encode('\n')).toBe('\n');
      expect(rot47Encode('\t')).toBe('\t');
    });
  });

  describe('decode', () => {
    it('decode与encode结果相同（对称密码）', () => {
      const input = 'Hello World!';
      expect(rot47Decode(input)).toBe(rot47Encode(input));
    });
  });

  describe('往返测试', () => {
    it('encode后再decode能还原', () => {
      const input = 'Hello World! 123@#$';
      const enc = rot47Encode(input);
      const dec = rot47Decode(enc);
      expect(dec).toBe(input);
    });
    it('空字符串往返', () => {
      expect(rot47Encode('')).toBe('');
      expect(rot47Decode('')).toBe('');
    });
    it('CTF flag场景往返', () => {
      const input = 'flag{rot47_is_cool!}';
      expect(rot47Decode(rot47Encode(input))).toBe(input);
    });
    it('连续两次ROT47回到原文', () => {
      const input = 'Some Secret!';
      expect(rot47Encode(rot47Encode(input))).toBe(input);
    });
  });
});
