// components/color-picker/color-picker.ts
// 颜色选择器组件

Component({
  /**
   * 组件属性
   */
  properties: {
    /** 颜色列表 */
    colors: {
      type: Array,
      value: [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
        '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#FFD700'
      ]
    },
    /** 当前选中颜色 */
    selectedColor: {
      type: String,
      value: '#000000'
    },
    /** 标题 */
    title: {
      type: String,
      value: '选择颜色'
    },
    /** 是否显示标题 */
    showTitle: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 点击颜色
     */
    onColorTap(e: WechatMiniprogram.TouchEvent) {
      const color = e.currentTarget.dataset.color;
      this.triggerEvent('select', { color });
    }
  }
});
