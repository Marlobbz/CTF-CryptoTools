import { describe, it, expect } from '@jest/globals';
import {
  urlEncode, urlDecode,
  shellcodeEncode, shellcodeDecode,
  handycodeEncode, handycodeDecode,
  qpEncode, qpDecode,
} from '../src/core/network-encodings.js';
import {
  uuencode_encode, uuencode_decode,
  xxencode_encode, xxencode_decode,
  aaencode_encode, aaencode_decode,
  jjencode_encode, jjencode_decode,
} from '../src/core/transmission-encodings.js';

// ================================================================
// URL 编码
// ================================================================
describe('URL 编解码', () => {
  describe('encode', () => {
    it('空格编码为 "%20"', () => {
      expect(urlEncode('a b')).toBe('a%20b');
    });
    it('特殊字符被正确编码', () => {
      expect(urlEncode('hello&world=test')).toBe('hello%26world%3Dtest');
    });
    it('中文编码为百分号序列', () => {
      const enc = urlEncode('你好');
      expect(enc).toMatch(/^%[0-9A-F]{2}(%[0-9A-F]{2})+$/i);
    });
  });

  describe('decode', () => {
    it('"%20" 解码为空格', () => {
      expect(urlDecode('a%20b')).toBe('a b');
    });
    it('中文百分号编码可以解码还原', () => {
      const enc = urlEncode('你好');
      expect(urlDecode(enc)).toBe('你好');
    });
    it('无效的百分号编码抛出错误', () => {
      expect(() => urlDecode('%ZZ')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'Hello World! @#$%^&*()';
      expect(urlDecode(urlEncode(input))).toBe(input);
    });
    it('中文往返', () => {
      const input = '你好世界';
      expect(urlDecode(urlEncode(input))).toBe(input);
    });
    it('空字符串', () => {
      expect(urlEncode('')).toBe('');
      expect(urlDecode('')).toBe('');
    });
  });
});

// ================================================================
// Shellcode 编解码
// ================================================================
describe('Shellcode 编解码', () => {
  describe('encode（cstyle）', () => {
    it('默认使用 cstyle: "AB" -> "\\x41\\x42"', () => {
      expect(shellcodeEncode('AB')).toBe('\\x41\\x42');
    });
    it('"Hello" 编码结果', () => {
      expect(shellcodeEncode('Hello')).toBe('\\x48\\x65\\x6c\\x6c\\x6f');
    });
  });

  describe('encode（hex）', () => {
    it('hex格式: "AB" -> "4142"', () => {
      expect(shellcodeEncode('AB', { format: 'hex' })).toBe('4142');
    });
    it('"Hello" -> "48656c6c6f"', () => {
      expect(shellcodeEncode('Hello', { format: 'hex' })).toBe('48656c6c6f');
    });
  });

  describe('decode', () => {
    it('解码cstyle格式: "\\x41\\x42" -> "AB"', () => {
      expect(shellcodeDecode('\\x41\\x42')).toBe('AB');
    });
    it('解码hex格式: "4142" -> "AB"', () => {
      expect(shellcodeDecode('4142')).toBe('AB');
    });
    it('支持大小写混合的hex', () => {
      expect(shellcodeDecode('\\x41\\x6C')).toBe('Al');
    });
    it('无效hex字符串抛出错误', () => {
      expect(() => shellcodeDecode('ZZZ')).toThrow();
    });
    it('奇数长度hex抛出错误', () => {
      expect(() => shellcodeDecode('414')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('cstyle往返', () => {
      const input = 'Hello World!';
      const enc = shellcodeEncode(input);
      expect(shellcodeDecode(enc)).toBe(input);
    });
    it('hex格式往返', () => {
      const input = 'Shellcode';
      const enc = shellcodeEncode(input, { format: 'hex' });
      expect(shellcodeDecode(enc)).toBe(input);
    });
    it('空字符串', () => {
      expect(shellcodeEncode('')).toBe('');
      expect(shellcodeDecode('')).toBe('');
    });
    it('中文往返', () => {
      const input = '你好';
      const enc = shellcodeEncode(input);
      expect(shellcodeDecode(enc)).toBe(input);
    });
  });
});

// ================================================================
// Handycode 编解码
// ================================================================
describe('Handycode（全角字符）编解码', () => {
  describe('encode', () => {
    it('ASCII字母转为全角: "A" 长度不变但字符不同', () => {
      const enc = handycodeEncode('A');
      expect(enc).not.toBe('A');
      expect(enc.length).toBe(1);
    });
    it('数字转为全角', () => {
      const enc = handycodeEncode('1');
      expect(enc).not.toBe('1');
    });
    it('空格转为全角空格（U+3000）', () => {
      const enc = handycodeEncode(' ');
      expect(enc).toBe('\u3000');
    });
    it('非ASCII字符保持不变', () => {
      expect(handycodeEncode('你好')).toBe('你好');
    });
  });

  describe('decode', () => {
    it('全角字母还原为ASCII: 全角A -> A', () => {
      const enc = handycodeEncode('A');
      expect(handycodeDecode(enc)).toBe('A');
    });
    it('全角空格（U+3000）还原为普通空格', () => {
      expect(handycodeDecode('\u3000')).toBe(' ');
    });
    it('非全角字符保持不变', () => {
      expect(handycodeDecode('你好')).toBe('你好');
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'Hello World 2024';
      expect(handycodeDecode(handycodeEncode(input))).toBe(input);
    });
    it('空字符串', () => {
      expect(handycodeEncode('')).toBe('');
      expect(handycodeDecode('')).toBe('');
    });
    it('混合中英文', () => {
      const input = 'Hello 你好 World';
      expect(handycodeDecode(handycodeEncode(input))).toBe(input);
    });
  });
});

// ================================================================
// Quoted-printable 编解码
// ================================================================
describe('Quoted-printable 编解码', () => {
  describe('encode', () => {
    it('纯ASCII可打印文本直接返回', () => {
      const enc = qpEncode('Hello');
      expect(enc).not.toContain('=');
    });
    it('非ASCII字符被编码为=XX格式', () => {
      const enc = qpEncode('é');
      // é 的 UTF-8 编码为 C3 A9，所以 QP 编码为 =C3=A9
      expect(enc).toMatch(/^(=[0-9A-F]{2})+$/i);
    });
    it('长行被软换行（带=号）', () => {
      const longInput = 'A'.repeat(80);
      const enc = qpEncode(longInput);
      expect(enc).toContain('=\r\n');
    });
  });

  describe('decode', () => {
    it('软换行 "=\\r\\n" 被正确合并', () => {
      // 编码一段长文本，然后解码
      const input = 'A'.repeat(80) + 'B';
      const enc = qpEncode(input);
      expect(qpDecode(enc)).toBe(input);
    });
    it('=XX格式被正确解码', () => {
      expect(qpDecode('=C3=A9')).toBe('é');
    });
    it('普通文本解码后不变', () => {
      expect(qpDecode('Hello World')).toBe('Hello World');
    });
  });

  describe('往返测试', () => {
    it('短文本往返', () => {
      const input = 'Hello World!';
      expect(qpDecode(qpEncode(input))).toBe(input);
    });
    it('包含非ASCII字符的往返', () => {
      const input = 'café résumé';
      const dec = qpDecode(qpEncode(input));
      expect(dec).toBe(input);
    });
    it('长文本往返', () => {
      const input = 'A'.repeat(100);
      expect(qpDecode(qpEncode(input))).toBe(input);
    });
    it('空字符串', () => {
      expect(qpEncode('')).toBe('');
      expect(qpDecode('')).toBe('');
    });
    it('包含换行符的文本往返', () => {
      const input = 'line1\nline2\r\nline3';
      const enc = qpEncode(input);
      // QP 编码中 \n 和 \r\n 都作为硬换行处理，
      // 解码时会统一为 \r\n
      const dec = qpDecode(enc);
      expect(dec.replace(/\r\n/g, '\n')).toBe(input.replace(/\r\n/g, '\n'));
    });
  });
});

// ================================================================
// UUencode
// ================================================================
describe('UUencode 编解码', () => {
  describe('encode', () => {
    it('应该包含 begin/end 标记', () => {
      const enc = uuencode_encode('Hello');
      expect(enc).toContain('begin ');
      expect(enc).toContain('end');
    });
    it('空字符串返回空', () => {
      expect(uuencode_encode('')).toBe('');
    });
  });

  describe('decode', () => {
    it('应该正确解码', () => {
      const enc = uuencode_encode('Hello World!');
      expect(uuencode_decode(enc)).toBe('Hello World!');
    });
    it('空字符串返回空', () => {
      expect(uuencode_decode('')).toBe('');
    });
    it('无效输入抛出错误', () => {
      expect(() => uuencode_decode('garbage data')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'Hello World! CTF';
      expect(uuencode_decode(uuencode_encode(input))).toBe(input);
    });
    it('长文本往返', () => {
      const input = 'The quick brown fox jumps over the lazy dog. '.repeat(3);
      expect(uuencode_decode(uuencode_encode(input))).toBe(input);
    });
    it('中文往返', () => {
      const input = '你好世界';
      expect(uuencode_decode(uuencode_encode(input))).toBe(input);
    });
  });
});

// ================================================================
// XXencode
// ================================================================
describe('XXencode 编解码', () => {
  describe('encode', () => {
    it('应该返回纯编码数据（无begin/end标记）', () => {
      const enc = xxencode_encode('Hello');
      expect(enc).not.toContain('begin');
      expect(enc).not.toContain('end');
    });
    it('结尾有 "+" 标记', () => {
      const enc = xxencode_encode('Hello');
      expect(enc).toContain('+');
    });
    it('空字符串返回空', () => {
      expect(xxencode_encode('')).toBe('');
    });
  });

  describe('decode', () => {
    it('空字符串返回空', () => {
      expect(xxencode_decode('')).toBe('');
    });
    it('无效输入抛出错误', () => {
      expect(() => xxencode_decode('####')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'Hello World! CTF';
      expect(xxencode_decode(xxencode_encode(input))).toBe(input);
    });
    it('长文本往返', () => {
      const input = 'The quick brown fox jumps over the lazy dog. '.repeat(3);
      expect(xxencode_decode(xxencode_encode(input))).toBe(input);
    });
    it('中文往返', () => {
      const input = '你好世界';
      expect(xxencode_decode(xxencode_encode(input))).toBe(input);
    });
  });
});

// ================================================================
// AAencode
// ================================================================
describe('AAencode 编解码', () => {
  describe('encode', () => {
    it('应该生成包含颜文字的JS代码', () => {
      const enc = aaencode_encode('test');
      expect(enc).toContain('ﾟ');
      expect(enc.length).toBeGreaterThan(0);
    });
    it('应该包含 AAENCODE_PAYLOAD 标记', () => {
      const enc = aaencode_encode('test');
      expect(enc).toContain('AAENCODE_PAYLOAD:');
    });
    it('空字符串返回空', () => {
      expect(aaencode_encode('')).toBe('');
    });
  });

  describe('decode', () => {
    it('应该能从自身编码结果中解码还原', () => {
      const enc = aaencode_encode('test123');
      expect(aaencode_decode(enc)).toBe('test123');
    });
    it('应该能从 atob("...") 格式中提取base64解码', () => {
      // AAencode内部使用base64
      const base64 = Buffer.from('flag', 'utf-8').toString('base64');
      const code = 'atob("' + base64 + '")';
      expect(aaencode_decode(code)).toBe('flag');
    });
    it('空字符串返回空', () => {
      expect(aaencode_decode('')).toBe('');
    });
    it('包含颜文字但无法提取payload时抛出错误', () => {
      expect(() => aaencode_decode('ﾟωﾟﾉ invalid stuff')).toThrow();
    });
    it('无效输入抛出错误', () => {
      expect(() => aaencode_decode('not valid base64 or aaencode !!!')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'CTFflag';
      expect(aaencode_decode(aaencode_encode(input))).toBe(input);
    });
  });
});

// ================================================================
// JJencode
// ================================================================
describe('JJencode 编解码', () => {
  describe('encode', () => {
    it('应该生成包含 $ 符号的JS代码', () => {
      const enc = jjencode_encode('test');
      expect(enc).toContain('$');
      expect(enc.length).toBeGreaterThan(0);
    });
    it('应该包含 JJENCODE_PAYLOAD 标记', () => {
      const enc = jjencode_encode('test');
      expect(enc).toContain('JJENCODE_PAYLOAD:');
    });
    it('空字符串返回空', () => {
      expect(jjencode_encode('')).toBe('');
    });
  });

  describe('decode', () => {
    it('应该能从自身编码结果中解码还原', () => {
      const enc = jjencode_encode('test123');
      expect(jjencode_decode(enc)).toBe('test123');
    });
    it('空字符串返回空', () => {
      expect(jjencode_decode('')).toBe('');
    });
    it('包含JJencode特征但无法提取payload时抛出错误', () => {
      expect(() => jjencode_decode('$=~[]; $$ something wrong')).toThrow();
    });
    it('无效输入抛出错误', () => {
      expect(() => jjencode_decode('!!!')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'CTFflag';
      expect(jjencode_decode(jjencode_encode(input))).toBe(input);
    });
  });
});
