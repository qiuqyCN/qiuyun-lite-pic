// components/format-selector/format-selector.ts
// 格式选择器组件

Component({
  /**
   * 组件属性
   */
  properties: {
    /** 当前选中的格式 */
    value: {
      type: String,
      value: 'jpg'
    },
    /** 布局模式：horizontal（横向）| vertical（纵向卡片） */
    mode: {
      type: String,
      value: 'horizontal'
    },
    /** 标题 */
    title: {
      type: String,
      value: '输出格式'
    },
    /** 是否显示描述 */
    showDesc: {
      type: Boolean,
      value: true
    },
    /** 是否显示提示信息 */
    showTip: {
      type: Boolean,
      value: false
    },
    /** 提示信息 */
    tipText: {
      type: String,
      value: ''
    },
    /** 是否隐藏 */
    hidden: {
      type: Boolean,
      value: false
    },
    /** 禁用的格式列表 */
    disabledFormats: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件数据
   */
  data: {
    formatList: [
      { id: 'jpg', name: 'JPG', desc: '有损压缩，广泛兼容', disabled: false },
      { id: 'png', name: 'PNG', desc: '无损压缩，支持透明', disabled: false }
    ]
  },

  /**
   * 属性监听器
   */
  observers: {
    'disabledFormats': function(disabledFormats: string[]) {
      const formatList = this.data.formatList.map(item => ({
        ...item,
        disabled: disabledFormats.includes(item.id)
      }));
      this.setData({ formatList });
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 点击格式选项
     */
    onFormatTap(e: WechatMiniprogram.TouchEvent) {
      const format = e.currentTarget.dataset.format;
      const formatItem = this.data.formatList.find(item => item.id === format);
      
      // 如果格式被禁用，不响应点击
      if (formatItem?.disabled) return;
      
      if (format === this.data.value) return;
      
      this.setData({ value: format });
      this.triggerEvent('change', { format });
    }
  }
});
