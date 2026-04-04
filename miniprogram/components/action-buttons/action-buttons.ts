// components/action-buttons/action-buttons.ts
// 操作按钮组件 - 重置 + 保存到相册

Component({
  properties: {
    /** 是否处理中 */
    isLoading: {
      type: Boolean,
      value: false
    },
    /** 重置按钮文字 */
    resetText: {
      type: String,
      value: '重置'
    },
    /** 保存按钮文字 */
    saveText: {
      type: String,
      value: '保存到相册'
    },
    /** 加载文字 */
    loadingText: {
      type: String,
      value: '处理中...'
    },
    /** 是否禁用保存按钮 */
    disabled: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onResetTap() {
      if (this.data.isLoading) return;
      this.triggerEvent('reset');
    },

    onSaveTap() {
      if (this.data.isLoading) return;
      this.triggerEvent('save');
    }
  }
});
