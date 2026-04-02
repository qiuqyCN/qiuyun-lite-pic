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
    }
  },

  pageLifetimes: {
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
      if (this.data.historyList.length === 0) {
        console.log('历史记录为空，不执行清除');
        return;
      }

      console.log('点击清空按钮，显示确认对话框');

      wx.showModal({
        title: '确认清除',
        content: '确定要清除所有历史记录吗？此操作不可恢复',
        showCancel: true,
        cancelText: '取消',
        confirmText: '清除',
        success: (res) => {
          console.log('对话框结果:', res);
          if (res.confirm) {
            console.log('用户确认清除');
            wx.removeStorageSync('processHistory');
            this.setData({ historyList: [] });
            wx.showToast({
              title: '已清除',
              icon: 'success'
            });
          }
        },
        fail: (err) => {
          console.error('showModal 失败:', err);
        }
      });
    },

    // 返回首页
    goToHome() {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});
