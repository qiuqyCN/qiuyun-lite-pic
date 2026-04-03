// components/image-upload/image-upload.ts
// 图片上传卡片组件

Component({
  /**
   * 组件属性
   */
  properties: {
    /** 图标 */
    icon: {
      type: String,
      value: '+'
    },
    /** 标题 */
    title: {
      type: String,
      value: '选择图片'
    },
    /** 提示文字 */
    hint: {
      type: String,
      value: '点击从相册选择或拍照'
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
     * 点击上传卡片
     */
    onTap() {
      if (this.data.disabled) return;
      this.triggerEvent('upload');
    }
  }
});
