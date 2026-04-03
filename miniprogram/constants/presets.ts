// constants/presets.ts
// 预设尺寸常量

import type { PresetSize } from '../types/index';

/**
 * 证件照预设尺寸
 */
export const ID_CARD_PRESETS: PresetSize[] = [
  { id: 'idcard', name: '身份证', width: 358, height: 441, category: '证件' },
  { id: 'oneinch', name: '一寸', width: 295, height: 413, category: '证件' },
  { id: 'smallone', name: '小一寸', width: 260, height: 378, category: '证件' },
  { id: 'bigone', name: '大一寸', width: 390, height: 567, category: '证件' },
  { id: 'twoinch', name: '二寸', width: 413, height: 626, category: '证件' },
  { id: 'smalltwo', name: '小二寸', width: 413, height: 531, category: '证件' },
  { id: 'social', name: '社保卡', width: 358, height: 441, category: '证件' },
  { id: 'passport', name: '护照', width: 390, height: 567, category: '证件' },
  { id: 'driving', name: '驾驶证', width: 260, height: 378, category: '证件' },
];

/**
 * 考试报名预设尺寸
 */
export const EXAM_PRESETS: PresetSize[] = [
  { id: 'cet', name: '英语四六级', width: 144, height: 192, category: '考试' },
  { id: 'computer', name: '计算机等级', width: 144, height: 192, category: '考试' },
  { id: 'mandarin', name: '普通话', width: 390, height: 567, category: '考试' },
  { id: 'teacher', name: '教师资格证', width: 295, height: 413, category: '考试' },
  { id: 'civil', name: '公务员', width: 295, height: 413, category: '考试' },
  { id: 'postgraduate', name: '研究生', width: 480, height: 640, category: '考试' },
];

/**
 * 社交媒体预设尺寸
 */
export const SOCIAL_PRESETS: PresetSize[] = [
  { id: 'wechat_avatar', name: '微信头像', width: 200, height: 200, category: '社交' },
  { id: 'wechat_moments', name: '朋友圈', width: 1080, height: 1080, category: '社交' },
  { id: 'wechat_cover', name: '公众号封面', width: 900, height: 383, category: '社交' },
  { id: 'douyin_avatar', name: '抖音头像', width: 400, height: 400, category: '社交' },
  { id: 'douyin_cover', name: '抖音封面', width: 1125, height: 633, category: '社交' },
  { id: 'xiaohongshu', name: '小红书', width: 1242, height: 1660, category: '社交' },
  { id: 'weibo', name: '微博', width: 900, height: 500, category: '社交' },
];

/**
 * 电商平台预设尺寸
 */
export const ECOM_PRESETS: PresetSize[] = [
  { id: 'taobao_main', name: '淘宝主图', width: 800, height: 800, category: '电商' },
  { id: 'taobao_detail', name: '淘宝详情', width: 750, height: 1000, category: '电商' },
  { id: 'jd_main', name: '京东主图', width: 800, height: 800, category: '电商' },
  { id: 'pdd_main', name: '拼多多主图', width: 750, height: 750, category: '电商' },
];

/**
 * 所有预设尺寸
 */
export const ALL_PRESETS: PresetSize[] = [
  ...ID_CARD_PRESETS,
  ...EXAM_PRESETS,
  ...SOCIAL_PRESETS,
  ...ECOM_PRESETS,
];

/**
 * 常用比例
 */
export const ASPECT_RATIOS = {
  '1:1': { width: 1, height: 1, name: '正方形' },
  '3:4': { width: 3, height: 4, name: '竖版照片' },
  '4:3': { width: 4, height: 3, name: '横版照片' },
  '9:16': { width: 9, height: 16, name: '竖版视频' },
  '16:9': { width: 16, height: 9, name: '横版视频' },
  '2:3': { width: 2, height: 3, name: '竖版海报' },
  '3:2': { width: 3, height: 2, name: '横版海报' },
} as const;

/**
 * 根据ID获取预设
 * @param id 预设ID
 * @returns 预设尺寸或undefined
 */
export const getPresetById = (id: string): PresetSize | undefined => {
  return ALL_PRESETS.find(preset => preset.id === id);
};

/**
 * 根据分类获取预设
 * @param category 分类名称
 * @returns 预设尺寸数组
 */
export const getPresetsByCategory = (category: string): PresetSize[] => {
  return ALL_PRESETS.filter(preset => preset.category === category);
};

/**
 * 获取所有分类
 * @returns 分类数组
 */
export const getCategories = (): string[] => {
  return [...new Set(ALL_PRESETS.map(preset => preset.category))];
};
