// components/action-buttons/action-buttons.ts
// 操作按钮组件

Component({
  /**
   * 组件属性
   */
  properties: {
    /** 是否有结果 */
    hasResult: {
      type: Boolean,
      value: false
    },
    /** 是否处理中 */
    isLoading: {
      type: Boolean,
      value: false
    },
    /** 主按钮文字 */
    primaryText: {
      type: String,
      value: '确认'
    },
    /** 次按钮文字 */
    secondaryText: {
      type: String,
      value: '重新操作'
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
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 点击主按钮
     */
    onPrimaryTap() {
      if (this.data.isLoading) return;
      this.triggerEvent('primary');
    },

    /**
     * 点击次按钮
     */
    onSecondaryTap() {
      if (this.data.isLoading) return;
      this.triggerEvent('secondary');
    },

    /**
     * 点击保存按钮
     */
    onSaveTap() {
      if (this.data.isLoading) return;
      this.triggerEvent('save');
    }
  }
});
