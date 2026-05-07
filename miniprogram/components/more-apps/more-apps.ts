// components/more-apps/more-apps.ts
// 更多应用组件 - 跨小程序引流

Component({
  properties: {
    /** 应用列表 */
    apps: {
      type: Array,
      value: []
    },
    /** 是否显示标题 */
    showTitle: {
      type: Boolean,
      value: true
    },
    /** 标题文字 */
    title: {
      type: String,
      value: '更多应用'
    }
  },

  methods: {
    onOpenApp(e: WechatMiniprogram.TouchEvent) {
      const { appid, path } = e.currentTarget.dataset;
      if (!appid) return;

      wx.navigateToMiniProgram({
        appId: appid,
        path: path || '',
        envVersion: 'release',
        fail: (err) => {
          console.error('跳转小程序失败', err);
          wx.showToast({ title: '跳转失败', icon: 'none' });
        }
      });
    }
  }
});
