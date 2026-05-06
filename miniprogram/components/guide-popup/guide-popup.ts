// components/guide-popup/guide-popup.ts
// 引导弹窗组件 - "下次可以这样找到我"，内置显示逻辑

Component({
  properties: {
    /** 标题 */
    title: {
      type: String,
      value: '下次可以这样找到我'
    },
    /** 存储key前缀 */
    storageKey: {
      type: String,
      value: 'guidePopup'
    },
    /** 在第几次打开时显示 */
    showOnLaunches: {
      type: Array,
      value: [3, 8, 15]
    },
    /** 延迟显示时间(毫秒) */
    delay: {
      type: Number,
      value: 500
    }
  },

  data: {
    show: false
  },

  lifetimes: {
    attached() {
      this.checkShouldShow();
    }
  },

  methods: {
    checkShouldShow() {
      const { storageKey, showOnLaunches, delay } = this.properties;

      const neverShow = wx.getStorageSync(`${storageKey}_neverShow`);
      if (neverShow) return;

      // const lastShowDate = wx.getStorageSync(`${storageKey}_lastShowDate`);
      // const today = new Date().toDateString();
      // if (lastShowDate === today) return;

      let launchCount = wx.getStorageSync(`${storageKey}_launchCount`) || 0;
      launchCount++;
      wx.setStorageSync(`${storageKey}_launchCount`, launchCount);

      const shouldShow = (showOnLaunches as number[]).includes(launchCount);
      if (!shouldShow) return;

      setTimeout(() => {
        this.setData({ show: true });
        // wx.setStorageSync(`${storageKey}_lastShowDate`, today);
      }, delay);
    },

    stopPropagation() {},

    onConfirm() {
      this.triggerEvent('confirm');
      this.close();
    },

    onNeverShow() {
      const { storageKey } = this.properties;
      wx.setStorageSync(`${storageKey}_neverShow`, true);
      this.triggerEvent('nevershow');
      this.close();
    },

    close() {
      this.setData({ show: false });
    }
  }
});
