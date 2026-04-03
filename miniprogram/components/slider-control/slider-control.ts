Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 标签文字
    label: {
      type: String,
      value: '数值'
    },
    // 当前值
    value: {
      type: Number,
      value: 50
    },
    // 最小值
    min: {
      type: Number,
      value: 0
    },
    // 最大值
    max: {
      type: Number,
      value: 100
    },
    // 单位
    unit: {
      type: String,
      value: ''
    },
    // 激活颜色
    activeColor: {
      type: String,
      value: '#41bc3f'
    },
    // 是否显示两端提示
    showHints: {
      type: Boolean,
      value: false
    },
    // 最小值提示
    minHint: {
      type: String,
      value: ''
    },
    // 最大值提示
    maxHint: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentValue: 50
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.setData({
        currentValue: this.properties.value
      });
    }
  },

  /**
   * 数据监听器
   */
  observers: {
    'value': function(value) {
      this.setData({
        currentValue: value
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 滑块拖动中
    onChanging(e: WechatMiniprogram.SliderChange) {
      const value = e.detail.value;
      this.setData({
        currentValue: value
      });
      this.triggerEvent('changing', { value });
    },

    // 滑块拖动结束
    onChange(e: WechatMiniprogram.SliderChange) {
      const value = e.detail.value;
      this.setData({
        currentValue: value
      });
      this.triggerEvent('change', { value });
    }
  }
});
