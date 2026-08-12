import { describe, it, expect } from '@jest/globals';
import { emoji, coreSocialistValues, buddha } from '../src/core/special-encodings.js';

// ================================================================
// Emoji 编解码
// ================================================================
describe('Emoji 编解码', () => {
  describe('encode', () => {
    it('应该将文本编码为emoji序列', () => {
      const enc = emoji.encode('A');
      expect(enc.length).toBeGreaterThan(0);
      // A的ASCII值是65，对应emoji表中的第65个
      expect(enc).not.toBe('A');
    });
    it('不同字符产生不同emoji', () => {
      const encA = emoji.encode('A');
      const encB = emoji.encode('B');
      expect(encA).not.toBe(encB);
    });
    it('中文文本也能编码', () => {
      const enc = emoji.encode('你好');
      expect(enc.length).toBeGreaterThan(0);
    });
  });

  describe('decode', () => {
    it('应该将emoji解码还原', () => {
      const enc = emoji.encode('Hello');
      expect(emoji.decode(enc)).toBe('Hello');
    });
    it('未知emoji抛出错误', () => {
      expect(() => emoji.decode('🤷‍♂️')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('英文往返', () => {
      const input = 'Hello World!';
      expect(emoji.decode(emoji.encode(input))).toBe(input);
    });
    it('中文往返', () => {
      const input = '你好世界';
      expect(emoji.decode(emoji.encode(input))).toBe(input);
    });
    it('CTF flag往返', () => {
      const input = 'flag{emoji_test}';
      expect(emoji.decode(emoji.encode(input))).toBe(input);
    });
    it('空字符串', () => {
      expect(emoji.encode('')).toBe('');
      expect(emoji.decode('')).toBe('');
    });
  });
});

// ================================================================
// 核心价值观编码
// ================================================================
describe('核心价值观编码（Core Socialist Values）', () => {
  describe('encode', () => {
    it('应该生成核心价值观词组', () => {
      const enc = coreSocialistValues.encode('flag');
      expect(enc.length).toBeGreaterThan(0);
      // 应该包含已知的核心价值观词组
      expect(enc).toMatch(/[富强民主文明和谐自由平等公正法治爱国敬业诚信友善]/);
    });
    it('不同文本产生不同编码', () => {
      const enc1 = coreSocialistValues.encode('a');
      const enc2 = coreSocialistValues.encode('b');
      expect(enc1).not.toBe(enc2);
    });
    it('中文文本也能编码', () => {
      const enc = coreSocialistValues.encode('你好');
      expect(enc.length).toBeGreaterThan(0);
    });
  });

  describe('decode', () => {
    it('应该从核心价值观词组解码还原', () => {
      const enc = coreSocialistValues.encode('flag');
      expect(coreSocialistValues.decode(enc)).toBe('flag');
    });
    it('未知词组抛出错误', () => {
      expect(() => coreSocialistValues.decode('不存在的值')).toThrow();
    });
    it('支持逗号分隔', () => {
      const enc = coreSocialistValues.encode('AB');
      const withComma = enc.replace(/ /g, ',');
      expect(coreSocialistValues.decode(withComma)).toBe('AB');
    });
    it('支持全角逗号和空格混合', () => {
      const enc = coreSocialistValues.encode('AB');
      const withMixed = enc.replace(/ /g, '，');
      expect(coreSocialistValues.decode(withMixed)).toBe('AB');
    });
  });

  describe('往返测试', () => {
    it('英文往返', () => {
      const input = 'CTFflag';
      expect(coreSocialistValues.decode(coreSocialistValues.encode(input))).toBe(input);
    });
    it('中文往返', () => {
      const input = '你好';
      expect(coreSocialistValues.decode(coreSocialistValues.encode(input))).toBe(input);
    });
    it('空字符串', () => {
      expect(coreSocialistValues.encode('')).toBe('');
      expect(coreSocialistValues.decode('')).toBe('');
    });
  });
});

// ================================================================
// 与佛论禅编码
// ================================================================
describe('与佛论禅编码（Buddha）', () => {
  describe('encode', () => {
    it('应该生成佛经汉字序列', () => {
      const enc = buddha.encode('test');
      expect(enc.length).toBeGreaterThan(0);
      expect(enc).not.toBe('test');
    });
    it('不同文本产生不同佛经字符', () => {
      const enc1 = buddha.encode('a');
      const enc2 = buddha.encode('b');
      expect(enc1).not.toBe(enc2);
    });
  });

  describe('decode', () => {
    it('应该从佛经汉字解码还原', () => {
      const enc = buddha.encode('flag');
      expect(buddha.decode(enc)).toBe('flag');
    });
    it('忽略不在表中的字符（空格、标点等）', () => {
      const enc = buddha.encode('hi');
      // 在编码结果中间插入一个逗号
      const withPunct = enc.slice(0, 2) + ',' + enc.slice(2);
      expect(buddha.decode(withPunct)).toBe('hi');
    });
    it('空字符串', () => {
      expect(buddha.decode('')).toBe('');
    });
    it('全非佛经字符返回空', () => {
      expect(buddha.decode('hello world')).toBe('');
    });
  });

  describe('往返测试', () => {
    it('英文往返', () => {
      const input = 'flag{test}';
      const enc = buddha.encode(input);
      const dec = buddha.decode(enc);
      expect(dec).toBe(input);
    });
    it('中文往返', () => {
      const input = '你好';
      const enc = buddha.encode(input);
      const dec = buddha.decode(enc);
      expect(dec).toBe(input);
    });
    it('空字符串', () => {
      expect(buddha.encode('')).toBe('');
      expect(buddha.decode('')).toBe('');
    });
  });
});
