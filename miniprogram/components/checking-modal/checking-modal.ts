// checking-modal.ts
// 安全检测中的 loading 弹窗 + Banner 广告

import { AD_CONFIG } from '../../constants/ad-config'

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    showAd: {
      type: Boolean,
      value: AD_CONFIG.enabled,
    },
    adUnitId: {
      type: String,
      value: AD_CONFIG.units.indexFooter,
    },
  },
  methods: {
    onAdLoad() {
      console.log('[CheckingModal] 广告加载成功')
    },
    onAdError(err: any) {
      console.warn('[CheckingModal] 广告加载失败:', err?.errMsg || err)
    },
  },
})
