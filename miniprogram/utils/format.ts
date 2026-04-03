// utils/format.ts
// 格式化工具函数

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
};

/**
 * 格式化文件大小（简化版，用于显示）
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export const formatFileSizeSimple = (bytes: number): string => {
  if (bytes === 0) return '0B';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
};

/**
 * 格式化尺寸
 * @param width 宽度
 * @param height 高度
 * @returns 格式化后的字符串
 */
export const formatDimensions = (width: number, height: number): string => {
  return `${width} × ${height}`;
};

/**
 * 格式化时间
 * @param date 日期
 * @returns 格式化后的字符串
 */
export const formatTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

/**
 * 格式化日期
 * @param date 日期
 * @returns 格式化后的字符串
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化相对时间
 * @param timestamp 时间戳
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前';
  } else {
    return formatDate(new Date(timestamp));
  }
};

/**
 * 格式化百分比
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals) + '%';
};

/**
 * 格式化数字（添加千分位）
 * @param num 数字
 * @returns 格式化后的字符串
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 格式化质量值
 * @param quality 质量值 0-100
 * @returns 格式化后的字符串
 */
export const formatQuality = (quality: number): string => {
  return quality + '%';
};

/**
 * 格式化像素值
 * @param px 像素值
 * @returns 格式化后的字符串
 */
export const formatPixels = (px: number): string => {
  return px + 'px';
};

/**
 * 截断字符串
 * @param str 字符串
 * @param length 最大长度
 * @param suffix 后缀
 * @returns 截断后的字符串
 */
export const truncateString = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

/**
 * 首字母大写
 * @param str 字符串
 * @returns 格式化后的字符串
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * 转换为小驼峰命名
 * @param str 字符串
 * @returns 格式化后的字符串
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
};

/**
 * 转换为短横线命名
 * @param str 字符串
 * @returns 格式化后的字符串
 */
export const toKebabCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
};

/**
 * 移除 HTML 标签
 * @param html HTML 字符串
 * @returns 纯文本
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * 转义 HTML 特殊字符
 * @param str 字符串
 * @returns 转义后的字符串
 */
export const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>"'\/]/g, char => htmlEscapes[char]);
};

/**
 * 生成唯一 ID
 * @returns 唯一 ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 生成时间戳文件名
 * @param prefix 前缀
 * @param extension 扩展名
 * @returns 文件名
 */
export const generateTimestampFileName = (prefix: string = '', extension: string = 'jpg'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}${timestamp}.${extension}`;
};
