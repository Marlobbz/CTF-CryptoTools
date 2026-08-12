// ============================================================
// CTF密码编解码工具箱 - 前端主逻辑
// ESM 格式
// ============================================================

import * as Core from '../core/index.js';
import { getHistory, addHistory, clearHistory, deleteHistoryItem } from './history.js';

// ============================================================
// 状态管理
// ============================================================

const state = {
  currentTool: null,      // 当前选中的工具映射key（格式: "分类/工具key"）
  currentCategory: null,   // 当前展开的分类名
  selectedToolKey: null,   // 工具映射key
};

// ============================================================
// 构建工具映射表
// ============================================================

/**
 * 哪些 key 对应的是 Core 中导出的 { encode, decode } 对象（而非直接函数）
 */
const OBJECT_EXPORT_KEYS = new Set([
  'morse', 'bacon', 'yunying', 'atbash', 'polybius', 'caesar', 'railFence',
  'brainfuck', 'jsfuck', 'jother',
  'emoji', 'buddha',
]);

/**
 * core_values 在 Core 中导出名为 coreSocialistValues
 */
const KEY_NAME_MAP = {
  'core_values': 'coreSocialistValues',
};

function resolveCoreExport(key) {
  // 先查 KeyNameMap
  if (KEY_NAME_MAP[key]) {
    return KEY_NAME_MAP[key];
  }
  return key;
}

function buildToolMap() {
  const map = {};

  for (const [catName, catData] of Object.entries(Core.CATEGORIES)) {
    for (const [key, toolDef] of Object.entries(catData.tools)) {
      const encodeName = toolDef.encode;
      const decodeName = toolDef.decode;

      let encodeFn, decodeFn;

      const resolvedKey = resolveCoreExport(key);

      // 判断是否是对象形式导出（{ encode, decode }）
      if (OBJECT_EXPORT_KEYS.has(resolvedKey)) {
        // 对象导出：Core.morse.encode / Core.morse.decode 等
        const obj = Core[resolvedKey];
        if (obj && typeof obj.encode === 'function' && typeof obj.decode === 'function') {
          encodeFn = obj.encode.bind(obj);
          decodeFn = obj.decode.bind(obj);
        }
      } else {
        // 直接函数导出
        if (typeof Core[encodeName] === 'function') {
          encodeFn = Core[encodeName];
        }
        if (typeof Core[decodeName] === 'function') {
          decodeFn = Core[decodeName];
        }
      }

      if (encodeFn && decodeFn) {
        map[`${catName}/${key}`] = {
          category: catName,
          key,
          name: toolDef.name,
          encode: encodeFn,
          decode: decodeFn,
        };
      }
    }
  }

  return map;
}

const TOOL_MAP = buildToolMap();

// ============================================================
// DOM 元素引用（在 DOMContentLoaded 后初始化）
// ============================================================

let els = {};

function cacheDOMElements() {
  els = {
    // 侧边栏
    sidebar: document.getElementById('sidebar'),
    searchInput: document.getElementById('search-input'),
    categoryList: document.getElementById('category-list'),

    // 主区域
    toolTitle: document.getElementById('tool-title'),
    inputArea: document.getElementById('input-area'),
    outputArea: document.getElementById('output-area'),
    statusText: document.getElementById('status-text'),

    // 操作按钮
    btnEncode: document.getElementById('btn-encode'),
    btnDecode: document.getElementById('btn-decode'),
    btnSwap: document.getElementById('btn-swap'),
    btnClear: document.getElementById('btn-clear'),
    btnCopy: document.getElementById('btn-copy'),
    btnDownload: document.getElementById('btn-download'),
    btnAutoDetect: document.getElementById('btn-auto-detect'),
    btnHistory: document.getElementById('btn-history'),

    // 高级选项面板
    advancedPanel: document.getElementById('advanced-panel'),
    advancedContent: document.getElementById('advanced-content'),

    // 历史面板
    historyPanel: document.getElementById('history-panel'),
    historyList: document.getElementById('history-list'),
    btnClearHistory: document.getElementById('btn-clear-history'),

    // Toast
    toastContainer: document.getElementById('toast-container'),
  };
}

// ============================================================
// Toast 提示
// ============================================================

/**
 * 显示 Toast 通知
 * @param {string} message - 提示消息
 * @param {'success'|'error'|'info'} type - 类型
 */
function showToast(message, type = 'info') {
  if (!els.toastContainer) return;

  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#3b82f6',
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    background: ${colors[type] || colors.info};
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: toastSlideIn 0.3s ease;
    pointer-events: auto;
  `;

  els.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// ============================================================
// 高级选项
// ============================================================

/**
 * 根据当前选中的工具，渲染高级选项面板
 */
function renderAdvancedOptions() {
  if (!els.advancedPanel || !els.advancedContent) return;

  const toolKey = state.selectedToolKey;
  if (!toolKey) {
    els.advancedPanel.style.display = 'none';
    return;
  }

  let html = '';

  if (toolKey.includes('caesar')) {
    html = `
      <label>偏移量 (Shift):</label>
      <input type="number" id="opt-shift" value="3" min="0" max="25" style="width:80px;padding:4px 8px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#e0e0e0;" />
    `;
  } else if (toolKey.includes('railFence')) {
    html = `
      <label>栅栏行数 (Rails):</label>
      <input type="number" id="opt-rails" value="3" min="2" max="100" style="width:80px;padding:4px 8px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#e0e0e0;" />
    `;
  } else if (toolKey.includes('polybius')) {
    html = `
      <label>波利比奥斯方阵（使用默认5×5方阵，IJ共用）</label>
      <p style="color:#888;font-size:12px;margin:4px 0 0;">默认使用标准 A-Z 5×5 方阵，其中 I/J 共用一格。</p>
    `;
  } else if (toolKey.includes('shellcode')) {
    html = `
      <label>输出格式:</label>
      <select id="opt-format" style="padding:4px 8px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#e0e0e0;">
        <option value="cstyle">\\xNN 格式</option>
        <option value="hex">纯十六进制</option>
      </select>
    `;
  } else if (toolKey.includes('a1z26')) {
    html = `
      <label>分隔符:</label>
      <select id="opt-separator" style="padding:4px 8px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#e0e0e0;">
        <option value="-">-（连字符）</option>
        <option value=" ">空格</option>
      </select>
    `;
  } else if (toolKey.includes('binary')) {
    html = `
      <label>位长度:</label>
      <select id="opt-bitlength" style="padding:4px 8px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#e0e0e0;">
        <option value="8">8位</option>
        <option value="7">7位</option>
      </select>
    `;
  } else if (toolKey.includes('bacon')) {
    html = `
      <label>培根变体:</label>
      <select id="opt-bacon-variant" style="padding:4px 8px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#e0e0e0;">
        <option value="standard">标准 (Standard)</option>
        <option value="ijuv">IJ/UV 合并</option>
      </select>
    `;
  }

  if (html) {
    els.advancedContent.innerHTML = html;
    els.advancedPanel.style.display = 'block';
  } else {
    els.advancedPanel.style.display = 'none';
  }
}

/**
 * 获取当前工具的高级选项参数
 */
function getOptions() {
  const toolKey = state.selectedToolKey;
  if (!toolKey) return {};

  if (toolKey.includes('caesar')) {
    const el = document.getElementById('opt-shift');
    if (el) return { shift: parseInt(el.value, 10) || 3 };
  }
  if (toolKey.includes('railFence')) {
    const el = document.getElementById('opt-rails');
    if (el) return { rails: parseInt(el.value, 10) || 3 };
  }
  if (toolKey.includes('shellcode')) {
    const el = document.getElementById('opt-format');
    if (el) return { format: el.value || 'cstyle' };
  }
  if (toolKey.includes('a1z26')) {
    const el = document.getElementById('opt-separator');
    if (el) return { separator: el.value || '-' };
  }
  if (toolKey.includes('binary')) {
    const el = document.getElementById('opt-bitlength');
    if (el) return { bitLength: parseInt(el.value, 10) || 8 };
  }
  if (toolKey.includes('bacon')) {
    const el = document.getElementById('opt-bacon-variant');
    if (el) return { variant: el.value || 'standard' };
  }

  return {};
}

// ============================================================
// 侧边栏渲染
// ============================================================

function renderCategories(filter = '') {
  if (!els.categoryList) return;

  const filterLower = filter.toLowerCase();
  let html = '';

  for (const [catName, catData] of Object.entries(Core.CATEGORIES)) {
    // 检查该分类下是否有匹配的工具
    const matchingTools = {};
    for (const [key, toolDef] of Object.entries(catData.tools)) {
      if (!filterLower || toolDef.name.toLowerCase().includes(filterLower) || key.toLowerCase().includes(filterLower)) {
        matchingTools[key] = toolDef;
      }
    }

    if (Object.keys(matchingTools).length === 0 && filterLower) {
      continue; // 过滤模式下隐藏无匹配分类
    }

    const isOpen = state.currentCategory === catName;
    const isActive = state.selectedToolKey && state.selectedToolKey.startsWith(catName + '/');

    html += `
      <div class="category-group">
        <div class="category-header${isOpen ? ' open' : ''}${isActive ? ' active' : ''}" data-category="${escapeHtml(catName)}">
          <span class="category-icon">${catData.icon || '🔧'}</span>
          <span class="category-name">${escapeHtml(catName)}</span>
          <span class="category-arrow">${isOpen ? '▼' : '▶'}</span>
        </div>
        <div class="category-tools" style="display:${isOpen ? 'block' : 'none'};">
    `;

    for (const [key, toolDef] of Object.entries(matchingTools)) {
      const toolMapKey = `${catName}/${key}`;
      const selected = state.selectedToolKey === toolMapKey;
      html += `
        <button class="tool-item${selected ? ' selected' : ''}" data-tool="${escapeHtml(toolMapKey)}">
          ${escapeHtml(toolDef.name)}
        </button>
      `;
    }

    html += '</div></div>';
  }

  els.categoryList.innerHTML = html;
}

/**
 * 简单的 HTML 转义
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// 工具选择
// ============================================================

function selectTool(toolMapKey) {
  const tool = TOOL_MAP[toolMapKey];
  if (!tool) return;

  state.selectedToolKey = toolMapKey;
  state.currentTool = tool;
  state.currentCategory = tool.category;

  // 更新标题
  if (els.toolTitle) {
    els.toolTitle.textContent = tool.name;
  }

  // 更新高级选项面板
  renderAdvancedOptions();

  // 重新渲染侧边栏（更新选中状态）
  renderCategories(els.searchInput ? els.searchInput.value : '');

  // 更新状态提示
  setStatus(`已选择: ${tool.name}`, 'info');
}

// ============================================================
// 编解码操作
// ============================================================

function setStatus(message, type = 'info') {
  if (!els.statusText) return;
  els.statusText.textContent = message;
  els.statusText.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#888';
}

function performEncode() {
  if (!state.currentTool) {
    showToast('请先选择一个密码工具', 'error');
    return;
  }

  const input = els.inputArea ? els.inputArea.value : '';
  if (!input) {
    showToast('请输入待编码内容', 'info');
    return;
  }

  try {
    const options = getOptions();
    const result = state.currentTool.encode(input, options);
    if (els.outputArea) {
      els.outputArea.value = result;
    }
    setStatus('编码成功', 'success');
    showToast('编码完成', 'success');

    // 添加到历史记录
    addHistory({
      toolName: state.currentTool.name,
      toolKey: state.selectedToolKey,
      direction: '编码',
      inputSummary: input.length > 50 ? input.slice(0, 50) + '...' : input,
      outputSummary: result.length > 50 ? result.slice(0, 50) + '...' : result,
      input: input,
      output: result,
    });
  } catch (e) {
    const errMsg = e.message || '编码失败';
    setStatus(`编码错误: ${errMsg}`, 'error');
    showToast(errMsg, 'error');
  }
}

function performDecode() {
  if (!state.currentTool) {
    showToast('请先选择一个密码工具', 'error');
    return;
  }

  const input = els.inputArea ? els.inputArea.value : '';
  if (!input) {
    showToast('请输入待解码内容', 'info');
    return;
  }

  try {
    const options = getOptions();
    const result = state.currentTool.decode(input, options);
    if (els.outputArea) {
      els.outputArea.value = result;
    }
    setStatus('解码成功', 'success');
    showToast('解码完成', 'success');

    // 添加到历史记录
    addHistory({
      toolName: state.currentTool.name,
      toolKey: state.selectedToolKey,
      direction: '解码',
      inputSummary: input.length > 50 ? input.slice(0, 50) + '...' : input,
      outputSummary: result.length > 50 ? result.slice(0, 50) + '...' : result,
      input: input,
      output: result,
    });
  } catch (e) {
    const errMsg = e.message || '解码失败';
    setStatus(`解码错误: ${errMsg}`, 'error');
    showToast(errMsg, 'error');
  }
}

function performSwap() {
  if (!els.inputArea || !els.outputArea) return;
  const temp = els.inputArea.value;
  els.inputArea.value = els.outputArea.value;
  els.outputArea.value = temp;
  setStatus('已交换输入/输出内容', 'info');
}

function performClear() {
  if (els.inputArea) els.inputArea.value = '';
  if (els.outputArea) els.outputArea.value = '';
  setStatus('已清空', 'info');
}

async function performCopy() {
  if (!els.outputArea) return;
  const text = els.outputArea.value;
  if (!text) {
    showToast('输出区域为空，无内容可复制', 'info');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制！', 'success');
    setStatus('已复制到剪贴板', 'success');
  } catch {
    // 降级方案
    els.outputArea.select();
    els.outputArea.setSelectionRange(0, 99999);
    try {
      document.execCommand('copy');
      showToast('已复制！', 'success');
      setStatus('已复制到剪贴板', 'success');
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  }
}

function performDownload() {
  if (!els.outputArea) return;
  const text = els.outputArea.value;
  if (!text) {
    showToast('输出区域为空，无内容可下载', 'info');
    return;
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cryptotools_output_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('文件下载中...', 'success');
}

// ============================================================
// 搜索过滤
// ============================================================

function onSearchInput(e) {
  const query = e.target ? e.target.value : '';
  renderCategories(query);
}

// ============================================================
// 自动检测编码类型
// ============================================================

function performAutoDetect() {
  if (!els.inputArea) return;
  const input = els.inputArea.value.trim();
  if (!input) {
    showToast('请先输入内容以进行检测', 'info');
    return;
  }

  const suggestions = [];

  // Base16 (hex): 纯十六进制字符，偶数长度
  if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0 && input.length >= 4) {
    suggestions.push({ key: '进制编码/base16', name: 'Base16(Hex)', score: 90 });
  }

  // Base64: base64 字符集 + 可能的 = 填充
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(input) && input.length >= 4 && input.length % 4 === 0) {
    suggestions.push({ key: '进制编码/base64', name: 'Base64', score: 85 });
  }

  // Base32: 仅 A-Z2-7 和 =
  if (/^[A-Z2-7]+={0,6}$/.test(input) && input.length >= 4 && input.length % 8 === 0) {
    suggestions.push({ key: '进制编码/base32', name: 'Base32', score: 80 });
  }

  // Base58: 无 0OIl
  if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(input) && input.length >= 4) {
    suggestions.push({ key: '进制编码/base58', name: 'Base58', score: 70 });
  }

  // Base85: 包含特殊字符
  if (/^[A-Za-z0-9!#$%&()*+\-;<=>?@^_`{|}~]+$/.test(input) && input.length >= 4) {
    suggestions.push({ key: '进制编码/base85', name: 'Base85', score: 65 });
  }

  // URL编码: 包含 %XX
  if (/%[0-9a-fA-F]{2}/.test(input)) {
    suggestions.push({ key: '网络编码/url', name: 'URL编码', score: 95 });
  }

  // Shellcode: \xNN 格式
  if (/^(\\x[0-9a-fA-F]{2})+$/.test(input)) {
    suggestions.push({ key: '网络编码/shellcode', name: 'Shellcode编码', score: 95 });
  }

  // 莫尔斯电码: 包含 . 和 -
  if (/^[.\- /]+$/.test(input) && input.includes('.') && input.includes('-')) {
    suggestions.push({ key: '古典密码/morse', name: '莫斯密码', score: 90 });
  }

  // 二进制: 只含 01 和空格
  if (/^[01\s]+$/.test(input) && input.replace(/\s/g, '').length >= 8) {
    const cleaned = input.replace(/\s/g, '');
    if (cleaned.length % 8 === 0 || cleaned.length % 7 === 0) {
      suggestions.push({ key: '其他密码/binary', name: '二进制编码', score: 90 });
    }
  }

  // A1z26: 数字序列
  if (/^[\d\- ]+$/.test(input) && /\d/.test(input)) {
    const nums = input.split(/[\-\s]+/).filter(Boolean).map(Number);
    if (nums.length > 2 && nums.every(n => n >= 1 && n <= 26)) {
      suggestions.push({ key: '其他密码/a1z26', name: 'A1z26密码', score: 85 });
    }
  }

  // 敲击码: 纯点号
  if (/^[.\s/]+$/.test(input) && input.includes('.')) {
    suggestions.push({ key: '其他密码/tapCode', name: '敲击码', score: 80 });
  }

  // JSFuck: 仅含 []()!+
  if (/^[\[\]\(\)!\+]+$/.test(input)) {
    suggestions.push({ key: '脚本编码/jsfuck', name: 'JSFuck', score: 95 });
  }

  // Jother: 仅含 [](){}!+
  if (/^[\[\]\(\)\{\}!\+]+$/.test(input)) {
    suggestions.push({ key: '脚本编码/jother', name: 'Jother', score: 95 });
  }

  // Brainfuck: 含有 Brainfuck 关键字符
  if (/^[><+\-.,\[\]]+$/.test(input)) {
    suggestions.push({ key: '脚本编码/brainfuck', name: 'Brainfuck', score: 90 });
  }

  // 排序
  suggestions.sort((a, b) => b.score - a.score);

  if (suggestions.length === 0) {
    showToast('未能自动检测出编码类型，请手动选择', 'info');
    setStatus('未能检测出编码类型', 'info');
    return;
  }

  // 显示建议
  const top = suggestions.slice(0, 5);
  const names = top.map(s => s.name).join('、');
  setStatus(`检测建议: ${names}`, 'info');
  showToast(`可能的编码类型: ${names}`, 'info');
}

// ============================================================
// 历史记录面板
// ============================================================

function renderHistory() {
  if (!els.historyList) return;

  const history = getHistory();
  if (history.length === 0) {
    els.historyList.innerHTML = '<div style="padding:16px;color:#666;text-align:center;">暂无历史记录</div>';
    return;
  }

  let html = '';
  for (const item of history) {
    const time = new Date(item.timestamp);
    const timeStr = time.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    html += `
      <div class="history-item" data-id="${escapeHtml(item.id)}" style="
        padding:10px 12px;
        border-bottom:1px solid #2a2a3e;
        cursor:pointer;
        transition:background 0.15s;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:12px;color:#7c8db5;font-weight:600;">${escapeHtml(item.toolName)}</span>
          <span style="font-size:11px;color:#555;">${timeStr}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:${
            item.direction === '编码' ? '#22c55e' : '#3b82f6'
          };">${escapeHtml(item.direction)}</span>
          <span style="font-size:11px;color:#888;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.inputSummary || '')}</span>
        </div>
      </div>
    `;
  }

  els.historyList.innerHTML = html;
}

function toggleHistoryPanel(show) {
  if (!els.historyPanel) return;

  const overlay = document.getElementById('history-overlay');
  const isVisible = els.historyPanel.style.display === 'block';

  if (show === true || (!isVisible && show !== false)) {
    renderHistory();
    els.historyPanel.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
  } else {
    els.historyPanel.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  }
}

function onHistoryItemClick(e) {
  const item = e.target.closest('.history-item');
  if (!item) return;

  const id = item.dataset.id;
  const history = getHistory();
  const entry = history.find(h => h.id === id);
  if (!entry) return;

  // 恢复内容和选中的工具
  if (entry.toolKey && TOOL_MAP[entry.toolKey]) {
    selectTool(entry.toolKey);
  }
  if (els.inputArea && entry.input !== undefined) {
    els.inputArea.value = entry.input;
  }
  if (els.outputArea && entry.output !== undefined) {
    els.outputArea.value = entry.output;
  }

  showToast('已恢复历史记录', 'info');
}

function onHistoryItemDelete(e) {
  const deleteBtn = e.target.closest('.history-delete-btn');
  if (!deleteBtn) return;

  e.stopPropagation();

  const item = deleteBtn.closest('.history-item');
  if (!item) return;

  const id = item.dataset.id;
  deleteHistoryItem(id);
  renderHistory();
  showToast('已删除记录', 'info');
}

function onClearHistory() {
  clearHistory();
  renderHistory();
  showToast('历史记录已清空', 'info');
}

// ============================================================
// 事件绑定
// ============================================================

function bindEvents() {
  // 侧边栏 - 分类展开/折叠
  if (els.categoryList) {
    els.categoryList.addEventListener('click', (e) => {
      const header = e.target.closest('.category-header');
      if (header) {
        const catName = header.dataset.category;
        state.currentCategory = state.currentCategory === catName ? null : catName;
        renderCategories(els.searchInput ? els.searchInput.value : '');
        return;
      }

      const toolItem = e.target.closest('.tool-item');
      if (toolItem) {
        const toolMapKey = toolItem.dataset.tool;
        selectTool(toolMapKey);
      }
    });
  }

  // 搜索
  if (els.searchInput) {
    els.searchInput.addEventListener('input', onSearchInput);
  }

  // 编解码按钮
  if (els.btnEncode) {
    els.btnEncode.addEventListener('click', performEncode);
  }
  if (els.btnDecode) {
    els.btnDecode.addEventListener('click', performDecode);
  }

  // 操作按钮
  if (els.btnSwap) {
    els.btnSwap.addEventListener('click', performSwap);
  }
  if (els.btnClear) {
    els.btnClear.addEventListener('click', performClear);
  }
  if (els.btnCopy) {
    els.btnCopy.addEventListener('click', performCopy);
  }
  if (els.btnDownload) {
    els.btnDownload.addEventListener('click', performDownload);
  }
  if (els.btnAutoDetect) {
    els.btnAutoDetect.addEventListener('click', performAutoDetect);
  }

  // 历史记录
  if (els.btnHistory) {
    els.btnHistory.addEventListener('click', toggleHistoryPanel);
  }
  if (els.historyList) {
    els.historyList.addEventListener('click', (e) => {
      onHistoryItemClick(e);
    });
  }
  if (els.btnClearHistory) {
    els.btnClearHistory.addEventListener('click', onClearHistory);
  }

  // 历史记录关闭按钮和遮罩
  const historyCloseBtn = document.getElementById('history-close-btn');
  const historyDoneBtn = document.getElementById('history-done-btn');
  const historyOverlay = document.getElementById('history-overlay');
  if (historyCloseBtn) historyCloseBtn.addEventListener('click', () => toggleHistoryPanel(false));
  if (historyDoneBtn) historyDoneBtn.addEventListener('click', () => toggleHistoryPanel(false));
  if (historyOverlay) historyOverlay.addEventListener('click', () => toggleHistoryPanel(false));

  // 移动端侧边栏
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (hamburgerBtn && els.sidebar) {
    hamburgerBtn.addEventListener('click', () => {
      els.sidebar.classList.toggle('open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      if (els.sidebar) els.sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // 全局：Ctrl+Enter 编码，Ctrl+Shift+Enter 解码
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        performDecode();
      } else {
        performEncode();
      }
    }
  });
}

// ============================================================
// 初始化
// ============================================================

function init() {
  cacheDOMElements();
  bindEvents();

  // 默认选中第一个分类的第一个工具
  const categories = Object.entries(Core.CATEGORIES);
  if (categories.length > 0) {
    const [firstCatName, firstCatData] = categories[0];
    const firstToolKey = Object.keys(firstCatData.tools)[0];
    if (firstToolKey) {
      const toolMapKey = `${firstCatName}/${firstToolKey}`;
      state.currentCategory = firstCatName;
      selectTool(toolMapKey);
    }
  }

  // 渲染分类
  renderCategories();

  // 预渲染历史（面板默认隐藏）
  renderHistory();
  if (els.historyPanel) {
    els.historyPanel.style.display = 'none';
  }
}

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
