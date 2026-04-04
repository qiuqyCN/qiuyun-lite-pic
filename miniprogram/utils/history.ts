// utils/history.ts
// 历史记录管理工具

import { HistoryItem } from '../types/index';
import { STORAGE_KEYS } from '../constants/storage-keys';

const MAX_HISTORY_COUNT = 20;

/**
 * 保存处理记录到历史
 * @param item 历史记录项（不包含 id、createTime、timeStr）
 */
export function saveToHistory(
  item: Omit<HistoryItem, 'id' | 'timestamp'>
): void {
  const history = getHistory();

  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };

  // 添加到开头，限制数量
  history.unshift(newItem);
  wx.setStorageSync(STORAGE_KEYS.HISTORIES, history.slice(0, MAX_HISTORY_COUNT));
}

/**
 * 获取所有历史记录
 * @returns 历史记录列表
 */
export function getHistory(): HistoryItem[] {
  return wx.getStorageSync(STORAGE_KEYS.HISTORIES) || [];
}

/**
 * 清空所有历史记录
 */
export function clearHistory(): void {
  wx.removeStorageSync(STORAGE_KEYS.HISTORIES);
}

/**
 * 删除单条历史记录
 * @param id 记录ID
 */
export function removeHistoryItem(id: string): void {
  const history = getHistory();
  const newHistory = history.filter((item) => item.id !== id);
  wx.setStorageSync(STORAGE_KEYS.HISTORIES, newHistory);
}

/**
 * 根据类型获取历史记录
 * @param type 处理类型
 * @returns 该类型的历史记录列表
 */
export function getHistoryByType(type: string): HistoryItem[] {
  const history = getHistory();
  return history.filter((item) => item.type === type);
}

/**
 * 获取历史记录数量
 * @returns 历史记录总数
 */
export function getHistoryCount(): number {
  return getHistory().length;
}
