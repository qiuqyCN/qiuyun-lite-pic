// history.ts
// 历史记录页面

Component({
  data: {
    historyList: [] as any[],
    hasMore: false
  },

  lifetimes: {
    attached() {
      this.loadHistory();
    },
    show() {
      this.loadHistory();
    }
  },

  methods: {
    loadHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      this.setData({
        historyList: history.slice(0, 20)
      });
    },

    onHistoryTap(e: WechatMiniprogram.TouchEvent) {
      const { item } = e.currentTarget.dataset;
      // 预览处理后的图片
      wx.previewImage({
        urls: [item.resultPath],
        current: item.resultPath
      });
    },

    onClearHistory() {
      wx.showModal({
        title: '确认清除',
        content: '确定要清除所有历史记录吗？',
        success: (res) => {
          if (res.confirm) {
            wx.removeStorageSync('processHistory');
            this.setData({ historyList: [] });
            wx.showToast({
              title: '已清除',
              icon: 'success'
            });
          }
        }
      });
    }
  }
});
