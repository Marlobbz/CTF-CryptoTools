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
  currentTool: null,      // 当前选中的工具映射 key（格式: "分类/工具key"）
  currentCategory: null,  // 当前展开的分类名
  selectedToolKey: null,  // 工具映射 key
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

      if (OBJECT_EXPORT_KEYS.has(resolvedKey)) {
        const obj = Core[resolvedKey];
        if (obj && typeof obj.encode === 'function' && typeof obj.decode === 'function') {
          encodeFn = obj.encode.bind(obj);
          decodeFn = obj.decode.bind(obj);
        }
      } else {
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
    toolCategory: document.getElementById('tool-category'),
    inputArea: document.getElementById('input-area'),
    outputArea: document.getElementById('output-area'),
    statusBar: document.getElementById('status-bar'),
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

    // 自动检测建议
    suggestions: document.getElementById('suggestions'),
    suggestionsList: document.getElementById('suggestions-list'),

    // 历史面板
    historyPanel: document.getElementById('history-panel'),
    historyList: document.getElementById('history-list'),
    btnClearHistory: document.getElementById('btn-clear-history'),

    // Toast
    toastContainer: document.getElementById('toast-container'),
  };
}

// ============================================================
// 工具函数
// ============================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 切换按钮加载状态（编码/解码/复制等耗时操作反馈）
 */
function setButtonLoading(btn, loading, loadingText = '处理中') {
  if (!btn) return;

  if (loading) {
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.innerHTML;
    }
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${loadingText}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
  }
}

// ============================================================
// Toast 提示
// ============================================================

function showToast(message, type = 'info') {
  if (!els.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');

  const dot = document.createElement('span');
  dot.className = 'toast-dot';
  dot.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(dot);
  toast.appendChild(text);
  els.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }, 3000);
}

// ============================================================
// 状态提示
// ============================================================

function setStatus(message, type = 'info') {
  if (!els.statusBar || !els.statusText) return;

  els.statusText.textContent = message;
  els.statusBar.classList.remove('success', 'error');
  if (type === 'success') {
    els.statusBar.classList.add('success');
  } else if (type === 'error') {
    els.statusBar.classList.add('error');
  }
}

// ============================================================
// 高级选项
// ============================================================

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
      <label for="opt-shift">偏移量 (Shift)</label>
      <input type="number" id="opt-shift" value="3" min="0" max="25">
    `;
  } else if (toolKey.includes('railFence')) {
    html = `
      <label for="opt-rails">栅栏行数 (Rails)</label>
      <input type="number" id="opt-rails" value="3" min="2" max="100">
    `;
  } else if (toolKey.includes('polybius')) {
    html = `
      <span class="advanced-hint">波利比奥斯方阵默认使用标准 A-Z 5×5 方阵，其中 I/J 共用一格。</span>
    `;
  } else if (toolKey.includes('shellcode')) {
    html = `
      <label for="opt-format">输出格式</label>
      <select id="opt-format">
        <option value="cstyle">\\xNN 格式</option>
        <option value="hex">纯十六进制</option>
      </select>
    `;
  } else if (toolKey.includes('a1z26')) {
    html = `
      <label for="opt-separator">分隔符</label>
      <select id="opt-separator">
        <option value="-">-（连字符）</option>
        <option value=" ">空格</option>
      </select>
    `;
  } else if (toolKey.includes('binary')) {
    html = `
      <label for="opt-bitlength">位长度</label>
      <select id="opt-bitlength">
        <option value="8">8位</option>
        <option value="7">7位</option>
      </select>
    `;
  } else if (toolKey.includes('bacon')) {
    html = `
      <label for="opt-bacon-variant">培根变体</label>
      <select id="opt-bacon-variant">
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
    const matchingTools = {};
    for (const [key, toolDef] of Object.entries(catData.tools)) {
      if (!filterLower || toolDef.name.toLowerCase().includes(filterLower) || key.toLowerCase().includes(filterLower)) {
        matchingTools[key] = toolDef;
      }
    }

    if (Object.keys(matchingTools).length === 0 && filterLower) {
      continue;
    }

    const isOpen = state.currentCategory === catName;
    const isActive = state.selectedToolKey && state.selectedToolKey.startsWith(catName + '/');

    html += `
      <div class="category-group">
        <button class="category-header${isOpen ? ' open' : ''}${isActive ? ' active' : ''}" data-category="${escapeHtml(catName)}" aria-expanded="${isOpen}">
          <span class="category-name">${escapeHtml(catName)}</span>
          <span class="category-arrow" aria-hidden="true">${isOpen ? '▾' : '▸'}</span>
        </button>
        <div class="category-tools"${isOpen ? '' : ' style="display:none;"'}>
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

// ============================================================
// 工具选择
// ============================================================

function selectTool(toolMapKey) {
  const tool = TOOL_MAP[toolMapKey];
  if (!tool) return;

  state.selectedToolKey = toolMapKey;
  state.currentTool = tool;
  state.currentCategory = tool.category;

  if (els.toolTitle) {
    els.toolTitle.textContent = tool.name;
  }
  if (els.toolCategory) {
    els.toolCategory.textContent = tool.category;
  }

  renderAdvancedOptions();
  renderCategories(els.searchInput ? els.searchInput.value : '');
  setStatus(`已选择：${tool.name}`, 'info');
}

// ============================================================
// 编解码操作
// ============================================================

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

  setButtonLoading(els.btnEncode, true, '编码中');

  // 让加载状态先渲染，再执行同步计算，保证大输入时也有反馈
  setTimeout(() => {
    try {
      const options = getOptions();
      const result = state.currentTool.encode(input, options);
      if (els.outputArea) {
        els.outputArea.value = result;
      }
      setStatus('编码成功', 'success');
      showToast('编码完成', 'success');

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
      setStatus(`编码错误：${errMsg}`, 'error');
      showToast(errMsg, 'error');
    } finally {
      setButtonLoading(els.btnEncode, false);
    }
  }, 0);
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

  setButtonLoading(els.btnDecode, true, '解码中');

  setTimeout(() => {
    try {
      const options = getOptions();
      const result = state.currentTool.decode(input, options);
      if (els.outputArea) {
        els.outputArea.value = result;
      }
      setStatus('解码成功', 'success');
      showToast('解码完成', 'success');

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
      setStatus(`解码错误：${errMsg}`, 'error');
      showToast(errMsg, 'error');
    } finally {
      setButtonLoading(els.btnDecode, false);
    }
  }, 0);
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
  hideSuggestions();
  setStatus('已清空', 'info');
}

async function performCopy() {
  if (!els.outputArea) return;
  const text = els.outputArea.value;
  if (!text) {
    showToast('输出区域为空，无内容可复制', 'info');
    return;
  }

  setButtonLoading(els.btnCopy, true, '复制中');

  try {
    await navigator.clipboard.writeText(text);
    setStatus('已复制到剪贴板', 'success');
    showToast('已复制', 'success');
  } catch {
    // 降级方案（Electron 或受限环境下 clipboard API 不可用时）
    els.outputArea.focus();
    els.outputArea.select();
    try {
      document.execCommand('copy');
      setStatus('已复制到剪贴板', 'success');
      showToast('已复制', 'success');
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  } finally {
    setButtonLoading(els.btnCopy, false);
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

  showToast('已开始下载', 'success');
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

function hideSuggestions() {
  if (els.suggestions) {
    els.suggestions.classList.remove('active');
  }
  if (els.suggestionsList) {
    els.suggestionsList.innerHTML = '';
  }
}

function performAutoDetect() {
  if (!els.inputArea) return;
  const input = els.inputArea.value.trim();
  if (!input) {
    showToast('请先输入内容以进行检测', 'info');
    return;
  }

  const suggestions = [];

  if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0 && input.length >= 4) {
    suggestions.push({ key: '进制编码/base16', name: 'Base16(Hex)', score: 90 });
  }
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(input) && input.length >= 4 && input.length % 4 === 0) {
    suggestions.push({ key: '进制编码/base64', name: 'Base64', score: 85 });
  }
  if (/^[A-Z2-7]+={0,6}$/.test(input) && input.length >= 4 && input.length % 8 === 0) {
    suggestions.push({ key: '进制编码/base32', name: 'Base32', score: 80 });
  }
  if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(input) && input.length >= 4) {
    suggestions.push({ key: '进制编码/base58', name: 'Base58', score: 70 });
  }
  if (/^[A-Za-z0-9!#$%&()*+\-;<=>?@^_`{|}~]+$/.test(input) && input.length >= 4) {
    suggestions.push({ key: '进制编码/base85', name: 'Base85', score: 65 });
  }
  if (/%[0-9a-fA-F]{2}/.test(input)) {
    suggestions.push({ key: '网络编码/url', name: 'URL编码', score: 95 });
  }
  if (/^(\\x[0-9a-fA-F]{2})+$/.test(input)) {
    suggestions.push({ key: '网络编码/shellcode', name: 'Shellcode编码', score: 95 });
  }
  if (/^[.\- /]+$/.test(input) && input.includes('.') && input.includes('-')) {
    suggestions.push({ key: '古典密码/morse', name: '莫斯密码', score: 90 });
  }
  if (/^[01\s]+$/.test(input) && input.replace(/\s/g, '').length >= 8) {
    const cleaned = input.replace(/\s/g, '');
    if (cleaned.length % 8 === 0 || cleaned.length % 7 === 0) {
      suggestions.push({ key: '其他密码/binary', name: '二进制编码', score: 90 });
    }
  }
  if (/^[\d\- ]+$/.test(input) && /\d/.test(input)) {
    const nums = input.split(/[\-\s]+/).filter(Boolean).map(Number);
    if (nums.length > 2 && nums.every(n => n >= 1 && n <= 26)) {
      suggestions.push({ key: '其他密码/a1z26', name: 'A1z26密码', score: 85 });
    }
  }
  if (/^[.\s/]+$/.test(input) && input.includes('.')) {
    suggestions.push({ key: '其他密码/tapCode', name: '敲击码', score: 80 });
  }
  if (/^[\[\]\(\)!\+]+$/.test(input)) {
    suggestions.push({ key: '脚本编码/jsfuck', name: 'JSFuck', score: 95 });
  }
  if (/^[\[\]\(\)\{\}!\+]+$/.test(input)) {
    suggestions.push({ key: '脚本编码/jother', name: 'Jother', score: 95 });
  }
  if (/^[><+\-.,\[\]]+$/.test(input)) {
    suggestions.push({ key: '脚本编码/brainfuck', name: 'Brainfuck', score: 90 });
  }

  suggestions.sort((a, b) => b.score - a.score);

  if (suggestions.length === 0) {
    hideSuggestions();
    showToast('未能自动检测出编码类型，请手动选择', 'info');
    setStatus('未能检测出编码类型', 'info');
    return;
  }

  const top = suggestions.slice(0, 5);
  renderSuggestions(top);
  const names = top.map(s => s.name).join('、');
  setStatus(`检测到可能的编码：${names}`, 'info');
}

function renderSuggestions(suggestions) {
  if (!els.suggestions || !els.suggestionsList) return;

  els.suggestionsList.innerHTML = '';
  for (const s of suggestions) {
    if (!TOOL_MAP[s.key]) continue;
    const btn = document.createElement('button');
    btn.className = 'suggestion-item';
    btn.type = 'button';
    btn.dataset.tool = s.key;
    btn.textContent = s.name;
    els.suggestionsList.appendChild(btn);
  }

  if (els.suggestionsList.children.length > 0) {
    els.suggestions.classList.add('active');
  } else {
    els.suggestions.classList.remove('active');
  }
}

// ============================================================
// 历史记录面板
// ============================================================

function renderHistory() {
  if (!els.historyList) return;

  const history = getHistory();
  if (history.length === 0) {
    els.historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
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
    });

    html += `
      <div class="history-item" data-id="${escapeHtml(item.id)}">
        <div class="history-item-meta">
          <span class="history-item-cipher">${escapeHtml(item.toolName)}</span>
          <span class="history-item-time">${timeStr}</span>
        </div>
        <div class="history-item-summary">
          <span class="history-item-direction">${escapeHtml(item.direction)}</span>
          ${escapeHtml(item.inputSummary || '')} → ${escapeHtml(item.outputSummary || '')}
        </div>
        <div class="history-item-footer">
          <button class="history-item-delete" data-id="${escapeHtml(item.id)}">删除</button>
        </div>
      </div>
    `;
  }

  els.historyList.innerHTML = html;
}

function toggleHistoryPanel(show) {
  if (!els.historyPanel) return;

  const overlay = document.getElementById('history-overlay');
  const isVisible = els.historyPanel.classList.contains('active');

  if (show === true || (!isVisible && show !== false)) {
    renderHistory();
    els.historyPanel.classList.add('active');
    if (overlay) overlay.classList.add('active');
  } else {
    els.historyPanel.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }
}

function onHistoryItemClick(e) {
  const deleteBtn = e.target.closest('.history-item-delete');
  if (deleteBtn) {
    e.stopPropagation();
    const id = deleteBtn.dataset.id;
    deleteHistoryItem(id);
    renderHistory();
    showToast('已删除记录', 'info');
    return;
  }

  const item = e.target.closest('.history-item');
  if (!item) return;

  const id = item.dataset.id;
  const history = getHistory();
  const entry = history.find(h => h.id === id);
  if (!entry) return;

  if (entry.toolKey && TOOL_MAP[entry.toolKey]) {
    selectTool(entry.toolKey);
  }
  if (els.inputArea && entry.input !== undefined) {
    els.inputArea.value = entry.input;
  }
  if (els.outputArea && entry.output !== undefined) {
    els.outputArea.value = entry.output;
  }

  toggleHistoryPanel(false);
  showToast('已恢复历史记录', 'info');
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
  // 侧边栏 - 分类展开/折叠 + 工具选择
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
        selectTool(toolItem.dataset.tool);
      }
    });
  }

  // 搜索
  if (els.searchInput) {
    els.searchInput.addEventListener('input', onSearchInput);
  }

  // 编解码按钮
  if (els.btnEncode) els.btnEncode.addEventListener('click', performEncode);
  if (els.btnDecode) els.btnDecode.addEventListener('click', performDecode);
  if (els.btnSwap) els.btnSwap.addEventListener('click', performSwap);
  if (els.btnClear) els.btnClear.addEventListener('click', performClear);
  if (els.btnCopy) els.btnCopy.addEventListener('click', performCopy);
  if (els.btnDownload) els.btnDownload.addEventListener('click', performDownload);
  if (els.btnAutoDetect) els.btnAutoDetect.addEventListener('click', performAutoDetect);

  // 自动检测建议点击
  if (els.suggestionsList) {
    els.suggestionsList.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (item && item.dataset.tool) {
        selectTool(item.dataset.tool);
        hideSuggestions();
      }
    });
  }

  // 历史记录
  if (els.btnHistory) {
    els.btnHistory.addEventListener('click', () => toggleHistoryPanel());
  }
  if (els.historyList) {
    els.historyList.addEventListener('click', onHistoryItemClick);
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
      const isOpen = els.sidebar.classList.toggle('open');
      hamburgerBtn.classList.toggle('active', isOpen);
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active', isOpen);
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      if (els.sidebar) els.sidebar.classList.remove('open');
      if (hamburgerBtn) {
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
      sidebarOverlay.classList.remove('active');
    });
  }

  // 全局：Ctrl+Enter 编码，Ctrl+Shift+Enter 解码
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
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
      state.currentCategory = firstCatName;
      selectTool(`${firstCatName}/${firstToolKey}`);
    }
  }

  renderCategories();
}

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
