// settings.ts
// 设置页面

Component({
  data: {
    defaultQuality: 80,
    autoSave: true,
    cacheSize: '0MB'
  },

  lifetimes: {
    attached() {
      this.loadSettings();
      this.calculateCacheSize();
    }
  },

  methods: {
    loadSettings() {
      const settings = wx.getStorageSync('appSettings') || {};
      this.setData({
        defaultQuality: settings.defaultQuality || 80,
        autoSave: settings.autoSave !== false
      });
    },

    onQualityChange(e: WechatMiniprogram.SliderChange) {
      const value = e.detail.value;
      this.setData({ defaultQuality: value });
      this.saveSettings();
    },

    onAutoSaveChange(e: WechatMiniprogram.SwitchChange) {
      const value = e.detail.value;
      this.setData({ autoSave: value });
      this.saveSettings();
    },

    saveSettings() {
      const settings = {
        defaultQuality: this.data.defaultQuality,
        autoSave: this.data.autoSave
      };
      wx.setStorageSync('appSettings', settings);
    },

    calculateCacheSize() {
      // 计算本地缓存大小
      const keys = wx.getStorageInfoSync().keys;
      let size = 0;
      keys.forEach(key => {
        const value = wx.getStorageSync(key);
        size += JSON.stringify(value).length;
      });
      this.setData({
        cacheSize: (size / 1024 / 1024).toFixed(2) + 'MB'
      });
    },

    onClearCache() {
      wx.showModal({
        title: '清除缓存',
        content: '确定要清除所有缓存数据吗？',
        success: (res) => {
          if (res.confirm) {
            // 保留设置，清除其他数据
            const settings = wx.getStorageSync('appSettings');
            wx.clearStorageSync();
            wx.setStorageSync('appSettings', settings);
            
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
      wx.showModal({
        title: '关于秋云轻图',
        content: '秋云轻图 v1.0.0\n\n一款轻量级图片处理工具，所有功能均在本地完成，保护您的隐私安全。',
        showCancel: false
      });
    },

    onFeedback() {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  }
});
