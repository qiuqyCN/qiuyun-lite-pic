// utils/file.ts
// 文件操作工具函数

import type { HistoryItem } from '../types/index';

/**
 * 保存图片到相册
 * @param filePath 文件路径
 * @returns Promise
 */
export const saveImageToAlbum = async (filePath: string): Promise<void> => {
  await wx.saveImageToPhotosAlbum({ filePath });
};

/**
 * 分享图片
 * @param filePath 文件路径
 * @returns Promise
 */
export const shareImage = async (filePath: string): Promise<void> => {
  await (wx as any).shareFileMessage({
    filePath,
    fileName: '处理后的图片'
  });
};

/**
 * 预览图片
 * @param urls 图片链接数组
 * @param current 当前显示的图片
 */
export const previewImage = (urls: string[], current?: string): void => {
  wx.previewImage({
    urls,
    current: current || urls[0]
  });
};

/**
 * 获取文件信息
 * @param filePath 文件路径
 * @returns 文件大小
 */
export const getFileSize = async (filePath: string): Promise<number> => {
  const res = await wx.getFileInfo({ filePath });
  return res.size;
};

/**
 * 删除临时文件
 * @param filePath 文件路径
 */
export const removeTempFile = async (filePath: string): Promise<void> => {
  try {
    await wx.getFileSystemManager().unlink({ filePath } as any);
  } catch (err) {
    console.log('删除临时文件失败', err);
  }
};

/**
 * 批量删除临时文件
 * @param filePaths 文件路径数组
 */
export const removeTempFiles = async (filePaths: string[]): Promise<void> => {
  for (const path of filePaths) {
    await removeTempFile(path);
  }
};

/**
 * 保存到历史记录
 * @param item 历史记录项
 */
export const saveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>): void => {
  const history = wx.getStorageSync('processHistory') || [];
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now()
  };
  history.unshift(newItem);
  
  // 只保留最近50条
  if (history.length > 50) {
    history.pop();
  }
  
  wx.setStorageSync('processHistory', history);
};

/**
 * 获取历史记录
 * @returns 历史记录数组
 */
export const getHistory = (): HistoryItem[] => {
  return wx.getStorageSync('processHistory') || [];
};

/**
 * 清空历史记录
 */
export const clearHistory = (): void => {
  wx.setStorageSync('processHistory', []);
};

/**
 * 删除单条历史记录
 * @param id 记录ID
 */
export const removeHistoryItem = (id: string): void => {
  const history = wx.getStorageSync('processHistory') || [];
  const filtered = history.filter((item: HistoryItem) => item.id !== id);
  wx.setStorageSync('processHistory', filtered);
};

/**
 * 计算缓存大小
 * @returns 缓存大小（字节）
 */
export const calculateCacheSize = async (): Promise<number> => {
  try {
    const res: any = await wx.getFileSystemManager().stat({
      path: wx.env.USER_DATA_PATH,
      recursive: true
    });
    
    let totalSize = 0;
    const calcSize = (stats: any[]) => {
      for (const stat of stats) {
        if (stat.stats.isFile()) {
          totalSize += stat.stats.size;
        } else if (stat.stats.isDirectory() && stat.children) {
          calcSize(stat.children);
        }
      }
    };
    
    calcSize(res.stats || []);
    return totalSize;
  } catch (err) {
    console.log('计算缓存大小失败', err);
    return 0;
  }
};

/**
 * 清理缓存
 */
export const clearCache = async (): Promise<void> => {
  try {
    const fs = wx.getFileSystemManager();
    const res: any = await fs.stat({
      path: wx.env.USER_DATA_PATH,
      recursive: true
    });
    
    const removeFiles = (stats: any[], basePath: string) => {
      for (const stat of stats) {
        const fullPath = `${basePath}/${stat.path}`;
        if (stat.stats.isFile()) {
          try {
            fs.unlink({ filePath: fullPath } as any);
          } catch (err) {
            console.log('删除文件失败', fullPath);
          }
        } else if (stat.stats.isDirectory() && stat.children) {
          removeFiles(stat.children, fullPath);
        }
      }
    };
    
    removeFiles(res.stats || [], wx.env.USER_DATA_PATH);
  } catch (err) {
    console.log('清理缓存失败', err);
  }
};

/**
 * 下载文件
 * @param url 下载地址
 * @returns 临时文件路径
 */
export const downloadFile = async (url: string): Promise<string> => {
  const res: any = await wx.downloadFile({ url });
  return res.tempFilePath;
};

/**
 * 读取本地文件
 * @param filePath 文件路径
 * @returns 文件内容
 */
export const readFile = async (filePath: string): Promise<string | ArrayBuffer> => {
  const res: any = await wx.getFileSystemManager().readFile({
    filePath,
    encoding: 'base64'
  });
  return res.data;
};

/**
 * 写入本地文件
 * @param filePath 文件路径
 * @param data 文件内容
 */
export const writeFile = async (
  filePath: string,
  data: string | ArrayBuffer
): Promise<void> => {
  await wx.getFileSystemManager().writeFile({
    filePath,
    data,
    encoding: typeof data === 'string' ? 'utf8' : undefined
  });
};
