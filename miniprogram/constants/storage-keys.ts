// constants/storage-keys.ts
// 本地存储 key 常量定义

/**
 * 本地存储 key 常量
 * 统一管理所有本地存储的 key，避免魔法值
 */
export const STORAGE_KEYS = {
  /** 处理历史记录 */
  HISTORIES: 'histories',
  /** 收藏颜色 */
  FAVORITE_COLORS: 'favoriteColors',
  /** 使用统计 */
  USAGE_STATS: 'usageStats',
} as const;

/** 存储 key 类型 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
