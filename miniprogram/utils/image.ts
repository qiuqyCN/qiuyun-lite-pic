// utils/image.ts
// 图片处理工具函数

import type { ImageInfo } from '../types/index';

/**
 * 选择图片
 * @returns 图片信息
 */
export const chooseImage = async (): Promise<ImageInfo> => {
  const res = await wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera']
  });

  const tempFile = res.tempFiles[0];
  const imageInfo = await wx.getImageInfo({
    src: tempFile.tempFilePath
  });

  return {
    path: tempFile.tempFilePath,
    width: imageInfo.width,
    height: imageInfo.height,
    size: tempFile.size,
    type: imageInfo.type
  };
};

/**
 * 选择多张图片
 * @param count 数量限制
 * @returns 图片信息数组
 */
export const chooseMultipleImages = async (count: number = 9): Promise<ImageInfo[]> => {
  const res = await wx.chooseMedia({
    count,
    mediaType: ['image'],
    sourceType: ['album', 'camera']
  });

  const images: ImageInfo[] = [];
  for (const tempFile of res.tempFiles) {
    const imageInfo = await wx.getImageInfo({
      src: tempFile.tempFilePath
    });

    images.push({
      path: tempFile.tempFilePath,
      width: imageInfo.width,
      height: imageInfo.height,
      size: tempFile.size,
      type: imageInfo.type
    });
  }

  return images;
};

/**
 * 获取图片信息
 * @param path 图片路径
 * @returns 图片信息
 */
export const getImageInfo = async (path: string): Promise<ImageInfo> => {
  const [imageInfo, fileInfo] = await Promise.all([
    wx.getImageInfo({ src: path }),
    wx.getFileInfo({ filePath: path })
  ]);

  return {
    path,
    width: imageInfo.width,
    height: imageInfo.height,
    size: fileInfo.size,
    type: imageInfo.type
  };
};

/**
 * 计算压缩后的预估大小
 * @param originalSize 原始大小
 * @param quality 压缩质量
 * @returns 预估大小范围
 */
export const estimateCompressedSize = (originalSize: number, quality: number): { min: number; max: number } => {
  const ratio = quality / 100;
  const min = Math.round(originalSize * ratio * 0.3);
  const max = Math.round(originalSize * ratio * 0.7);
  return { min, max };
};

/**
 * 计算节省的百分比
 * @param originalSize 原始大小
 * @param newSize 新大小
 * @returns 节省百分比
 */
export const calculateSavedPercent = (originalSize: number, newSize: number): number => {
  if (originalSize <= 0) return 0;
  return Math.round(((originalSize - newSize) / originalSize) * 100);
};

/**
 * 计算保持宽高比的尺寸
 * @param originalWidth 原始宽度
 * @param originalHeight 原始高度
 * @param targetWidth 目标宽度
 * @param targetHeight 目标高度
 * @returns 计算后的尺寸
 */
export const calculateAspectRatioSize = (
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } => {
  if (!maintainAspectRatio) {
    return { width: targetWidth, height: targetHeight };
  }

  const originalAspect = originalWidth / originalHeight;
  const targetAspect = targetWidth / targetHeight;

  let width: number;
  let height: number;

  if (originalAspect > targetAspect) {
    width = targetWidth;
    height = Math.round(targetWidth / originalAspect);
  } else {
    height = targetHeight;
    width = Math.round(targetHeight * originalAspect);
  }

  return { width, height };
};

/**
 * 计算图片在容器中的显示尺寸（aspectFit）
 * @param imageWidth 图片宽度
 * @param imageHeight 图片高度
 * @param containerWidth 容器宽度
 * @param containerHeight 容器高度
 * @returns 显示尺寸
 */
export const calculateDisplaySize = (
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } => {
  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  let width: number;
  let height: number;

  if (imageAspect > containerAspect) {
    width = containerWidth;
    height = Math.round(containerWidth / imageAspect);
  } else {
    height = containerHeight;
    width = Math.round(containerHeight * imageAspect);
  }

  return { width, height };
};

/**
 * 生成滤镜样式字符串
 * @param brightness 亮度
 * @param contrast 对比度
 * @param saturation 饱和度
 * @returns CSS filter 字符串
 */
export const generateFilterStyle = (
  brightness: number = 0,
  contrast: number = 0,
  saturation: number = 0
): string => {
  const b = 100 + brightness;
  const c = 100 + contrast;
  const s = 100 + saturation;
  return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
};

/**
 * 预加载图片
 * @param src 图片路径
 * @returns Promise
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = { path: src } as any;
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('图片加载失败'));
    // 微信小程序中通过 getImageInfo 预加载
    wx.getImageInfo({ src }).then(() => resolve()).catch(reject);
  });
};

/**
 * 预加载多张图片
 * @param srcs 图片路径数组
 * @returns Promise
 */
export const preloadImages = (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(src => preloadImage(src)));
};
