# CTF密码编解码工具箱

专为 CTF 竞赛选手打造的多功能密码学工具箱，支持 **37 种**常见密码与编码格式的**双向编解码**，提供 macOS 和 Windows 桌面应用，双击即可运行。

## 功能特性

| 分类 | 支持的工具 |
|------|-----------|
| 进制编码 | Base16、Base32、Base36、Base58、Base62、Base64、Base85、Base91、Base92 |
| ROT密码 | ROT5、ROT13、ROT18、ROT47 |
| 古典密码 | 莫斯密码、培根密码、云影密码、埃特巴什码、波利比奥斯方阵、凯撒密码、栅栏密码 |
| 传输编码 | UUencode、XXencode、AAencode、JJencode |
| 脚本编码 | Brainfuck、JSFuck、Jother |
| 特殊编码 | Emoji编码、核心价值观编码、与佛论禅编码 |
| 网络编码 | URL编码、Shellcode编码、Handycode编码、Quoted-Printable |
| 其他密码 | 敲击码、A1z26密码、二进制编码 |

**核心能力：**

- 所有工具均支持**编码/解码双向操作**
- 自动检测输入内容的编码类型（启发式匹配，检测结果可点击直达）
- 高级选项面板（凯撒偏移量、栅栏行数、分隔符等）
- 历史记录（自动保存、点击恢复、单条删除、清空）
- 一键复制、结果导出为 `.txt` 文件
- 键盘快捷键：`Ctrl+Enter` 编码、`Ctrl+Shift+Enter` 解码

---

## 一、快速开始（桌面应用，推荐）

### macOS（Apple Silicon / arm64）

1. 打开 `release/` 目录
2. 双击 `mac-arm64/CTF密码编解码工具箱.app`

> **首次运行提示**：由于应用未经过 Apple 官方签名，首次打开会提示「无法打开」。
> 解决方法（任选其一）：
> - **右键点击** `.app` → 选择「打开」→ 在弹出的对话框中点击「打开」
> - 或在终端执行：`xattr -cr "release/mac-arm64/CTF密码编解码工具箱.app"`

### Windows（x64）

1. 打开 `release/win-unpacked/` 目录
2. 双击 `CTF密码编解码工具箱.exe`

---

## 二、从源码运行（开发者）

### 环境要求

- Node.js ≥ 18（推荐 20+）
- npm ≥ 9

### 安装依赖

```bash
npm install
```

> 国内网络建议使用镜像加速：
> ```bash
> export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
> export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
> npm install
> ```

### 启动桌面应用

```bash
npm start
```

### 启动 Web 版本（浏览器）

```bash
npm run serve
# 浏览器访问 http://localhost:3000
```

---

## 三、运行测试

```bash
npm test
```

测试覆盖：正常场景、边界场景（空输入/特殊字符/中文）、错误场景、编解码往返一致性、性能（≤100ms）和 CTF 多层嵌套端到端场景。共 **9 个套件、570 个用例**。

---

## 四、打包桌面应用

### 打包 macOS（在 macOS 上执行）

```bash
npm run build:mac
```

产物输出到 `release/`：
- `mac-arm64/CTF密码编解码工具箱.app`（可直接运行）
- `CTF密码编解码工具箱-1.0.1-arm64-mac.zip`（传输用）

### 打包 Windows（推荐在 Windows 机器上执行）

```bash
npm run build:win
```

产物输出到 `release/`：
- `CTF密码编解码工具箱 1.0.1.exe`（便携单文件版）
- `win-unpacked/`（免安装完整目录）

> **说明**：在 macOS 上交叉打包 Windows 的便携单文件 `.exe` 需要 wine 环境。如需单文件 `.exe`，请在 Windows 机器上执行上述命令。

---

## 五、项目结构

```
CryptoTools/
├── index.html                 # 主界面
├── server.js                  # Web 开发服务器
├── package.json               # 项目配置 + 打包配置
├── electron/
│   └── main.js                # Electron 主进程
├── src/
│   ├── core/                  # 核心编解码模块
│   │   ├── index.js           #   统一导出 + 分类映射
│   │   ├── base-encodings.js  #   进制编码
│   │   ├── rot-ciphers.js     #   ROT密码
│   │   ├── classic-ciphers.js #   古典密码
│   │   ├── transmission-encodings.js # 传输编码
│   │   ├── esoteric.js        #   脚本编码
│   │   ├── special-encodings.js # 特殊编码
│   │   ├── network-encodings.js # 网络编码
│   │   └── other-ciphers.js   #   其他密码
│   └── ui/                    # 前端界面
│       ├── app.js             #   交互逻辑
│       ├── styles.css         #   样式
│       └── history.js         #   历史记录
├── tests/                     # 单元测试（9 个套件）
└── release/                   # 打包产物（.app / .exe / .zip）
```

---

## 六、模块化开发说明

每个编码/密码类型都被封装为独立模块，统一输入输出接口：

```javascript
// 直接函数导出（如 Base64、URL 编码等）
encodeBase64(input) => string
decodeBase64(input) => string

// 对象导出（如莫斯密码、Brainfuck 等）
morse.encode(input, options?) => string
morse.decode(input, options?) => string
```

所有模块均为 **纯 JavaScript（ESM）**，无环境依赖，同时兼容浏览器与 Node.js。解码失败时抛出带明确信息的 `Error`，前端统一捕获并友好提示。

---

## 七、界面设计说明

v1.0.1 起，界面与交互系统遵循 [kill-ai-slop](https://killaislop.com) 设计标准进行重构：

- **单一强调色**：移除原先的多色按钮与彩色光晕，全站收敛为一个品牌强调色。
- **中性深色基底**：扁平背景、克制阴影，替代此前的蓝紫偏色与渐变质感。
- **层级来自字号与留白**：以清晰的字体层级和间距划分信息结构，而非依赖颜色与描边。
- **统一小圆角**：全站圆角收敛为一致的小半径，去除胶囊、大圆角等装饰。
- **无装饰性 emoji**：按钮、分类与标题改为纯文本或功能性符号。
- **一致的反馈机制**：统一的状态栏、Toast 通知与加载状态，错误提示先以文字表达，再以少量语义色辅助。

详细改动见 [CHANGELOG.md](./CHANGELOG.md)。

## 八、版本历史

| 版本 | 说明 |
|------|------|
| v1.0.1 | UI 与交互系统全面优化（遵循 kill-ai-slop 标准） |
| v1.0.0 | 首个版本，37 种密码编解码 + Electron 桌面应用 |
