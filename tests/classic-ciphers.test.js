import { describe, it, expect } from '@jest/globals';
import { morse, bacon, yunying, atbash, polybius, caesar, railFence } from '../src/core/classic-ciphers.js';

// ================================================================
// 莫斯密码
// ================================================================
describe('莫斯密码（Morse）', () => {
  describe('encode', () => {
    it('应该正确编码字母: "SOS" -> "... --- ..."', () => {
      expect(morse.encode('SOS')).toBe('... --- ...');
    });
    it('应该正确编码: "HELLO" -> ".... . .-.. .-.. ---"', () => {
      expect(morse.encode('HELLO')).toBe('.... . .-.. .-.. ---');
    });
    it('小写字母自动转大写编码', () => {
      expect(morse.encode('sos')).toBe('... --- ...');
    });
    it('空格转换为 "/"', () => {
      expect(morse.encode('A B')).toBe('.- / -...');
    });
    it('数字编码正确', () => {
      expect(morse.encode('123')).toBe('.---- ..--- ...--');
    });
    it('标点符号编码正确', () => {
      expect(morse.encode('.')).toBe('.-.-.-');
      expect(morse.encode('?')).toBe('..--..');
    });
    it('不支持的字符抛出错误', () => {
      expect(() => morse.encode('#')).toThrow();
    });
  });

  describe('decode', () => {
    it('应该正确解码: "... --- ..." -> "SOS"', () => {
      expect(morse.decode('... --- ...')).toBe('SOS');
    });
    it('"/" 解码为空格', () => {
      expect(morse.decode('.- / -...')).toBe('A B');
    });
    it('前导/尾部空格被trim', () => {
      expect(morse.decode('  ... --- ...  ')).toBe('SOS');
    });
    it('无法识别的莫斯码抛出错误', () => {
      expect(() => morse.decode('-------')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原（仅字母数字）', () => {
      const input = 'HELLO WORLD';
      const enc = morse.encode(input);
      const dec = morse.decode(enc);
      expect(dec).toBe('HELLO WORLD');
    });
    it('空字符串', () => {
      expect(morse.encode('')).toBe('');
      expect(morse.decode('')).toBe('');
    });
  });
});

// ================================================================
// 培根密码
// ================================================================
describe('培根密码（Bacon）', () => {
  describe('encode（标准模式）', () => {
    it('"A" -> "AAAAA"', () => {
      expect(bacon.encode('A')).toBe('AAAAA');
    });
    it('"B" -> "AAAAB"', () => {
      expect(bacon.encode('B')).toBe('AAAAB');
    });
    it('"HI" -> "AABBBABAAA"', () => {
      expect(bacon.encode('HI')).toBe('AABBBABAAA');
    });
    it('小写字母自动转大写', () => {
      expect(bacon.encode('ab')).toBe('AAAAAAAAAB');
    });
    it('非字母字符保留原样', () => {
      expect(bacon.encode('A!')).toBe('AAAAA!');
    });
  });

  describe('encode（ijuv 变体）', () => {
    it('J 映射到 I 的编码', () => {
      const iEnc = bacon.encode('I', { variant: 'ijuv' });
      const jEnc = bacon.encode('J', { variant: 'ijuv' });
      expect(jEnc).toBe(iEnc);
    });
    it('V 映射到 U 的编码', () => {
      const uEnc = bacon.encode('U', { variant: 'ijuv' });
      const vEnc = bacon.encode('V', { variant: 'ijuv' });
      expect(vEnc).toBe(uEnc);
    });
  });

  describe('decode（标准模式）', () => {
    it('"AAAAA" -> "A"', () => {
      expect(bacon.decode('AAAAA')).toBe('A');
    });
    it('"AABBBABAAA" -> "HI"', () => {
      expect(bacon.decode('AABBBABAAA')).toBe('HI');
    });
    it('小写ab也能解码', () => {
      expect(bacon.decode('aaaaa')).toBe('A');
    });
    it('不完整的培根码（长度不为5）抛出错误', () => {
      expect(() => bacon.decode('AAA')).toThrow();
    });
    it('未知培根码抛出错误', () => {
      // AAAAA=0=A, AAAAB=1=B, ... 所有5位组合都在范围内
      // 但如果有非AB字符造成中断，后面不完整会出错
      expect(() => bacon.decode('AAAAAB')).toThrow();
    });
  });

  describe('decode（ijuv 变体）', () => {
    it('J 解码为 I', () => {
      const iEnc = bacon.encode('I', { variant: 'ijuv' });
      expect(bacon.decode(iEnc, { variant: 'ijuv' })).toBe('I');
    });
  });

  describe('往返测试', () => {
    it('标准模式往返', () => {
      const input = 'HELLOWORLD';
      expect(bacon.decode(bacon.encode(input))).toBe(input);
    });
    it('ijuv变体往返', () => {
      const input = 'JAVA';
      const enc = bacon.encode(input, { variant: 'ijuv' });
      // J->I, V->U，所以解码结果是 IAUA
      const dec = bacon.decode(enc, { variant: 'ijuv' });
      expect(dec).toBe('IAUA');
    });
    it('空字符串', () => {
      expect(bacon.encode('')).toBe('');
      expect(bacon.decode('')).toBe('');
    });
  });
});

// ================================================================
// 云影密码
// ================================================================
describe('云影密码（YunYing / 01248）', () => {
  describe('encode', () => {
    it('"A" -> "1"（A=1）', () => {
      expect(yunying.encode('A')).toBe('1');
    });
    it('"B" -> "2"', () => {
      expect(yunying.encode('B')).toBe('2');
    });
    it('"D" -> "4"', () => {
      expect(yunying.encode('D')).toBe('4');
    });
    it('"H" -> "8"', () => {
      expect(yunying.encode('H')).toBe('8');
    });
    it('"I" -> "18"（9=8+1）', () => {
      expect(yunying.encode('I')).toBe('18');
    });
    it('"AB" 用0分隔: "102"', () => {
      expect(yunying.encode('AB')).toBe('102');
    });
    it('不支持的字符抛出错误', () => {
      expect(() => yunying.encode('1')).toThrow();
    });
    it('小写字母自动转大写', () => {
      expect(yunying.encode('a')).toBe('1');
    });
  });

  describe('decode', () => {
    it('"102" -> "AB"', () => {
      expect(yunying.decode('102')).toBe('AB');
    });
    it('"18" -> "I"', () => {
      expect(yunying.decode('18')).toBe('I');
    });
    it('"1248" -> "O"（15=1+2+4+8）', () => {
      expect(yunying.decode('1248')).toBe('O');
    });
    it('单个有效数字: "9" -> "I"（A=1,...,I=9）', () => {
      expect(yunying.decode('9')).toBe('I');
    });
    it('"12489" -> "X"（1+2+4+8+9=24）', () => {
      expect(yunying.decode('12489')).toBe('X');
    });
    it('超出26的数字组抛出错误', () => {
      expect(() => yunying.decode('999')).toThrow();
    });
    it('非数字字符抛出错误', () => {
      expect(() => yunying.decode('a')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原', () => {
      const input = 'HELLO';
      expect(yunying.decode(yunying.encode(input))).toBe(input);
    });
    it('空字符串', () => {
      expect(yunying.encode('')).toBe('');
      expect(yunying.decode('')).toBe('');
    });
  });
});

// ================================================================
// 埃特巴什码
// ================================================================
describe('埃特巴什码（Atbash）', () => {
  describe('encode', () => {
    it('"A" -> "Z"', () => {
      expect(atbash.encode('A')).toBe('Z');
    });
    it('"Z" -> "A"', () => {
      expect(atbash.encode('Z')).toBe('A');
    });
    it('"Hello" -> "Svool"', () => {
      expect(atbash.encode('Hello')).toBe('Svool');
    });
    it('非字母字符保持不变', () => {
      expect(atbash.encode('123!@#')).toBe('123!@#');
    });
  });

  describe('decode', () => {
    it('decode与encode结果相同（对称密码）', () => {
      expect(atbash.decode('Hello')).toBe('Svool');
    });
    it('"Svool" -> "Hello"', () => {
      expect(atbash.decode('Svool')).toBe('Hello');
    });
  });

  describe('往返测试', () => {
    it('encode后再decode能还原', () => {
      const input = 'HELLOWORLD';
      expect(atbash.decode(atbash.encode(input))).toBe(input);
    });
    it('包含数字的文本', () => {
      const input = 'Test123';
      expect(atbash.decode(atbash.encode(input))).toBe(input);
    });
    it('空字符串', () => {
      expect(atbash.encode('')).toBe('');
      expect(atbash.decode('')).toBe('');
    });
    it('两次调用回到原文', () => {
      const input = 'Atbash Cipher';
      expect(atbash.encode(atbash.encode(input))).toBe(input);
    });
  });
});

// ================================================================
// 波利比奥斯方阵
// ================================================================
describe('波利比奥斯方阵密码（Polybius Square）', () => {
  describe('encode', () => {
    it('"A" -> "11"', () => {
      expect(polybius.encode('A')).toBe('11');
    });
    it('"B" -> "12"', () => {
      expect(polybius.encode('B')).toBe('12');
    });
    it('"E" -> "15"', () => {
      expect(polybius.encode('E')).toBe('15');
    });
    it('"HELLO" 编码结果', () => {
      expect(polybius.encode('HELLO')).toBe('2315313134');
    });
    it('I/J共用位置: I和J编码结果相同', () => {
      expect(polybius.encode('I')).toBe(polybius.encode('J'));
    });
    it('不支持的字符抛出错误', () => {
      expect(() => polybius.encode('1')).toThrow();
    });
  });

  describe('decode', () => {
    it('"11" -> "A"', () => {
      expect(polybius.decode('11')).toBe('A');
    });
    it('"2315313134" -> "HELLO"', () => {
      expect(polybius.decode('2315313134')).toBe('HELLO');
    });
    it('奇数长度输入抛出错误', () => {
      expect(() => polybius.decode('111')).toThrow();
    });
    it('无效坐标抛出错误', () => {
      expect(() => polybius.decode('66')).toThrow();
    });
  });

  describe('往返测试', () => {
    it('encode后decode能还原（不含J的文本）', () => {
      const input = 'HELLOWORLD';
      expect(polybius.decode(polybius.encode(input))).toBe('HELLOWORLD');
    });
    it('空字符串', () => {
      expect(polybius.encode('')).toBe('');
      expect(polybius.decode('')).toBe('');
    });
  });
});

// ================================================================
// 凯撒密码
// ================================================================
describe('凯撒密码（Caesar）', () => {
  describe('encode', () => {
    it('默认偏移3: "ABC" -> "DEF"', () => {
      expect(caesar.encode('ABC')).toBe('DEF');
    });
    it('偏移5: "ABC" -> "FGH"', () => {
      expect(caesar.encode('ABC', { shift: 5 })).toBe('FGH');
    });
    it('偏移1: "Z" -> "A"（循环）', () => {
      expect(caesar.encode('Z', { shift: 1 })).toBe('A');
    });
    it('小写字母也旋转', () => {
      expect(caesar.encode('abc', { shift: 1 })).toBe('bcd');
    });
    it('非字母字符保持不变', () => {
      expect(caesar.encode('123!@#')).toBe('123!@#');
    });
    it('负数偏移: shift=-3 等同于 shift=23', () => {
      expect(caesar.encode('DEF', { shift: -3 })).toBe('ABC');
    });
  });

  describe('decode', () => {
    it('默认偏移3: "DEF" -> "ABC"', () => {
      expect(caesar.decode('DEF')).toBe('ABC');
    });
    it('指定偏移5: "FGH" -> "ABC"', () => {
      expect(caesar.decode('FGH', { shift: 5 })).toBe('ABC');
    });
    it('decode与encode方向相反', () => {
      // encode(shift=3) 后再 decode(shift=3) 还原
      expect(caesar.decode(caesar.encode('HELLO', { shift: 3 }), { shift: 3 })).toBe('HELLO');
    });
  });

  describe('往返测试', () => {
    it('默认偏移往返', () => {
      const input = 'HELLOWORLD';
      expect(caesar.decode(caesar.encode(input))).toBe(input);
    });
    it('自定义偏移往返', () => {
      const input = 'SensitiveData';
      for (const shift of [1, 5, 13, 25]) {
        expect(caesar.decode(caesar.encode(input, { shift }), { shift })).toBe(input);
      }
    });
    it('空字符串', () => {
      expect(caesar.encode('')).toBe('');
      expect(caesar.decode('')).toBe('');
    });
    it('ROT13等价于凯撒偏移13', () => {
      const input = 'HelloWorld';
      expect(caesar.encode(input, { shift: 13 })).toBe(caesar.decode(input, { shift: 13 }));
    });
  });
});

// ================================================================
// 栅栏密码
// ================================================================
describe('栅栏密码（Rail Fence）', () => {
  describe('encode', () => {
    it('默认3栏: "HELLOWORLD" -> "HOLELWRDLO"', () => {
      expect(railFence.encode('HELLOWORLD')).toBe('HOLELWRDLO');
    });
    it('行数为2: "HELLOWORLD" -> "HLOOLELWRD"', () => {
      expect(railFence.encode('HELLOWORLD', { rails: 2 })).toBe('HLOOLELWRD');
    });
    it('行数为4: "HELLOWORLD" -> "HOEWRLOLLD"', () => {
      expect(railFence.encode('HELLOWORLD', { rails: 4 })).toBe('HOEWRLOLLD');
    });
    it('行数为1时返回原文', () => {
      expect(railFence.encode('HELLO', { rails: 1 })).toBe('HELLO');
    });
    it('行数大于等于字符串长度时返回原文', () => {
      expect(railFence.encode('HI', { rails: 5 })).toBe('HI');
    });
    it('行数小于2时返回原文', () => {
      expect(railFence.encode('HELLO', { rails: 0 })).toBe('HELLO');
    });
  });

  describe('decode', () => {
    it('默认3栏: "HOLELWRDLO" -> "HELLOWORLD"', () => {
      expect(railFence.decode('HOLELWRDLO')).toBe('HELLOWORLD');
    });
    it('行数为2时解码', () => {
      const enc = railFence.encode('HELLOWORLD', { rails: 2 });
      expect(railFence.decode(enc, { rails: 2 })).toBe('HELLOWORLD');
    });
    it('行数为1时返回原文', () => {
      expect(railFence.decode('HELLO', { rails: 1 })).toBe('HELLO');
    });
  });

  describe('往返测试', () => {
    it('默认3栏往返', () => {
      const input = 'HELLOWORLD';
      expect(railFence.decode(railFence.encode(input))).toBe(input);
    });
    it('多栏往返', () => {
      const input = 'CTFCRYPTOGRAPHY';
      for (const rails of [2, 3, 4, 5]) {
        expect(railFence.decode(railFence.encode(input, { rails }), { rails })).toBe(input);
      }
    });
    it('空字符串', () => {
      expect(railFence.encode('')).toBe('');
      expect(railFence.decode('')).toBe('');
    });
  });
});
