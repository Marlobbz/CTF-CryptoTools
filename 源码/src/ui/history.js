// 编解码历史记录管理模块

const STORAGE_KEY = 'cryptotools_history';
const MAX_HISTORY = 200;

/**
 * 获取所有历史记录
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 添加一条历史记录
 */
export function addHistory(entry) {
  const history = getHistory();
  history.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 删除单条历史记录
 */
export function deleteHistoryItem(id) {
  const history = getHistory().filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

/**
 * 按类型筛选历史记录
 */
export function filterHistory(toolType) {
  if (!toolType) return getHistory();
  return getHistory().filter(item => item.toolType === toolType);
}
