// components/more-apps/more-apps.ts
// 更多应用组件 - 跨小程序引流

Component({
  properties: {
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

  data: {
    apps: [
      {
        appid: 'wx8f22a4c93bed3d01',
        name: '秋云工具大全',
        desc: '实用工具集合',
        logo: '/images/logo/toolbox-logo.png'
      },
      {
        appid: 'wx0133fb911f0e7232',
        name: '办公文档助手',
        desc: '文档处理工具',
        logo: '/images/logo/doc-logo.png'
      },
      // {
      //   appid: 'wx1ee54f15721ada62',
      //   name: '秋云古诗词',
      //   desc: '诗词学习鉴赏',
      //   logo: '/images/logo/poetry-logo.png'
      // }
    ]
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
