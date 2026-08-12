import { describe, it, expect } from '@jest/globals';
import { tapCodeEncode, tapCodeDecode, a1z26Encode, a1z26Decode, binaryEncode, binaryDecode } from '../src/core/other-ciphers.js';

// ================================================================
// 敲击码（Tap Code）
// ================================================================
describe('敲击码（Tap Code）', () => {
  describe('encode', () => {
    it('"A" -> ". ."（行1列1）', () => {
      expect(tapCodeEncode('A')).toBe('. .');
    });
    it('"B" -> ". .."（行1列2）', () => {
      expect(tapCodeEncode('B')).toBe('. ..');
    });
    it('"E" -> ". ....."（行1列5）', () => {
      expect(tapCodeEncode('E')).toBe('. .....');
    });
    it('"C" 和 "K" 编码相同（共用位置1,3）', () => {
      expect(tapCodeEncode('C')).toBe(tapCodeEncode('K'));
    });
    it('"AB" 输出包含空格', () => {
      const enc = tapCodeEncode('AB');
      // A: . .  B: . ..  => ". . . .."
      expect(enc).toBe('. . . ..');
    });
    it('单词之间的空格编码为 "/"', () => {
      expect(tapCodeEncode('A B')).toBe('. . / . ..');
    });
    it('不支持的字符抛出错误', () => {
      expect(() => tapCodeEncode('1')).toThrow();
    });
    it('小写字母自动转大写', () => {
      expect(tapCodeEncode('a')).toBe('. .');
    });
  });

  describe('decode', () => {
    it('".  ." -> "a"', () => {
      expect(tapCodeDecode('.  .')).toBe('a');
    });
    it('"/" 解码为空格', () => {
      expect(tapCodeDecode('. . / . ..')).toBe('a b');
    });
    it('多个空格作为分隔符', () => {
      expect(tapCodeDecode('.  . .  ..')).toBe('ab');
    });
    it('无效坐标抛出错误', () => {
      expect(() => tapCodeDecode('...... ......')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'HELLO';
      expect(tapCodeDecode(tapCodeEncode(input))).toBe('hello');
    });
    it('包含空格的往返', () => {
      const input = 'HELLO WORLD';
      const enc = tapCodeEncode(input);
      const dec = tapCodeDecode(enc);
      expect(dec).toBe('hello world');
    });
    it('空字符串', () => {
      expect(tapCodeEncode('')).toBe('');
      expect(tapCodeDecode('')).toBe('');
    });
  });
});

// ================================================================
// A1z26 密码
// ================================================================
describe('A1z26 密码', () => {
  describe('encode', () => {
    it('默认分隔符 "-": "ABC" -> "1-2-3"', () => {
      expect(a1z26Encode('ABC')).toBe('1-2-3');
    });
    it('自定义分隔符 " ": "ABC" -> "1 2 3"', () => {
      expect(a1z26Encode('ABC', { separator: ' ' })).toBe('1 2 3');
    });
    it('"Z" -> "26"', () => {
      expect(a1z26Encode('Z')).toBe('26');
    });
    it('小写字母自动转大写', () => {
      expect(a1z26Encode('a')).toBe('1');
    });
    it('空格保留', () => {
      expect(a1z26Encode('A B')).toBe('1- -2');
    });
    it('非字母字符保留', () => {
      expect(a1z26Encode('A!')).toBe('1-!');
    });
  });

  describe('decode', () => {
    it('默认自动检测分隔符: "1-2-3" -> "ABC"', () => {
      expect(a1z26Decode('1-2-3')).toBe('ABC');
    });
    it('空格分隔: "1 2 3" -> "ABC"', () => {
      expect(a1z26Decode('1 2 3')).toBe('ABC');
    });
    it('"8-5-12-12-15" -> "HELLO"', () => {
      expect(a1z26Decode('8-5-12-12-15')).toBe('HELLO');
    });
    it('超出范围的数字抛出错误', () => {
      expect(() => a1z26Decode('1-27-3')).toThrow();
    });
    it('数字0抛出错误', () => {
      expect(() => a1z26Decode('0')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('默认分隔符往返', () => {
      const input = 'HELLOWORLD';
      expect(a1z26Decode(a1z26Encode(input))).toBe(input);
    });
    it('空格分隔符往返', () => {
      const input = 'TEST';
      const enc = a1z26Encode(input, { separator: ' ' });
      expect(a1z26Decode(enc)).toBe(input);
    });
    it('空字符串', () => {
      expect(a1z26Encode('')).toBe('');
      expect(a1z26Decode('')).toBe('');
    });
  });
});

// ================================================================
// 二进制 01 编码
// ================================================================
describe('二进制01编码', () => {
  describe('encode', () => {
    it('默认8位: "A" -> "01000001"', () => {
      expect(binaryEncode('A')).toBe('01000001');
    });
    it('默认空格分隔: "AB" -> "01000001 01000010"', () => {
      expect(binaryEncode('AB')).toBe('01000001 01000010');
    });
    it('7位模式: "A" -> "1000001"', () => {
      expect(binaryEncode('A', { bitLength: 7 })).toBe('1000001');
    });
    it('自定义分隔符: "AB" 无分隔符', () => {
      const enc = binaryEncode('AB', { separator: '' });
      expect(enc).toBe('0100000101000010');
    });
    it('小写字母: "a" -> "01100001"', () => {
      expect(binaryEncode('a')).toBe('01100001');
    });
  });

  describe('decode', () => {
    it('解码8位二进制: "01000001" -> "A"', () => {
      expect(binaryDecode('01000001')).toBe('A');
    });
    it('解码7位二进制: "1000001" -> "A"', () => {
      expect(binaryDecode('1000001')).toBe('A');
    });
    it('空格分隔: "01000001 01000010" -> "AB"', () => {
      expect(binaryDecode('01000001 01000010')).toBe('AB');
    });
    it('逗号分隔也能识别', () => {
      expect(binaryDecode('01000001,01000010')).toBe('AB');
    });
    it('分号分隔也能识别', () => {
      expect(binaryDecode('01000001;01000010')).toBe('AB');
    });
    it('无效二进制字符抛出错误', () => {
      expect(() => binaryDecode('01234567')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('8位往返', () => {
      const input = 'Hello';
      expect(binaryDecode(binaryEncode(input))).toBe(input);
    });
    it('7位往返', () => {
      const input = 'CTF';
      const enc = binaryEncode(input, { bitLength: 7 });
      expect(binaryDecode(enc)).toBe(input);
    });
    it('空字符串', () => {
      expect(binaryEncode('')).toBe('');
      expect(binaryDecode('')).toBe('');
    });
    it('中文往返', () => {
      const input = '你好';
      expect(binaryDecode(binaryEncode(input))).toBe(input);
    });
  });
});
