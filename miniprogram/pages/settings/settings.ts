// settings.ts
// 设置页面

Component({
  data: {
    cacheSize: '0MB',
    version: '1.0.0',
    envVersion: ''
  },

  lifetimes: {
    attached() {
      this.calculateCacheSize();
      this.getVersionInfo();
    }
  },

  pageLifetimes: {
    show() {
      this.calculateCacheSize();
    }
  },

  methods: {
    calculateCacheSize() {
      try {
        const info = wx.getStorageInfoSync();
        const sizeInMB = (info.currentSize / 1024).toFixed(2);
        this.setData({
          cacheSize: sizeInMB + 'MB'
        });
      } catch (err) {
        this.setData({ cacheSize: '0MB' });
      }
    },

    onClearCache() {
      wx.showModal({
        title: '清除缓存',
        content: '确定要清除所有缓存数据吗？历史记录将被清空',
        confirmText: '清除',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            wx.clearStorageSync();
            this.setData({ cacheSize: '0MB' });
            wx.showToast({
              title: '已清除',
              icon: 'success'
            });
          }
        }
      });
    },

    onAbout() {
      const { version, envVersion } = this.data;
      const envText = envVersion && envVersion !== 'release' ? ` (${this.getEnvText(envVersion)})` : '';
      wx.showModal({
        title: '关于秋云轻图',
        content: `秋云轻图 v${version}${envText}\n\n一款轻量级图片处理工具，所有功能均在本地完成，保护您的隐私安全。`,
        showCancel: false
      });
    },

    // 获取版本信息
    getVersionInfo() {
      try {
        const accountInfo = wx.getAccountInfoSync();
        const { version, envVersion } = accountInfo.miniProgram;
        this.setData({
          version: version || '1.0.0',
          envVersion: envVersion || 'release'
        });
      } catch (err) {
        console.log('获取版本信息失败', err);
      }
    },

    // 获取环境版本文本
    getEnvText(envVersion: string): string {
      const envMap: Record<string, string> = {
        'develop': '开发版',
        'trial': '体验版',
        'release': '正式版'
      };
      return envMap[envVersion] || envVersion;
    }
  }
});
