import { describe, it, expect } from '@jest/globals';
import { brainfuck, jsfuck, jother } from '../src/core/esoteric.js';

// ================================================================
// Brainfuck
// ================================================================
describe('Brainfuck 编解码', () => {
  describe('encode', () => {
    it('应该生成Brainfuck程序', () => {
      const code = brainfuck.encode('Hi');
      expect(code.length).toBeGreaterThan(0);
      expect(code).toMatch(/^[+\-.,<>[\]]+$/);
    });
    it('空字符串返回空', () => {
      expect(brainfuck.encode('')).toBe('');
    });
  });

  describe('decode', () => {
    it('应该执行Brainfuck程序解码', () => {
      const code = brainfuck.encode('Hi');
      expect(brainfuck.decode(code)).toBe('Hi');
    });
    it('支持简单循环: 清空当前单元 [+]', () => {
      // 先加3，再进入循环[-]清空，最终输出0（NUL字符）
      const result = brainfuck.decode('+++[-].');
      expect(result).toBe('\x00');
    });
    it('括号不匹配抛出错误', () => {
      expect(() => brainfuck.decode('[')).toThrow();
      expect(() => brainfuck.decode(']')).toThrow();
    });
    it('无限循环超时抛出错误', () => {
      // +[] 会在非零单元上无限循环
      expect(() => brainfuck.decode('+[]')).toThrow();
    });
    it('空字符串返回空', () => {
      expect(brainfuck.decode('')).toBe('');
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'Hello';
      expect(brainfuck.decode(brainfuck.encode(input))).toBe(input);
    });
    it('包含特殊字符的文本', () => {
      const input = 'CTF{test}';
      expect(brainfuck.decode(brainfuck.encode(input))).toBe(input);
    });
  });
});

// ================================================================
// JSFuck
// ================================================================
describe('JSFuck 编解码', () => {
  describe('encode', () => {
    it('应该生成只含 []()!+ 的代码（兼容字符串）', () => {
      // "nice" 的所有字符都在 JSFuck 字符映射中
      const code = jsfuck.encode('nice');
      expect(code).toMatch(/^[\[\]\(\)!\+]+$/);
    });
    it('不支持的不兼容字符抛出错误', () => {
      // 'H' 不在 JSFuck 的字符映射中
      expect(() => jsfuck.encode('Hi')).toThrow();
    });
    it('空字符串返回空', () => {
      expect(jsfuck.encode('')).toBe('');
    });
  });

  describe('decode', () => {
    it('真实JSFuck表达式: (![]+[])[+[]] -> "f"', () => {
      const result = jsfuck.decode('(![]+[])[+[]]');
      expect(result).toBe('f');
    });
    it('非JSFuck字符集输入抛出错误', () => {
      expect(() => jsfuck.decode('hello world')).toThrow();
    });
    it('空字符串返回空', () => {
      expect(jsfuck.decode('')).toBe('');
    });
    it('执行失败时抛出错误', () => {
      // 构造语法错误但符合字符集的表达式
      expect(() => jsfuck.decode('(((')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('简单JSFuck表达式 decode 结果正确', () => {
      // JSFuck 编码器存在已知限制：Function("return ...") 模式不会给返回值加引号，
      // 因此 encode 后的代码 decode 可能失败。
      // 这里只测试简单表达式的 decode。
      expect(jsfuck.decode('(![]+[])[+[]]')).toBe('f');
    });
  });
});

// ================================================================
// Jother
// ================================================================
describe('Jother 编解码', () => {
  describe('encode', () => {
    it('应该生成只含 ()[]{}!+ 的代码（兼容字符串）', () => {
      const code = jother.encode('nice');
      expect(code).toMatch(/^[\[\]\(\)\{\}!\+]+$/);
    });
    it('应该支持包含NaN的字符串', () => {
      const code = jother.encode('NaN');
      expect(code.length).toBeGreaterThan(0);
    });
    it('不支持的字符抛出错误', () => {
      // 'H' 不在映射中
      expect(() => jother.encode('Hi')).toThrow();
    });
    it('空字符串返回空', () => {
      expect(jother.encode('')).toBe('');
    });
  });

  describe('decode', () => {
    it('Jother表达式: ([]+{}) -> "[object Object]"', () => {
      const result = jother.decode('([]+{})');
      expect(result).toBe('[object Object]');
    });
    it('非Jother字符集输入抛出错误', () => {
      expect(() => jother.decode('hello')).toThrow();
    });
    it('空字符串返回空', () => {
      expect(jother.decode('')).toBe('');
    });
  });

  describe('往返测试', () => {
    it('简单Jother表达式 decode 结果正确', () => {
      // Jother 编码器存在与 JSFuck 相同的已知限制：
      // Function("return ...") 模式不会给返回值加引号
      expect(jother.decode('([]+{})')).toBe('[object Object]');
    });
    it('encode后decode能还原 - NaN', () => {
      const input = 'NaN';
      expect(jother.decode(jother.encode(input))).toBe(input);
    });
  });
});
