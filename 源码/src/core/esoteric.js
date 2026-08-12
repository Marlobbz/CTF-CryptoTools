// ============================================================
// 迷惑性脚本编码：Brainfuck / JSFuck / Jother
// ============================================================

// ----------------------------------------------------------
// 1. Brainfuck
// ----------------------------------------------------------

/**
 * Brainfuck 解释器
 */
function interpretBrainfuck(code, input = "") {
  const mem = new Uint8Array(30000);
  let ptr = 0;
  let pc = 0;
  let inputPtr = 0;
  const output = [];
  const codeLen = code.length;

  // 预计算括号跳转表
  const jump = new Int32Array(codeLen);
  const stack = [];
  for (let i = 0; i < codeLen; i++) {
    if (code[i] === "[") {
      stack.push(i);
    } else if (code[i] === "]") {
      if (stack.length === 0) {
        throw new Error("Brainfuck decode error: unmatched ']' at position " + i);
      }
      const open = stack.pop();
      jump[open] = i;
      jump[i] = open;
    }
  }
  if (stack.length > 0) {
    throw new Error("Brainfuck decode error: unmatched '[' at position " + stack[0]);
  }

  const MAX_STEPS = 1000000;
  let steps = 0;

  while (pc < codeLen) {
    if (++steps > MAX_STEPS) {
      throw new Error("Brainfuck decode error: execution timeout (exceeded " + MAX_STEPS + " steps)");
    }

    const op = code[pc];
    switch (op) {
      case ">": ptr = (ptr + 1) % 30000; break;
      case "<": ptr = (ptr - 1 + 30000) % 30000; break;
      case "+": mem[ptr] = (mem[ptr] + 1) & 0xff; break;
      case "-": mem[ptr] = (mem[ptr] - 1) & 0xff; break;
      case ".": output.push(String.fromCharCode(mem[ptr])); break;
      case ",": mem[ptr] = inputPtr < input.length ? input.charCodeAt(inputPtr++) : 0; break;
      case "[": if (mem[ptr] === 0) pc = jump[pc]; break;
      case "]": if (mem[ptr] !== 0) pc = jump[pc]; break;
    }
    pc++;
  }

  return output.join("");
}

/**
 * 生成 Brainfuck 程序（优化：相邻字符用差值调整）
 */
function generateBrainfuck(text) {
  if (!text || text.length === 0) return "";
  let code = "";
  let current = 0;
  for (let i = 0; i < text.length; i++) {
    const target = text.charCodeAt(i);
    const diff = target - current;
    if (diff > 0) {
      code += "+".repeat(diff);
    } else if (diff < 0) {
      code += "-".repeat(-diff);
    }
    code += ".";
    current = target;
  }
  return code;
}

export const brainfuck = {
  encode(input) {
    if (typeof input !== "string") throw new Error("Brainfuck encode: input must be a string");
    return generateBrainfuck(input);
  },
  decode(input) {
    if (typeof input !== "string") throw new Error("Brainfuck decode: input must be a string");
    if (input.length === 0) return "";
    return interpretBrainfuck(input);
  },
};

// ----------------------------------------------------------
// 2. JSFuck (字符集: []()!+)
// ----------------------------------------------------------

// --- 通用基础工具 ---

/**
 * 将数字 n 转为 JSFuck 表达式（仅用于小整数 0-9 的索引）
 */
function jsNumber(n) {
  if (n === 0) return "+[]";
  if (n === 1) return "+!![]";
  if (n <= 9) {
    return "+!![]" + "+!![]".repeat(n - 1);
  }
  // 大数：构建十进制字符串再转数值
  const digits = String(n);
  const parts = digits.split("").map(d => {
    const v = Number(d);
    if (v === 0) return "(+[])+[]";
    return "(+!![]" + "+!![]".repeat(v - 1) + ")+[]";
  });
  return "+(" + parts.join("+") + ")";
}

/**
 * 从 source 字符串表达式中提取索引 index 处的字符
 */
function charAt(sourceExpr, index) {
  return "(" + sourceExpr + ")[" + jsNumber(index) + "]";
}

/**
 * 构建完整的 JSFuck 字符映射表（惰性初始化）
 */
let _jsMap = null;
function getJSMap() {
  if (_jsMap) return _jsMap;

  const map = {};

  // 层级 0：基础类型强制转换
  // [].toString() === ""
  // ![] === false, ![]+[] === "false"
  // !![] === true,  !![]+[] === "true"
  // [][[]] === undefined, [][[]]+[] === "undefined"
  const srcFalse = "(![]+[])";
  const srcTrue = "(!![]+[])";
  const srcUndef = "([][[]]+[])";

  "false".split("").forEach((c, i) => { if (!(c in map)) map[c] = charAt(srcFalse, i); });
  "true".split("").forEach((c, i) => { if (!(c in map)) map[c] = charAt(srcTrue, i); });
  "undefined".split("").forEach((c, i) => { if (!(c in map)) map[c] = charAt(srcUndef, i); });

  // 层级 1：获取 Function 源码 — 拼写 "find"
  const fExpr = map["f"], iExpr = map["i"], nExpr = map["n"], dExpr = map["d"];
  const findStr = fExpr + "+" + iExpr + "+" + nExpr + "+" + dExpr;
  const srcFunc = "([][" + findStr + "]+[])";
  const funcS = "function find() { [native code] }";
  funcS.split("").forEach((c, i) => { if (!(c in map)) map[c] = charAt(srcFunc, i); });

  // 层级 2：拼写 "constructor"
  const cExpr = map["c"], oExpr = map["o"], sExpr = map["s"];
  const tExpr = map["t"], rExpr = map["r"], uExpr = map["u"];
  const constrStr = [cExpr,oExpr,nExpr,sExpr,tExpr,rExpr,uExpr,cExpr,tExpr,oExpr,rExpr].join("+");

  // 层级 3：获取类型构造函数名（获取大写字母）
  // (+[])["constructor"]+[] → "function Number() { [native code] }" → N@9
  const srcNumCtor = "((+[])[" + constrStr + "]+[])";
  "function Number() { [native code] }".split("").forEach((c, i) => {
    if (!(c in map)) map[c] = charAt(srcNumCtor, i);
  });

  // ([]+[])["constructor"]+[] → "function String() { [native code] }" → S@9
  const srcStrCtor = "(([]+[])[" + constrStr + "]+[])";
  "function String() { [native code] }".split("").forEach((c, i) => {
    if (!(c in map)) map[c] = charAt(srcStrCtor, i);
  });

  // (![])["constructor"]+[] → "function Boolean() { [native code] }" → B@9
  const srcBoolCtor = "((![])[" + constrStr + "]+[])";
  "function Boolean() { [native code] }".split("").forEach((c, i) => {
    if (!(c in map)) map[c] = charAt(srcBoolCtor, i);
  });

  // []["constructor"]+[] → "function Array() { [native code] }" → A@9
  const srcArrCtor = "([][" + constrStr + "]+[])";
  "function Array() { [native code] }".split("").forEach((c, i) => {
    if (!(c in map)) map[c] = charAt(srcArrCtor, i);
  });

  // []["find"]["constructor"]+[] → "function Function() { [native code] }" → F@9
  const srcFuncCtor = "([][" + findStr + "][" + constrStr + "]+[])";
  "function Function() { [native code] }".split("").forEach((c, i) => {
    if (!(c in map)) map[c] = charAt(srcFuncCtor, i);
  });

  // 层级 4：提取三个关键字符串 "return", "eval", "atob"
  const eExpr = map["e"], vExpr = map["v"], aExpr = map["a"], lExpr = map["l"];
  const bExpr = map["b"];

  // "return " (with trailing space)
  const spExpr = map[" "];
  const returnJS = [rExpr,eExpr,tExpr,uExpr,rExpr,nExpr,spExpr].join("+");
  const evalJS = [eExpr,vExpr,aExpr,lExpr].join("+");
  const atobJS = [aExpr,tExpr,oExpr,bExpr].join("+");

  // 层级 5：Function 构造函数表达式
  const funcCtorExpr = "([][" + findStr + "][" + constrStr + "])";

  _jsMap = {
    map,
    returnJS,
    evalJS,
    atobJS,
    funcCtorExpr,
    constrStr,
    findStr,
  };
  return _jsMap;
}

/**
 * JSFuck encode：对每个字符，从 char map 中查找对应表达式。
 * 若所有字符都能在 map 中找到，则拼接生成 Function("return ...")() 形式的表达式。
 * 若有字符缺失，尝试使用 eval/atob 间接方式。
 */
function encodeJSFuck(input) {
  if (input.length === 0) return "";

  const { map, funcCtorExpr, returnJS, evalJS, atobJS } = getJSMap();

  // 检查是否所有字符都在映射中
  const missing = new Set();
  for (const ch of input) {
    if (!(ch in map)) missing.add(ch);
  }

  if (missing.size > 0) {
    // 尝试通过 base64 + atob 编码
    // atob("base64_string") 解码 → 然后用 eval 执行以返回字符串
    // 流程：base64(input) → atob解码 → 得到原始字符串
    // 但 base64 和 atob 结果的字符也必须能表示...
    // 对于无法直接映射的字符，我们使用 hex 转义后再用 eval/Function 还原
    return encodeJSFuckViaHex(input, { map, funcCtorExpr, returnJS, evalJS });
  }

  // 直接拼接：Function("return" + char0 + char1 + ...)()
  const charParts = [];
  for (const ch of input) {
    charParts.push(map[ch]);
  }
  const body = charParts.join("+");
  return funcCtorExpr + "(" + returnJS + "+" + body + ")()";
}

/**
 * 通过 hex 编码 + eval 还原的备用 JSFuck 编码
 * 策略：
 *   1. 将输入转为 hex 字符串（如 "Hi" → "4869"）
 *   2. hex 字符串只含 0-9a-f，这些字符大部分在 map 中（0-9,a-f 都有）
 *   3. 生成: Function("return eval('\"'+atob(hex解码)...)")... 
 *   
 *   实际上更简单：把输入转为 hex，然后生成 JS 表达式
 *   eval(String.fromCharCode(0x48,0x69)) 但 fromCharCode 拼不出...
 *
 * 最终方案：使用 Function 构造器，传入的 body 使用 hex 转义语法
 *   Function("return '\\x48\\x69'")()
 *   但这需要反斜杠和单引号，这些不在 JSFuck 字符集中
 *
 * 真正能用的方案：
 *   将输入编码为一段 JSFuck，该段代码运行时：
 *     1. 构建 hex 字符串
 *     2. 逐字节解析还原为原始字符串
 *
 * hex 字符 0-9 a-f 全在 map 中 ✓
 * 所以将输入 hex 化后，逐字符拼出 hex 字符串，
 * 然后用一个解码函数还原。
 *
 * 解码函数: Function("h","s","return s.replace(/../g,...)") 
 * 但这涉及正则，需要拼写更多字符。
 *
 * 简化：直接在 Function body 中用 while 循环还原
 * 但 while/for/var/let 关键字也需要字符...
 *
 * 最简方案：
 *   Function("a","return eval(String.fromCharCode(" + codes + "))")()
 *   其中 codes 是逗号分隔的十进制数字
 *   但 fromCharCode 拼不出...
 *
 * 兜底方案：抛出明确错误
 */
function encodeJSFuckViaHex(input, ctx) {
  // 检查 input 的 hex 表示中所有字符是否在 map 中
  const hex = Array.from(new TextEncoder().encode(input))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // hex 字符只包含 0-9 a-f
  const { map, funcCtorExpr, returnJS } = ctx;
  const hexMissing = new Set();
  for (const ch of hex) {
    if (!(ch in map)) hexMissing.add(ch);
  }

  if (hexMissing.size > 0) {
    // 极少数情况（理论上 hex 字符都在 map 中）
    const allMissing = new Set();
    for (const ch of input) if (!(ch in map)) allMissing.add(ch);
    throw new Error(
      "JSFuck encode: cannot encode characters: " + [...allMissing].join("") +
      " (character set too limited with []()!+)"
    );
  }

  // 拼出 hex 字符串
  const hexParts = [];
  for (const ch of hex) {
    hexParts.push(map[ch]);
  }
  const hexStr = hexParts.join("+");

  // 构建一个简单的 hex 解码函数体
  // 由于无法直接使用循环/条件语句（关键字字符受限），
  // 我们使用一个预定义的解码模式：
  // Function("return ''+...") 然后用 charCodeAt 手动构建
  //
  // 实际可行方案：使用递归风格的表达式
  // 把 hex 字符串切成每 2 个字符一组，每组转成一个字符
  //
  // 但最简单的方法：直接用 Array 的 map/reduce
  // 问题是 "map" "reduce" 都能在 map 中吗？
  // "map": m,a,p — m✓ a✓ p✗ → 不行

  // 最终方案：对于超过 40 个字符的字符集限制无法编码的情况，返回错误
  // 对于能 hex 化 + eval 回来的场景：
  // 生成: Function("return String.fromCharCode(" + codeList + ")")()
  // 我们只需要拼写 "String" 和 "fromCharCode" 以及数字
  // "String" = S,t,r,i,n,g — 全在 map 中
  // "fromCharCode" = f,r,o,m,C,h,a,r,C,o,d,e — C 和 h 不在 map 中!

  // 使用 eval+atob 方案
  // atob 可拼：(a,t,o,b) ✓
  // 但 atob 的参数 base64 字符串必须也能拼出...

  // 兜底：拼出 hex 字符串，用 eval 执行
  // eval("\x48\x69") → 但 \x 语法需要 \ 和 x
  // \ 不在 map 中

  // 尝试方案: 对每个字符生成 charCodeAt 数字，在 Function body 中硬编码
  // Function("return String.fromCharCode(72,105)")()
  // 需要用到的字符：return String.fromCharCode(数字,数字)
  // fromCharCode: C 和 h 不可用...

  // 最终放弃：报告不支持
  throw new Error(
    "JSFuck encode: unsupported characters '" + [...new Set(
      [...input].filter(c => !(c in ctx.map))
    )].join("") + "'" +
    " - JSFuck charset []()!+ can only encode " +
    "alphanumeric subset (a-z minus h/j/k/p/q/w/x/z, A/B/F/N/S, 0-9, spaces/parens/brackets/braces)"
  );
}

/**
 * 验证是否只含 JSFuck 字符 []()!+
 */
function isValidJSFuck(str) {
  return /^[\[\]\(\)!\+]+$/.test(str);
}

export const jsfuck = {
  encode(input) {
    if (typeof input !== "string") throw new Error("JSFuck encode: input must be a string");
    return encodeJSFuck(input);
  },
  decode(input) {
    if (typeof input !== "string") throw new Error("JSFuck decode: input must be a string");
    if (input.length === 0) return "";
    if (!isValidJSFuck(input)) {
      throw new Error("JSFuck decode: input contains characters outside the JSFuck charset []()!+");
    }
    try {
      const result = eval?.("'use strict'; " + input);
      if (typeof result !== "string") return String(result);
      return result;
    } catch (e) {
      throw new Error("JSFuck decode: execution failed - " + e.message);
    }
  },
};

// ----------------------------------------------------------
// 3. Jother (字符集: ()[]{}!+)
// ----------------------------------------------------------

let _joMap = null;
function getJOMap() {
  if (_joMap) return _joMap;

  const map = {};

  // 基础源：与 JSFuck 相同
  const srcFalse = "(![]+[])";
  const srcTrue = "(!![]+[])";
  const srcUndef = "([][[]]+[])";
  // Jother 额外源（使用 {}）
  const srcNaN = "(+{}+[])";        // "NaN"
  const srcObj = "([]+{})";         // "[object Object]"

  "false".split("").forEach((c,i) => { if (!(c in map)) map[c] = charAt(srcFalse,i); });
  "true".split("").forEach((c,i) => { if (!(c in map)) map[c] = charAt(srcTrue,i); });
  "undefined".split("").forEach((c,i) => { if (!(c in map)) map[c] = charAt(srcUndef,i); });
  "NaN".split("").forEach((c,i) => { if (!(c in map)) map[c] = charAt(srcNaN,i); });
  "[object Object]".split("").forEach((c,i) => { if (!(c in map)) map[c] = charAt(srcObj,i); });

  // 拼写 "find"
  const fExpr = map["f"], iExpr = map["i"], nExpr = map["n"], dExpr = map["d"];
  const findStr = [fExpr,iExpr,nExpr,dExpr].join("+");
  const srcFunc = "([][" + findStr + "]+[])";
  "function find() { [native code] }".split("").forEach((c,i) => {
    if (!(c in map)) map[c] = charAt(srcFunc,i);
  });

  // 拼写 "constructor"
  const cExpr = map["c"], oExpr = map["o"], sExpr = map["s"];
  const tExpr = map["t"], rExpr = map["r"], uExpr = map["u"];
  const eExpr = map["e"], vExpr = map["v"], aExpr = map["a"], lExpr = map["l"];
  const bExpr = map["b"];
  const constrStr = [cExpr,oExpr,nExpr,sExpr,tExpr,rExpr,uExpr,cExpr,tExpr,oExpr,rExpr].join("+");

  // 类型构造函数（获取大写字母）
  const srcNumCtor = "((+[])[" + constrStr + "]+[])";
  "function Number() { [native code] }".split("").forEach((c,i) => {
    if (!(c in map)) map[c] = charAt(srcNumCtor,i);
  });
  const srcStrCtor = "(([]+[])[" + constrStr + "]+[])";
  "function String() { [native code] }".split("").forEach((c,i) => {
    if (!(c in map)) map[c] = charAt(srcStrCtor,i);
  });
  const srcBoolCtor = "((![])[" + constrStr + "]+[])";
  "function Boolean() { [native code] }".split("").forEach((c,i) => {
    if (!(c in map)) map[c] = charAt(srcBoolCtor,i);
  });
  const srcArrCtor = "([][" + constrStr + "]+[])";
  "function Array() { [native code] }".split("").forEach((c,i) => {
    if (!(c in map)) map[c] = charAt(srcArrCtor,i);
  });
  const srcFuncCtor = "([][" + findStr + "][" + constrStr + "]+[])";
  "function Function() { [native code] }".split("").forEach((c,i) => {
    if (!(c in map)) map[c] = charAt(srcFuncCtor,i);
  });

  // "return " (with trailing space)
  const spExprJO = map[" "];
  const returnJS = [rExpr,eExpr,tExpr,uExpr,rExpr,nExpr,spExprJO].join("+");
  const evalJS = [eExpr,vExpr,aExpr,lExpr].join("+");
  const atobJS = [aExpr,tExpr,oExpr,bExpr].join("+");
  const funcCtorExpr = "([][" + findStr + "][" + constrStr + "])";

  _joMap = { map, returnJS, evalJS, atobJS, funcCtorExpr, constrStr, findStr };
  return _joMap;
}

function encodeJother(input) {
  if (input.length === 0) return "";

  const { map, funcCtorExpr, returnJS } = getJOMap();

  const missing = new Set();
  for (const ch of input) {
    if (!(ch in map)) missing.add(ch);
  }

  if (missing.size > 0) {
    throw new Error(
      "Jother encode: unsupported characters '" + [...missing].join("") + "'" +
      " - Jother charset ()[]{}!+ can only encode a limited character set"
    );
  }

  const charParts = [];
  for (const ch of input) {
    charParts.push(map[ch]);
  }
  const body = charParts.join("+");
  return funcCtorExpr + "(" + returnJS + "+" + body + ")()";
}

function isValidJother(str) {
  return /^[\[\]\(\)\{\}!\+]+$/.test(str);
}

export const jother = {
  encode(input) {
    if (typeof input !== "string") throw new Error("Jother encode: input must be a string");
    return encodeJother(input);
  },
  decode(input) {
    if (typeof input !== "string") throw new Error("Jother decode: input must be a string");
    if (input.length === 0) return "";
    if (!isValidJother(input)) {
      throw new Error("Jother decode: input contains characters outside the Jother charset ()[]{}!+");
    }
    try {
      const result = eval?.("'use strict'; " + input);
      if (typeof result !== "string") return String(result);
      return result;
    } catch (e) {
      throw new Error("Jother decode: execution failed - " + e.message);
    }
  },
};
