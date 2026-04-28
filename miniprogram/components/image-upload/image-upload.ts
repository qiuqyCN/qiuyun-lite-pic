// components/image-upload/image-upload.ts
// 图片上传卡片组件

import { AD_CONFIG } from '../../constants/ad-config';

Component({
  /**
   * 组件属性
   */
  properties: {
    /** 头部标题 */
    headerTitle: {
      type: String,
      value: ''
    },
    /** 头部描述 */
    headerDesc: {
      type: String,
      value: ''
    },
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
    },
    /** 提示列表 */
    tips: {
      type: Array,
      value: []
    },
    /** 是否显示广告（默认使用全局配置） */
    showAd: {
      type: Boolean,
      value: AD_CONFIG.enabled
    },
    /** 广告单元ID（默认使用全局配置） */
    adUnitId: {
      type: String,
      value: AD_CONFIG.units.upload
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
    },

    /**
     * 广告加载成功
     */
    adLoad() {
      console.log('广告加载成功');
    },

    /**
     * 广告加载失败
     */
    adError(err: any) {
      console.error('广告加载失败', err);
    },

    /**
     * 广告关闭
     */
    adClose() {
      console.log('广告关闭');
    }
  }
});
