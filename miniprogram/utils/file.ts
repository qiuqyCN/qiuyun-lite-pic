// utils/file.ts
// 文件操作工具函数

import { STORAGE_KEYS } from '../constants/storage-keys';
import { showSuccess, showLoading } from './ui';
import { handleError } from './error';

/**
 * 保存图片到相册（基础函数）
 * @param filePath 文件路径
 * @returns Promise
 */
export const saveImageToAlbum = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 添加超时处理，10秒后自动失败
    const timeoutId = setTimeout(() => {
      reject(new Error('保存超时，请重试'));
    }, 10000);

    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        clearTimeout(timeoutId);
        resolve();
      },
      fail: (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    });
  });
};

/**
 * 保存图片到相册（带UI提示）
 * 统一处理 loading、成功提示和错误处理
 * @param filePath 文件路径
 * @param options 可选配置
 * @returns Promise<boolean> 是否保存成功
 */
export const saveImageToAlbumWithUI = async (
  filePath: string,
  options?: {
    loadingText?: string;
    successText?: string;
    errorText?: string;
    onSuccess?: () => void;
  }
): Promise<boolean> => {
  const {
    loadingText = '保存中...',
    successText = '已保存到相册',
    errorText = '保存失败',
    onSuccess
  } = options || {};

  const hideLoading = showLoading(loadingText);

  try {
    await saveImageToAlbum(filePath);
    hideLoading();
    showSuccess(successText);
    if (onSuccess) {
      onSuccess();
    }
    return true;
  } catch (err) {
    hideLoading();
    handleError(err, errorText);
    return false;
  }
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
export const getFileSize = (filePath: string): Promise<number> => {
  return new Promise((resolve) => {
    const fs = wx.getFileSystemManager();
    fs.getFileInfo({
      filePath,
      success: (res) => resolve(res.size || 0),
      fail: (err) => {
        console.log('获取文件大小失败', err);
        resolve(0);
      }
    });
  });
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
 * 计算缓存大小
 * @returns 缓存大小（字节）
 */
export const calculateCacheSize = (): Promise<number> => {
  return new Promise((resolve) => {
    const fs = wx.getFileSystemManager();
    fs.stat({
      path: wx.env.USER_DATA_PATH,
      recursive: true,
      success: (res: any) => {
        if (!res || !res.stats) {
          resolve(0);
          return;
        }

        let totalSize = 0;
        const calcSize = (stats: any[]) => {
          if (!stats || !Array.isArray(stats)) return;
          for (const stat of stats) {
            if (stat && stat.stats) {
              if (typeof stat.stats.isFile === 'function' && stat.stats.isFile()) {
                totalSize += stat.stats.size || 0;
              } else if (typeof stat.stats.isDirectory === 'function' && stat.stats.isDirectory() && stat.children) {
                calcSize(stat.children);
              }
            }
          }
        };

        calcSize(res.stats);
        resolve(totalSize);
      },
      fail: (err) => {
        console.log('计算缓存大小失败', err);
        resolve(0);
      }
    });
  });
};

/**
 * 清理缓存
 * 包括：临时文件、本地存储的历史记录、收藏颜色、使用统计
 */
export const clearCache = (): Promise<void> => {
  return new Promise((resolve) => {
    const fs = wx.getFileSystemManager();
    const userDataPath = wx.env.USER_DATA_PATH;

    // 清理本地存储
    try {
      wx.removeStorageSync(STORAGE_KEYS.HISTORIES);
      wx.removeStorageSync(STORAGE_KEYS.FAVORITE_COLORS);
      console.log('本地存储已清理');
    } catch (err) {
      console.log('清理本地存储失败', err);
    }

    // 清理文件系统
    fs.stat({
      path: userDataPath,
      recursive: true,
      success: async (res: any) => {
        if (!res || !res.stats) {
          resolve();
          return;
        }

        const filesToDelete: string[] = [];
        const dirsToDelete: string[] = [];

        // 收集文件和目录
        const collectPaths = (stats: any[], basePath: string) => {
          if (!stats || !Array.isArray(stats)) return;
          for (const stat of stats) {
            const fullPath = `${basePath}/${stat.path}`;
            if (stat && stat.stats) {
              if (typeof stat.stats.isFile === 'function' && stat.stats.isFile()) {
                filesToDelete.push(fullPath);
              } else if (typeof stat.stats.isDirectory === 'function' && stat.stats.isDirectory()) {
                if (stat.children) {
                  collectPaths(stat.children, fullPath);
                }
                // 空目录稍后删除
                dirsToDelete.push(fullPath);
              }
            }
          }
        };

        collectPaths(res.stats, userDataPath);

        // 删除文件
        for (const filePath of filesToDelete) {
          try {
            await new Promise<void>((resolveUnlink) => {
              fs.unlink({
                filePath,
                success: () => resolveUnlink(),
                fail: () => resolveUnlink()
              });
            });
          } catch (err) {
            console.log('删除文件失败', filePath);
          }
        }

        // 删除空目录（从深到浅）
        dirsToDelete.sort((a, b) => b.length - a.length);
        for (const dirPath of dirsToDelete) {
          try {
            await new Promise<void>((resolveRmdir) => {
              fs.rmdir({
                dirPath,
                success: () => resolveRmdir(),
                fail: () => resolveRmdir()
              });
            });
          } catch (err) {
            console.log('删除目录失败', dirPath);
          }
        }

        console.log('文件系统缓存已清理');
        resolve();
      },
      fail: (err) => {
        console.log('清理缓存失败', err);
        resolve();
      }
    });
  });
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
