import { describe, it, expect } from '@jest/globals';
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

// ---- 测试辅助函数 ----
function testRoundtrip(name, encode, decode, input) {
  it(`${name}: "${input}" encode后decode能还原`, () => {
    const enc = encode(input);
    const dec = decode(enc);
    expect(dec).toBe(input);
  });
}

function testEmpty(name, encode, decode) {
  it(`${name}: encode空字符串返回空字符串`, () => {
    expect(encode('')).toBe('');
  });
  it(`${name}: decode空字符串返回空字符串`, () => {
    expect(decode('')).toBe('');
  });
}

function testSpecialChars(name, encode, decode) {
  it(`${name}: 特殊字符（中文）编解码往返正确`, () => {
    const input = '你好世界';
    const enc = encode(input);
    const dec = decode(enc);
    expect(dec).toBe(input);
  });

  it(`${name}: 特殊字符（emoji）编解码往返正确`, () => {
    const input = '😀🎉🚀';
    const enc = encode(input);
    const dec = decode(enc);
    expect(dec).toBe(input);
  });

  it(`${name}: 特殊字符（换行符）编解码往返正确`, () => {
    const input = 'line1\nline2\r\nline3';
    const enc = encode(input);
    const dec = decode(enc);
    expect(dec).toBe(input);
  });
}

function testInvalidDecode(name, decode, invalidInput) {
  it(`${name}: decode无效输入抛出错误`, () => {
    expect(() => decode(invalidInput)).toThrow();
  });
}

// ================================================================
// Base16
// ================================================================
describe('Base16（十六进制）编解码', () => {
  describe('encode', () => {
    it('应该正确编码ASCII文本: "Hello" -> "48656c6c6f"', () => {
      expect(encodeBase16('Hello')).toBe('48656c6c6f');
    });
    it('应该正确编码数字: "123" -> "313233"', () => {
      expect(encodeBase16('123')).toBe('313233');
    });
    it('应该正确编码包含空格的文本', () => {
      expect(encodeBase16('A B')).toBe('412042');
    });
  });

  testEmpty('Base16', encodeBase16, decodeBase16);

  describe('decode', () => {
    it('应该正确解码十六进制: "48656c6c6f" -> "Hello"', () => {
      expect(decodeBase16('48656c6c6f')).toBe('Hello');
    });
    it('应该支持大写字符: "48656C6C6F" -> "Hello"', () => {
      expect(decodeBase16('48656C6C6F')).toBe('Hello');
    });
    it('应该支持大小写混合', () => {
      expect(decodeBase16('48656C6c6F')).toBe('Hello');
    });
    it('奇数长度输入抛出错误', () => {
      expect(() => decodeBase16('48656')).toThrow();
    });
    it('非法字符输入抛出错误', () => {
      expect(() => decodeBase16('xyz')).toThrow();
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base16', encodeBase16, decodeBase16, 'Hello World!');
    testRoundtrip('Base16', encodeBase16, decodeBase16, 'CTF{f1ag_h3r3}');
    testSpecialChars('Base16', encodeBase16, decodeBase16);
  });
});

// ================================================================
// Base32
// ================================================================
describe('Base32 编解码', () => {
  describe('encode', () => {
    it('应该正确编码: "A" -> "IE"', () => {
      expect(encodeBase32('A')).toBe('IE');
    });
    it('应该返回大写字母和数字2-7组成的字符串', () => {
      const enc = encodeBase32('Hello');
      expect(enc).toMatch(/^[A-Z2-7]+$/);
    });
  });

  testEmpty('Base32', encodeBase32, decodeBase32);

  describe('decode', () => {
    it('应该支持小写输入', () => {
      const enc = encodeBase32('Hello');
      const dec = decodeBase32(enc.toLowerCase());
      expect(dec).toBe('Hello');
    });
    it('应该支持带padding（=）的输入', () => {
      const enc = encodeBase32('Hi');
      // 带 padding 也能正常解码
      expect(decodeBase32(enc + '===')).toBe('Hi');
    });
    it('无效字符抛出错误', () => {
      expect(() => decodeBase32('@@@@@')).toThrow();
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base32', encodeBase32, decodeBase32, 'Hello World!');
    testRoundtrip('Base32', encodeBase32, decodeBase32, 'CTF');
    testSpecialChars('Base32', encodeBase32, decodeBase32);
  });
});

// ================================================================
// Base36
// ================================================================
describe('Base36 编解码', () => {
  describe('encode', () => {
    it('应该返回小写字母数字组成的字符串', () => {
      const enc = encodeBase36('Hello');
      expect(enc).toMatch(/^[0-9a-z]+$/);
    });
    it('"0"字符编码不为空', () => {
      // 单个字节0x30 编码后应有结果
      const enc = encodeBase36('0');
      expect(enc.length).toBeGreaterThan(0);
    });
  });

  testEmpty('Base36', encodeBase36, decodeBase36);

  describe('decode', () => {
    it('应该支持大写输入', () => {
      const enc = encodeBase36('Hello');
      const dec = decodeBase36(enc.toUpperCase());
      expect(dec).toBe('Hello');
    });
    it('无效字符抛出错误', () => {
      expect(() => decodeBase36('@@@')).toThrow();
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base36', encodeBase36, decodeBase36, 'Hello World!');
    testRoundtrip('Base36', encodeBase36, decodeBase36, 'CTFflag');
    testSpecialChars('Base36', encodeBase36, decodeBase36);
  });
});

// ================================================================
// Base58
// ================================================================
describe('Base58 编解码', () => {
  describe('encode', () => {
    it('应该返回Base58字符集组成的字符串', () => {
      const enc = encodeBase58('Hello');
      expect(enc).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    });
    it('不包含易混淆字符（0, O, I, l）', () => {
      const enc = encodeBase58('TestData123!');
      expect(enc).not.toContain('0');
      expect(enc).not.toContain('O');
      expect(enc).not.toContain('I');
      expect(enc).not.toContain('l');
    });
  });

  testEmpty('Base58', encodeBase58, decodeBase58);

  describe('decode', () => {
    it('无效字符抛出错误', () => {
      expect(() => decodeBase58('0OIl')).toThrow();
    });
    it('空字符串返回空', () => {
      expect(decodeBase58('')).toBe('');
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base58', encodeBase58, decodeBase58, 'Hello World!');
    testRoundtrip('Base58', encodeBase58, decodeBase58, 'CTF');
    testSpecialChars('Base58', encodeBase58, decodeBase58);
  });
});

// ================================================================
// Base62
// ================================================================
describe('Base62 编解码', () => {
  describe('encode', () => {
    it('应该返回字母数字组成的字符串', () => {
      const enc = encodeBase62('Hello');
      expect(enc).toMatch(/^[0-9A-Za-z]+$/);
    });
  });

  testEmpty('Base62', encodeBase62, decodeBase62);

  describe('decode', () => {
    it('无效字符抛出错误', () => {
      expect(() => decodeBase62('!@#$')).toThrow();
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base62', encodeBase62, decodeBase62, 'Hello World!');
    testRoundtrip('Base62', encodeBase62, decodeBase62, 'CTFflag123');
    testSpecialChars('Base62', encodeBase62, decodeBase62);
  });
});

// ================================================================
// Base64
// ================================================================
describe('Base64 编解码', () => {
  describe('encode', () => {
    it('应该正确编码: "Hello" -> "SGVsbG8="', () => {
      expect(encodeBase64('Hello')).toBe('SGVsbG8=');
    });
    it('"Man" -> "TWFu"', () => {
      expect(encodeBase64('Man')).toBe('TWFu');
    });
    it('输出长度应为4的倍数', () => {
      const enc = encodeBase64('Hello');
      expect(enc.length % 4).toBe(0);
    });
  });

  testEmpty('Base64', encodeBase64, decodeBase64);

  describe('decode', () => {
    it('应该支持不带padding的输入', () => {
      expect(decodeBase64('SGVsbG8')).toBe('Hello');
    });
    it('应该忽略空白字符', () => {
      expect(decodeBase64('SGVs bG8=')).toBe('Hello');
    });
    it('无效字符抛出错误', () => {
      expect(() => decodeBase64('@@@')).toThrow();
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base64', encodeBase64, decodeBase64, 'Hello World!');
    testRoundtrip('Base64', encodeBase64, decodeBase64, 'CTF{test_flag}');
    testSpecialChars('Base64', encodeBase64, decodeBase64);
  });
});

// ================================================================
// Base85
// ================================================================
describe('Base85 编解码', () => {
  describe('encode', () => {
    it('应该返回可打印字符组成的字符串', () => {
      const enc = encodeBase85('Hello');
      expect(enc.length).toBeGreaterThan(0);
    });
    it('全零块（4个零字节）应压缩为 "z"', () => {
      const input = '\x00\x00\x00\x00';
      const enc = encodeBase85(input);
      expect(enc).toBe('z');
    });
  });

  testEmpty('Base85', encodeBase85, decodeBase85);

  describe('decode', () => {
    it('应该支持 "z" 表示4个零字节', () => {
      expect(decodeBase85('z')).toBe('\x00\x00\x00\x00');
    });
    it('应该支持大写 "Z" 表示4个零字节', () => {
      expect(decodeBase85('Z')).toBe('\x00\x00\x00\x00');
    });
    it('无效字符抛出错误', () => {
      expect(() => decodeBase85('~~~')).toThrow();
    });
    it('应该忽略空白字符', () => {
      const enc = encodeBase85('Hi');
      const dec = decodeBase85('  ' + enc + '  ');
      expect(dec).toBe('Hi');
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base85', encodeBase85, decodeBase85, 'Hello World!');
    testRoundtrip('Base85', encodeBase85, decodeBase85, 'CTF');
    testSpecialChars('Base85', encodeBase85, decodeBase85);
  });
});

// ================================================================
// Base91
// ================================================================
describe('Base91 编解码', () => {
  describe('encode', () => {
    it('应该返回可打印ASCII字符串', () => {
      const enc = encodeBase91('Hello');
      // Base91 使用 0x21-0x7E 范围内的字符
      for (const ch of enc) {
        const code = ch.charCodeAt(0);
        expect(code).toBeGreaterThanOrEqual(0x21);
        expect(code).toBeLessThanOrEqual(0x7E);
      }
    });
    it('应该比Base64更短', () => {
      const input = 'Hello World! This is a test.';
      const b64 = encodeBase64(input);
      const b91 = encodeBase91(input);
      expect(b91.length).toBeLessThanOrEqual(b64.length);
    });
  });

  testEmpty('Base91', encodeBase91, decodeBase91);

  describe('decode', () => {
    it('无效字符抛出错误', () => {
      expect(() => decodeBase91('\x7F')).toThrow();
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base91', encodeBase91, decodeBase91, 'Hello World!');
    testRoundtrip('Base91', encodeBase91, decodeBase91, 'CTF{flag}');
    testSpecialChars('Base91', encodeBase91, decodeBase91);
  });
});

// ================================================================
// Base92
// ================================================================
describe('Base92 编解码', () => {
  describe('encode', () => {
    it('应该返回可打印ASCII字符串', () => {
      const enc = encodeBase92('Hello');
      for (const ch of enc) {
        const code = ch.charCodeAt(0);
        expect(code).toBeGreaterThanOrEqual(0x21);
        expect(code).toBeLessThanOrEqual(0x7E);
      }
    });
    it('不应该包含双引号', () => {
      const enc = encodeBase92('Hello World!');
      expect(enc).not.toContain('"');
    });
    it('应该比Base64更短', () => {
      const input = 'Hello World! This is a test.';
      const b64 = encodeBase64(input);
      const b92 = encodeBase92(input);
      expect(b92.length).toBeLessThanOrEqual(b64.length);
    });
  });

  testEmpty('Base92', encodeBase92, decodeBase92);

  describe('decode', () => {
    it('无效字符（双引号）抛出错误', () => {
      expect(() => decodeBase92('"')).toThrow();
    });
    it('无效字符（DEL）抛出错误', () => {
      expect(() => decodeBase92('\x7F')).toThrow();
    });
  });

  describe('往返测试', () => {
    testRoundtrip('Base92', encodeBase92, decodeBase92, 'Hello World!');
    testRoundtrip('Base92', encodeBase92, decodeBase92, 'CTF{flag}');
    testSpecialChars('Base92', encodeBase92, decodeBase92);
  });
});
