// settings.ts
// 设置页面

import { calculateCacheSize, clearCache } from '../../utils/file';
import { handleError } from '../../utils/error';
import { showSuccess } from '../../utils/ui';
import { formatFileSize } from '../../utils/format';

/** 设置页面数据接口 */
interface SettingsData {
  /** 缓存大小显示文本 */
  cacheSize: string;
  /** 版本号 */
  version: string;
  /** 环境版本 */
  envVersion: string;
}

Component({
  data: {
    cacheSize: '0 B',
    version: '1.0.0',
    envVersion: ''
  } as SettingsData,

  options: {
    addGlobalClass: true
  },

  lifetimes: {
    attached() {
      this.loadCacheSize();
      this.getVersionInfo();
    }
  },

  // 页面生命周期
  pageLifetimes: {
    show() {
      // 刷新缓存大小
      this.loadCacheSize();

      // 设置页面分享配置
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage) {
        currentPage.onShareAppMessage = () => {
          return {
            title: '秋云轻图 - 极简高效的图片处理工具',
            path: '/pages/index/index',
            imageUrl: '/images/logo.png'
          };
        };
      }
    }
  },

  methods: {
    /**
     * 加载缓存大小
     * 使用 calculateCacheSize 工具函数获取缓存大小，并使用 formatFileSize 格式化显示
     */
    async loadCacheSize() {
      try {
        const size = await calculateCacheSize();
        this.setData({
          cacheSize: formatFileSize(size)
        });
      } catch (err) {
        handleError(err, '获取缓存大小失败');
        this.setData({ cacheSize: '0 B' });
      }
    },

    /**
     * 清除缓存按钮点击事件
     * 显示确认对话框，确认后使用 clearCache 工具函数清理缓存
     */
    onClearCache() {
      wx.showModal({
        title: '清除缓存',
        content: '确定要清除所有缓存数据吗？历史记录将被清空',
        confirmText: '清除',
        confirmColor: '#ff4d4f',
        success: async (res) => {
          if (res.confirm) {
            try {
              await clearCache();
              this.setData({ cacheSize: '0 B' });
              showSuccess('已清除');
            } catch (err) {
              handleError(err, '清除缓存失败');
            }
          }
        }
      });
    },

    /**
     * 关于按钮点击事件
     * 显示应用版本和说明信息
     */
    onAbout() {
      const { version, envVersion } = this.data;
      const envText = envVersion && envVersion !== 'release' ? ` (${this.getEnvText(envVersion)})` : '';
      wx.showModal({
        title: '关于秋云轻图',
        content: `秋云轻图 v${version}${envText}\n\n一款轻量级图片处理工具，所有功能均在本地完成，保护您的隐私安全。`,
        showCancel: false
      });
    },

    /**
     * 获取版本信息
     * 从小程序账号信息中获取版本号和环境版本
     */
    getVersionInfo() {
      try {
        const accountInfo = wx.getAccountInfoSync();
        const { version, envVersion } = accountInfo.miniProgram;
        this.setData({
          version: version || '1.0.0',
          envVersion: envVersion || 'release'
        });
      } catch (err) {
        handleError(err, '获取版本信息失败');
      }
    },

    /**
     * 获取环境版本文本
     * @param envVersion 环境版本标识/**
     * 获取环境版本文本
     */
    getEnvText(envVersion: string): string {
      const envMap: Record<string, string> = {
        'develop': '开发版',
        'trial': '体验版',
        'release': '正式版'
      };
      return envMap[envVersion] || envVersion;
    },

    /**
     * 预览小程序码
     */
    onShareWeappCode() {
      wx.previewImage({
        urls: ['/images/weappcode.png'],
        current: '/images/weappcode.png'
      });
    },

    /**
     * 广告加载成功
     */
    adLoad() {
      console.log('设置页广告加载成功');
    },

    /**
     * 广告加载失败
     */
    adError(err: any) {
      console.error('设置页广告加载失败', err);
    },

    /**
     * 广告关闭
     */
    adClose() {
      console.log('设置页广告关闭');
    }
  }
});
