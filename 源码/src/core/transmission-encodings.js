// ============================================================
// 经典传输编码（Transmission Encodings）
// UUencode / XXencode / AAencode / JJencode
// ============================================================

// -----------------------------------------------------------
// 一、UUencode（经典 Unix-to-Unix 编码）
// -----------------------------------------------------------

/** UUencode 6-bit 字符映射表：ASCII 32(空格) 到 95(下划线)，共64个字符 */
const UU_CHARSET = Array.from({ length: 64 }, (_, i) => String.fromCharCode(32 + i));

/**
 * UUencode 编码
 * @param {string} input - 原始字符串
 * @returns {string} UUencode 编码结果
 */
export function uuencode_encode(input) {
    if (input === undefined || input === null) {
        throw new Error('uuencode encode: input must be a string');
    }
    if (input.length === 0) return '';

    const bytes = new TextEncoder().encode(input);
    const lines = [];
    const LINE_MAX = 45; // 每行最多编码45字节原始数据

    // begin 行
    lines.push('begin 644 data.txt');

    for (let offset = 0; offset < bytes.length; offset += LINE_MAX) {
        const chunk = bytes.slice(offset, offset + LINE_MAX);
        const lenChar = String.fromCharCode(32 + chunk.length); // 长度字符
        let encoded = lenChar;

        for (let i = 0; i < chunk.length; i += 3) {
            const b0 = chunk[i];
            const b1 = i + 1 < chunk.length ? chunk[i + 1] : 0;
            const b2 = i + 2 < chunk.length ? chunk[i + 2] : 0;

            // 3个8-bit字节 → 4个6-bit值
            const c0 = (b0 >> 2) & 0x3f;
            const c1 = ((b0 << 4) & 0x30) | ((b1 >> 4) & 0x0f);
            const c2 = ((b1 << 2) & 0x3c) | ((b2 >> 6) & 0x03);
            const c3 = b2 & 0x3f;

            encoded += UU_CHARSET[c0] + UU_CHARSET[c1] + UU_CHARSET[c2] + UU_CHARSET[c3];
        }

        lines.push(encoded);
    }

    // 零长度行（反引号表示结束） — 用户指定用反引号
    lines.push('`');
    // end 行
    lines.push('end');

    return lines.join('\n');
}

/**
 * UUencode 解码
 * @param {string} input - UUencode 编码字符串
 * @returns {string} 解码后的原始字符串
 */
export function uuencode_decode(input) {
    if (input === undefined || input === null) {
        throw new Error('uuencode decode: input must be a string');
    }
    if (input.length === 0) return '';

    const lines = input.split(/\r?\n/);
    let inData = false;
    const chunks = [];

    // 构建反向字符映射表
    const charMap = new Map();
    for (let i = 0; i < UU_CHARSET.length; i++) {
        charMap.set(UU_CHARSET[i], i);
    }

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (line === '') continue;

        // 跳过 begin 行
        if (line.startsWith('begin ')) {
            inData = true;
            continue;
        }

        // end 行结束
        if (line === 'end') {
            break;
        }

        // 反引号或仅空格的行表示数据结束
        if (line === '`' || line === ' ') {
            break;
        }

        if (!inData) continue;

        // 解析数据行
        const lenChar = line[0];
        const lenCode = lenChar.codePointAt(0);

        // 长度字符 ASCII 值减去32得到实际字节数（1-45），超出范围则跳过
        const dataLen = lenCode - 32;
        if (dataLen <= 0 || dataLen > 45) {
            continue;
        }

        const encodedPart = line.slice(1);
        const groupCount = Math.ceil(dataLen / 3);

        for (let i = 0; i < groupCount; i++) {
            const pos = i * 4;
            const c0 = charMap.get(encodedPart[pos]) ?? 0;
            const c1 = charMap.get(encodedPart[pos + 1]) ?? 0;
            const c2 = charMap.get(encodedPart[pos + 2]) ?? 0;
            const c3 = charMap.get(encodedPart[pos + 3]) ?? 0;

            const b0 = ((c0 << 2) & 0xfc) | ((c1 >> 4) & 0x03);
            const b1 = ((c1 << 4) & 0xf0) | ((c2 >> 2) & 0x0f);
            const b2 = ((c2 << 6) & 0xc0) | (c3 & 0x3f);

            chunks.push(b0);
            if (i * 3 + 1 < dataLen) chunks.push(b1);
            if (i * 3 + 2 < dataLen) chunks.push(b2);
        }
    }

    if (chunks.length === 0) {
        throw new Error('uuencode decode: no valid data found in input');
    }

    return new TextDecoder().decode(new Uint8Array(chunks));
}

// -----------------------------------------------------------
// 二、XXencode（UUencode 变体，使用不同字符集）
// -----------------------------------------------------------

/** XXencode 6-bit 字符映射表：+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz */
const XX_CHARSET = '+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * XXencode 编码
 * @param {string} input - 原始字符串
 * @returns {string} XXencode 编码结果（纯编码数据，无 begin/end 标记）
 */
export function xxencode_encode(input) {
    if (input === undefined || input === null) {
        throw new Error('xxencode encode: input must be a string');
    }
    if (input.length === 0) return '';

    const bytes = new TextEncoder().encode(input);
    const lines = [];
    const LINE_MAX = 45;

    for (let offset = 0; offset < bytes.length; offset += LINE_MAX) {
        const chunk = bytes.slice(offset, offset + LINE_MAX);
        const lenChar = XX_CHARSET[chunk.length]; // XXencode 长度字符（索引即长度）
        let encoded = lenChar;

        for (let i = 0; i < chunk.length; i += 3) {
            const b0 = chunk[i];
            const b1 = i + 1 < chunk.length ? chunk[i + 1] : 0;
            const b2 = i + 2 < chunk.length ? chunk[i + 2] : 0;

            const c0 = (b0 >> 2) & 0x3f;
            const c1 = ((b0 << 4) & 0x30) | ((b1 >> 4) & 0x0f);
            const c2 = ((b1 << 2) & 0x3c) | ((b2 >> 6) & 0x03);
            const c3 = b2 & 0x3f;

            encoded += XX_CHARSET[c0] + XX_CHARSET[c1] + XX_CHARSET[c2] + XX_CHARSET[c3];
        }

        lines.push(encoded);
    }

    // XXencode 尾部：+ 表示0长度行
    lines.push('+');

    return lines.join('\n');
}

/**
 * XXencode 解码
 * @param {string} input - XXencode 编码字符串
 * @returns {string} 解码后的原始字符串
 */
export function xxencode_decode(input) {
    if (input === undefined || input === null) {
        throw new Error('xxencode decode: input must be a string');
    }
    if (input.length === 0) return '';

    const lines = input.split(/\r?\n/);
    const charMap = new Map();
    for (let i = 0; i < XX_CHARSET.length; i++) {
        charMap.set(XX_CHARSET[i], i);
    }

    const chunks = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line === '') continue;

        const lenChar = line[0];
        const dataLen = charMap.get(lenChar);

        if (dataLen === undefined || dataLen === 0) {
            // '+' 字符值为0，表示结束；未知字符跳过
            continue;
        }
        if (dataLen > 45) continue;

        const encodedPart = line.slice(1);
        const groupCount = Math.ceil(dataLen / 3);

        for (let i = 0; i < groupCount; i++) {
            const pos = i * 4;
            const c0 = charMap.get(encodedPart[pos]) ?? 0;
            const c1 = charMap.get(encodedPart[pos + 1]) ?? 0;
            const c2 = charMap.get(encodedPart[pos + 2]) ?? 0;
            const c3 = charMap.get(encodedPart[pos + 3]) ?? 0;

            const b0 = ((c0 << 2) & 0xfc) | ((c1 >> 4) & 0x03);
            const b1 = ((c1 << 4) & 0xf0) | ((c2 >> 2) & 0x0f);
            const b2 = ((c2 << 6) & 0xc0) | (c3 & 0x3f);

            chunks.push(b0);
            if (i * 3 + 1 < dataLen) chunks.push(b1);
            if (i * 3 + 2 < dataLen) chunks.push(b2);
        }
    }

    if (chunks.length === 0) {
        throw new Error('xxencode decode: no valid data found in input');
    }

    return new TextDecoder().decode(new Uint8Array(chunks));
}

// -----------------------------------------------------------
// 三、AAencode（颜文字 JavaScript 编码）— 简化实现
// -----------------------------------------------------------

/**
 * AAencode 编码（简化版）
 * 将输入转为 base64，包装成 AAencode 风格的 JS 代码模板。
 * 生成的代码可在浏览器/Node.js 中 eval 执行得到原文。
 *
 * @param {string} input - 原始字符串
 * @returns {string} AAencode 风格的 JS 代码
 */
export function aaencode_encode(input) {
    if (input === undefined || input === null) {
        throw new Error('aaencode encode: input must be a string');
    }
    if (input.length === 0) return '';

    // 将输入转为 base64
    const base64 = Buffer.from(input, 'utf-8').toString('base64');

    // 构建 AAencode 风格模板，base64 嵌入在 atob() 调用中
    // 使用 AAencode 经典的颜文字构造器模式
    const template = [
        'ﾟωﾟﾉ= /｀ｍ´）ﾉ ~┻━┻   /＊*´∇｀*/ [\'_\'];',
        'o=(ﾟｰﾟ)  =_=3;',
        'c=(ﾟΘﾟ) =(ﾟｰﾟ)-(ﾟｰﾟ);',
        '(ﾟДﾟ) =(ﾟΘﾟ)= (o^_^o)/ (o^_^o);',
        '(ﾟДﾟ)={ﾟΘﾟ: \'_\' ,ﾟωﾟﾉ : ((ﾟωﾟﾉ==3) +\'_\') [ﾟΘﾟ] ,ﾟｰﾟﾉ :(ﾟωﾟﾉ+ \'_\')[o^_^o -(ﾟΘﾟ)] ,ﾟДﾟﾉ:((ﾟｰﾟ==3) +\'_\')[ﾟｰﾟ] };',
        '(ﾟДﾟ) [ﾟΘﾟ] =((ﾟωﾟﾉ==3) +\'_\') [c^_^o];',
        '(ﾟДﾟ) [\'c\'] = ((ﾟДﾟ)+\'_\') [ (ﾟｰﾟ)+(ﾟｰﾟ)-(ﾟΘﾟ) ];',
        '(ﾟДﾟ) [\'o\'] = ((ﾟДﾟ)+\'_\') [ﾟΘﾟ];',
        '(ﾟoﾟ)=(ﾟДﾟ) [\'c\']+(ﾟДﾟ) [\'o\']+(ﾟωﾟﾉ +\'_\')[ﾟΘﾟ]+ ((ﾟωﾟﾉ==3) +\'_\') [ﾟｰﾟ] + ((ﾟДﾟ) +\'_\') [(ﾟｰﾟ)+(ﾟｰﾟ)]+ ((ﾟｰﾟ==3) +\'_\') [ﾟΘﾟ]+((ﾟｰﾟ==3) +\'_\') [(ﾟｰﾟ) - (ﾟΘﾟ)]+(ﾟДﾟ) [\'c\']+((ﾟДﾟ)+\'_\') [(ﾟｰﾟ)+(ﾟｰﾟ)]+ (ﾟДﾟ) [\'o\']+((ﾟｰﾟ==3) +\'_\') [ﾟΘﾟ];',
        '(ﾟДﾟ) [\'_\'] =(o^_^o) [ﾟoﾟ] [ﾟoﾟ];',
        '(ﾟεﾟ)=((ﾟｰﾟ==3) +\'_\') [ﾟΘﾟ]+ (ﾟДﾟ) .ﾟДﾟﾉ+((ﾟДﾟ)+\'_\') [(ﾟｰﾟ) + (ﾟｰﾟ)]+((ﾟｰﾟ==3) +\'_\') [o^_^o -ﾟΘﾟ]+((ﾟｰﾟ==3) +\'_\') [ﾟΘﾟ]+ (ﾟωﾟﾉ +\'_\') [ﾟΘﾟ];',
        '(ﾟｰﾟ)+=(ﾟΘﾟ);',
        '(ﾟДﾟ)[ﾟεﾟ]=\'\\\\\';',
        '// AAENCODE_PAYLOAD:' + base64,
        '(function(_){var d=atob(_);return d;})("' + base64 + '");',
    ].join('\n');

    return template;
}

/**
 * AAencode 解码（简化版）
 * 从 AAencode 风格的 JS 代码中提取 base64 并解码。
 * 如果输入不像 AAencode，也尝试直接 base64 解码。
 *
 * @param {string} input - AAencode 编码的 JS 代码
 * @returns {string} 解码后的原始字符串
 */
export function aaencode_decode(input) {
    if (input === undefined || input === null) {
        throw new Error('aaencode decode: input must be a string');
    }
    if (input.length === 0) return '';

    // 策略1：匹配 AAENCODE_PAYLOAD 标记
    const payloadMatch = input.match(/AAENCODE_PAYLOAD:([A-Za-z0-9+/=]+)/);
    if (payloadMatch) {
        try {
            return Buffer.from(payloadMatch[1], 'base64').toString('utf-8');
        } catch {
            throw new Error('aaencode decode: invalid base64 payload in AAencode code');
        }
    }

    // 策略2：匹配 atob("...") 调用
    const atobMatch = input.match(/atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/);
    if (atobMatch) {
        try {
            return Buffer.from(atobMatch[1], 'base64').toString('utf-8');
        } catch {
            throw new Error('aaencode decode: invalid base64 in atob() call');
        }
    }

    // 策略3：如果输入包含颜文字特征（ﾟ、ω、Д 等），但无法提取 base64
    if (/[ﾟωДΘｰoε∇]/.test(input)) {
        throw new Error(
            'aaencode decode: detected AAencode-style code but could not extract payload. ' +
            'This is JavaScript obfuscation that typically requires eval() execution in a browser/Node.js environment.'
        );
    }

    // 策略4：直接尝试 base64 解码
    try {
        const cleaned = input.replace(/\s/g, '');
        if (/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
            return Buffer.from(cleaned, 'base64').toString('utf-8');
        }
    } catch {
        // 继续抛出错误
    }

    throw new Error(
        'aaencode decode: input is not valid AAencode code or base64. ' +
        'AAencode is JavaScript obfuscation; try eval() in a browser if this is original AAencode.'
    );
}

// -----------------------------------------------------------
// 四、JJencode（JS 混淆编码，使用 $ _ 等字符）— 简化实现
// -----------------------------------------------------------

/**
 * JJencode 编码（简化版）
 * 将输入转为 base64，包装成 JJencode 风格的 JS 代码模板。
 *
 * @param {string} input - 原始字符串
 * @returns {string} JJencode 风格的 JS 代码
 */
export function jjencode_encode(input) {
    if (input === undefined || input === null) {
        throw new Error('jjencode encode: input must be a string');
    }
    if (input.length === 0) return '';

    // 将输入转为 base64
    const base64 = Buffer.from(input, 'utf-8').toString('base64');

    // JJencode 经典模板：使用 $ _ 等字符构造
    const template = [
        '$=~[];',
        '$={___:++$,$$$$:(![]+"")[$],__$:++$,$_$_:(![]+"")[$],_$_:++$,$_$$:({}+"")[$],$$_$:($[$]+"")[$],_$$:++$,$$$_:(!""+"")[$]};',
        '$.$_=($.$_=$_+"")[$.$_$]+($._$=$.$_[$.__$])+($.$$=($.$+"")[$.__$])+((!$)+"")[$._$$]+($.__=$.$_[$.$$_])+($.$=(!""+"")[$.__$])+($._=(!""+"")[$._$_])+$.$_[$.$_$]+$.__+$._$+$.$;',
        '$.$$=$.$+(!""+"")[$._$$]+$.__+$._+$.$+$.$$;',
        '$($.$_($.$$+"\\""+',
        '// JJENCODE_PAYLOAD:' + base64,
        '"' + base64 + '"+"\\"")())();',
    ].join('\n');

    return template;
}

/**
 * JJencode 解码（简化版）
 * 从 JJencode 风格的 JS 代码中提取 base64 并解码。
 *
 * @param {string} input - JJencode 编码的 JS 代码
 * @returns {string} 解码后的原始字符串
 */
export function jjencode_decode(input) {
    if (input === undefined || input === null) {
        throw new Error('jjencode decode: input must be a string');
    }
    if (input.length === 0) return '';

    // 策略1：匹配 JJENCODE_PAYLOAD 标记
    const payloadMatch = input.match(/JJENCODE_PAYLOAD:([A-Za-z0-9+/=]+)/);
    if (payloadMatch) {
        try {
            return Buffer.from(payloadMatch[1], 'base64').toString('utf-8');
        } catch {
            throw new Error('jjencode decode: invalid base64 payload in JJencode code');
        }
    }

    // 策略2：匹配常见 JJencode 模式：引号包裹的 base64
    // JJencode 通常将 base64 嵌入在 $.$_() 调用的参数中
    const base64Matches = input.match(/["']([A-Za-z0-9+/=]{4,})["']/g);
    if (base64Matches) {
        for (const m of base64Matches) {
            const candidate = m.replace(/['"]/g, '');
            if (candidate.length >= 4 && /^[A-Za-z0-9+/=]+$/.test(candidate)) {
                try {
                    const decoded = Buffer.from(candidate, 'base64').toString('utf-8');
                    // 只返回可读的文本结果（过滤掉乱码）
                    if (/^[\x20-\x7e\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\n\r\t]*$/.test(decoded)) {
                        return decoded;
                    }
                } catch {
                    // 继续尝试下一个匹配
                }
            }
        }
    }

    // 策略3：如果输入包含 JJencode 特征（$ 密集使用），但无法提取
    if (/\$[=!~]/.test(input) && /\$\$/.test(input)) {
        throw new Error(
            'jjencode decode: detected JJencode-style code but could not extract payload. ' +
            'This is JavaScript obfuscation that typically requires eval() execution in a browser/Node.js environment.'
        );
    }

    // 策略4：直接尝试 base64 解码
    try {
        const cleaned = input.replace(/\s/g, '');
        if (/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
            return Buffer.from(cleaned, 'base64').toString('utf-8');
        }
    } catch {
        // 继续抛出错误
    }

    throw new Error(
        'jjencode decode: input is not valid JJencode code or base64. ' +
        'JJencode is JavaScript obfuscation; try eval() in a browser if this is original JJencode.'
    );
}

// -----------------------------------------------------------
// 统一导出
// -----------------------------------------------------------

export default {
    // UUencode
    uuencode_encode,
    uuencode_decode,
    // XXencode
    xxencode_encode,
    xxencode_decode,
    // AAencode
    aaencode_encode,
    aaencode_decode,
    // JJencode
    jjencode_encode,
    jjencode_decode,
};
