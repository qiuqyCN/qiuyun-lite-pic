// components/scroll-selector/scroll-selector.ts
// 横向滚动选择器组件

Component({
  /**
   * 组件属性
   */
  properties: {
    /** 列表数据 */
    list: {
      type: Array,
      value: []
    },
    /** 当前选中项ID */
    selectedId: {
      type: String,
      value: ''
    },
    /** 标题 */
    title: {
      type: String,
      value: '选择'
    },
    /** 是否显示滑动提示 */
    showHint: {
      type: Boolean,
      value: true
    },
    /** 提示文字 */
    hintText: {
      type: String,
      value: '左右滑动查看更多'
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 点击选中项
     */
    onItemTap(e: WechatMiniprogram.TouchEvent) {
      const item = e.currentTarget.dataset.item;
      this.triggerEvent('select', { item });
    }
  }
});
