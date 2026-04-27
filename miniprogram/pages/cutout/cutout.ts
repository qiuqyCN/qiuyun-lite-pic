// cutout.ts
// 简单抠图页面

import { onShareAppMessage, onShareTimeline } from '../../utils/share';

Component({
  methods: {
    /**
     * 分享到聊天
     */
    onShareAppMessage() {
      return onShareAppMessage('cutout');
    },

    /**
     * 分享到朋友圈
     */
    onShareTimeline() {
      return onShareTimeline('cutout');
    },

    goBack() {
      wx.navigateBack();
    }
  }
});
