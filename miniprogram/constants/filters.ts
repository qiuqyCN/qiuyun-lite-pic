// constants/filters.ts
// 滤镜预设常量

import type { FilterParams } from '../types/index';

/**
 * 基础滤镜
 */
export const BASIC_FILTERS: FilterParams[] = [
  { id: 'original', name: '原图', brightness: 0, contrast: 0, saturation: 0 },
  { id: 'bright', name: '明亮', brightness: 20, contrast: 10, saturation: 10 },
  { id: 'dark', name: '暗调', brightness: -20, contrast: 10, saturation: -10 },
  { id: 'vivid', name: '鲜艳', brightness: 10, contrast: 15, saturation: 30 },
  { id: 'soft', name: '柔和', brightness: 5, contrast: -10, saturation: -10 },
];

/**
 * 人像滤镜
 */
export const PORTRAIT_FILTERS: FilterParams[] = [
  { id: 'beauty', name: '美颜', brightness: 10, contrast: -5, saturation: 5 },
  { id: 'natural', name: '自然', brightness: 5, contrast: 0, saturation: 0 },
  { id: 'fair', name: '白皙', brightness: 20, contrast: -10, saturation: -20 },
  { id: 'warm', name: '暖调', brightness: 10, contrast: 5, saturation: 10, warmth: 20 },
  { id: 'cool', name: '冷调', brightness: 5, contrast: 5, saturation: -5, warmth: -20 },
];

/**
 * 风景滤镜
 */
export const LANDSCAPE_FILTERS: FilterParams[] = [
  { id: 'scenery', name: '风景', brightness: 5, contrast: 15, saturation: 20 },
  { id: 'sky', name: '天空', brightness: 10, contrast: 20, saturation: 25 },
  { id: 'sunset', name: '夕阳', brightness: -5, contrast: 20, saturation: 30, warmth: 40 },
  { id: 'night', name: '夜景', brightness: -10, contrast: 25, saturation: 10 },
  { id: 'fog', name: '雾感', brightness: 10, contrast: -20, saturation: -30 },
];

/**
 * 风格滤镜
 */
export const STYLE_FILTERS: FilterParams[] = [
  { id: 'retro', name: '复古', brightness: -5, contrast: 10, saturation: -20 },
  { id: 'film', name: '胶片', brightness: 5, contrast: 15, saturation: -10 },
  { id: 'bw', name: '黑白', brightness: 0, contrast: 20, saturation: -100 },
  { id: 'sepia', name: '怀旧', brightness: 0, contrast: 0, saturation: -30, warmth: 50 },
  { id: 'vintage', name: '老照片', brightness: -10, contrast: -5, saturation: -40, warmth: 30 },
];

/**
 * 美食滤镜
 */
export const FOOD_FILTERS: FilterParams[] = [
  { id: 'food', name: '美食', brightness: 10, contrast: 15, saturation: 25 },
  { id: 'delicious', name: '美味', brightness: 15, contrast: 20, saturation: 30 },
  { id: 'fresh', name: '清新', brightness: 20, contrast: 5, saturation: 15 },
  { id: 'sweet', name: '甜品', brightness: 15, contrast: 10, saturation: 20, warmth: 15 },
];

/**
 * 所有滤镜
 */
export const ALL_FILTERS: FilterParams[] = [
  ...BASIC_FILTERS,
  ...PORTRAIT_FILTERS,
  ...LANDSCAPE_FILTERS,
  ...STYLE_FILTERS,
  ...FOOD_FILTERS,
];

/**
 * 根据ID获取滤镜
 * @param id 滤镜ID
 * @returns 滤镜参数或undefined
 */
export const getFilterById = (id: string): FilterParams | undefined => {
  return ALL_FILTERS.find(filter => filter.id === id);
};

/**
 * 根据分类获取滤镜
 * @param category 分类名称
 * @returns 滤镜数组
 */
export const getFiltersByCategory = (category: string): FilterParams[] => {
  const categoryMap: Record<string, FilterParams[]> = {
    '基础': BASIC_FILTERS,
    '人像': PORTRAIT_FILTERS,
    '风景': LANDSCAPE_FILTERS,
    '风格': STYLE_FILTERS,
    '美食': FOOD_FILTERS,
  };
  return categoryMap[category] || [];
};

/**
 * 获取所有分类
 * @returns 分类数组
 */
export const getFilterCategories = (): string[] => {
  return ['基础', '人像', '风景', '风格', '美食'];
};

/**
 * 生成滤镜样式字符串
 * @param filter 滤镜参数
 * @returns CSS filter 字符串
 */
export const generateFilterStyle = (filter: FilterParams): string => {
  const brightness = 100 + filter.brightness;
  const contrast = 100 + filter.contrast;
  const saturation = 100 + filter.saturation;
  
  let style = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  
  if (filter.blur && filter.blur > 0) {
    style += ` blur(${filter.blur / 10}px)`;
  }
  
  return style;
};
