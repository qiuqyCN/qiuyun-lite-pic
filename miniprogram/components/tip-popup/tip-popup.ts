// components/tip-popup/tip-popup.ts
// 提示弹窗组件 - 带图标、描述、操作按钮，内置显示逻辑

Component({
  properties: {
    /** 图标 */
    icon: {
      type: String,
      value: '👆'
    },
    /** 标题 */
    title: {
      type: String,
      value: ''
    },
    /** 描述 */
    desc: {
      type: String,
      value: ''
    },
    /** 显示时长(秒)，0为不自动关闭 */
    duration: {
      type: Number,
      value: 20
    },
    /** 是否显示"不再显示"按钮 */
    showNeverShow: {
      type: Boolean,
      value: true
    },
    /** 存储key前缀，用于区分不同场景 */
    storageKey: {
      type: String,
      value: 'tipPopup'
    },
    /** 在第几次打开时显示，如 [1, 5, 10] */
    showOnLaunches: {
      type: Array,
      value: [1, 5, 10]
    },
    /** 延迟显示时间(毫秒) */
    delay: {
      type: Number,
      value: 1000
    }
  },

  data: {
    show: false,
    _timer: null as number | null
  },

  lifetimes: {
    attached() {
      this.checkShouldShow();
    }
  },

  methods: {
    checkShouldShow() {
      const { storageKey, showOnLaunches, delay } = this.properties;

      // 检查是否选择过不再提示
      const neverShow = wx.getStorageSync(`${storageKey}_neverShow`);
      if (neverShow) return;

      // 检查今天是否已显示过
      const lastShowDate = wx.getStorageSync(`${storageKey}_lastShowDate`);
      const today = new Date().toDateString();
      if (lastShowDate === today) return;

      // 获取打开次数
      let launchCount = wx.getStorageSync(`${storageKey}_launchCount`) || 0;
      launchCount++;
      wx.setStorageSync(`${storageKey}_launchCount`, launchCount);

      // 判断是否应该显示
      const shouldShow = (showOnLaunches as number[]).includes(launchCount);
      if (!shouldShow) return;

      // 延迟显示
      setTimeout(() => {
        this.setData({ show: true });
        wx.setStorageSync(`${storageKey}_lastShowDate`, today);
        this.startTimer();
      }, delay);
    },

    startTimer() {
      const { duration } = this.properties;
      if (duration <= 0) return;

      this.clearTimer();
      (this.data as any)._timer = setTimeout(() => {
        this.close();
      }, duration * 1000);
    },

    clearTimer() {
      const timer = (this.data as any)._timer;
      if (timer) {
        clearTimeout(timer);
        (this.data as any)._timer = null;
      }
    },

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
      this.clearTimer();
      this.setData({ show: false });
    }
  },

  detached() {
    this.clearTimer();
  }
});
