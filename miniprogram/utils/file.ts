// utils/file.ts
// 文件操作工具函数

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
export const getFileSize = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
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
 */
export const clearCache = (): Promise<void> => {
  return new Promise((resolve) => {
    const fs = wx.getFileSystemManager();
    fs.stat({
      path: wx.env.USER_DATA_PATH,
      recursive: true,
      success: (res: any) => {
        if (!res || !res.stats) {
          resolve();
          return;
        }

        const removeFiles = (stats: any[], basePath: string) => {
          for (const stat of stats) {
            const fullPath = `${basePath}/${stat.path}`;
            if (stat.stats && typeof stat.stats.isFile === 'function' && stat.stats.isFile()) {
              try {
                fs.unlink({ filePath: fullPath } as any);
              } catch (err) {
                console.log('删除文件失败', fullPath);
              }
            } else if (stat.stats && typeof stat.stats.isDirectory === 'function' && stat.stats.isDirectory() && stat.children) {
              removeFiles(stat.children, fullPath);
            }
          }
        };

        removeFiles(res.stats, wx.env.USER_DATA_PATH);
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
