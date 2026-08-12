/**
 * ROT5 - 只旋转数字0-9（向后移5位）
 */
function rot5Shift(input) {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch >= '0' && ch <= '9') {
      result += String.fromCharCode(
        ((ch.charCodeAt(0) - 48 + 5) % 10) + 48
      );
    } else {
      result += ch;
    }
  }
  return result;
}

export function rot5Encode(input) {
  return rot5Shift(input);
}

export function rot5Decode(input) {
  return rot5Shift(input);
}

/**
 * ROT13 - 只旋转字母A-Z和a-z（向后移13位）
 */
function rot13Shift(input) {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch >= 'A' && ch <= 'Z') {
      result += String.fromCharCode(
        ((ch.charCodeAt(0) - 65 + 13) % 26) + 65
      );
    } else if (ch >= 'a' && ch <= 'z') {
      result += String.fromCharCode(
        ((ch.charCodeAt(0) - 97 + 13) % 26) + 97
      );
    } else {
      result += ch;
    }
  }
  return result;
}

export function rot13Encode(input) {
  return rot13Shift(input);
}

export function rot13Decode(input) {
  return rot13Shift(input);
}

/**
 * ROT18 - ROT13(字母) + ROT5(数字) 的组合
 */
function rot18Shift(input) {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch >= 'A' && ch <= 'Z') {
      result += String.fromCharCode(
        ((ch.charCodeAt(0) - 65 + 13) % 26) + 65
      );
    } else if (ch >= 'a' && ch <= 'z') {
      result += String.fromCharCode(
        ((ch.charCodeAt(0) - 97 + 13) % 26) + 97
      );
    } else if (ch >= '0' && ch <= '9') {
      result += String.fromCharCode(
        ((ch.charCodeAt(0) - 48 + 5) % 10) + 48
      );
    } else {
      result += ch;
    }
  }
  return result;
}

export function rot18Encode(input) {
  return rot18Shift(input);
}

export function rot18Decode(input) {
  return rot18Shift(input);
}

/**
 * ROT47 - 旋转ASCII 33-126范围内所有可打印字符（向后移47位）
 * 范围 '!' (33) 到 '~' (126)，共94个字符
 */
function rot47Shift(input) {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code >= 33 && code <= 126) {
      result += String.fromCharCode(
        ((code - 33 + 47) % 94) + 33
      );
    } else {
      result += input[i];
    }
  }
  return result;
}

export function rot47Encode(input) {
  return rot47Shift(input);
}

export function rot47Decode(input) {
  return rot47Shift(input);
}
