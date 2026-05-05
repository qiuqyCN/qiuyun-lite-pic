// utils/share.ts
// 分享功能工具函数

/** 页面分享配置 */
export interface ShareConfig {
  /** 分享标题 */
  title: string;
  /** 分享路径 */
  path: string;
  /** 分享图片 */
  imageUrl: string;
}

/** 分享配置映射 */
const shareConfigMap: Record<string, ShareConfig> = {
  index: {
    title: '秋云轻图 - 极简高效的图片处理工具',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  compress: {
    title: '图片压缩神器，一键节省90%空间',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  resize: {
    title: '图片尺寸调整，适配各种平台',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  convert: {
    title: '图片格式转换，支持多种格式互转',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  filter: {
    title: '20+滤镜效果，让照片更出彩',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  watermark: {
    title: '添加个性水印，保护作品版权',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  crop: {
    title: '智能图片裁剪，自由调整尺寸',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  rotate: {
    title: '图片旋转翻转，任意角度调整',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  annotate: {
    title: '图片标注涂鸦，自由创作',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  collage: {
    title: '多图拼接，多种布局可选',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  colorpicker: {
    title: '图片取色器，精准识别颜色',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  },
  qrcode: {
    title: '免费二维码生成，支持多种格式',
    path: '/pages/qrcode/qrcode',
    imageUrl: '/images/weappcode.png'
  },
  signature: {
    title: '电子签名生成器，手写签名一键导出',
    path: '/pages/signature/signature',
    imageUrl: '/images/weappcode.png'
  },
  settings: {
    title: '秋云轻图 - 本地处理，保护隐私',
    path: '/pages/index/index',
    imageUrl: '/images/weappcode.png'
  }
};

/**
 * 获取页面分享配置
 * @param pageName 页面名称
 * @returns 分享配置
 */
export function getShareConfig(pageName: string): ShareConfig {
  return shareConfigMap[pageName] || shareConfigMap.index;
}

/**
 * 分享到聊天
 * @param pageName 页面名称
 * @returns 分享内容
 */
export function onShareAppMessage(pageName: string): ShareConfig {
  return getShareConfig(pageName);
}

/**
 * 分享到朋友圈
 * @param pageName 页面名称
 * @returns 分享内容
 */
export function onShareTimeline(pageName: string): { title: string; query: string; imageUrl: string } {
  const config = getShareConfig(pageName);
  return {
    title: config.title,
    query: '',
    imageUrl: config.imageUrl
  };
}

/**
 * 为页面添加分享功能
 * 用于 Component 构造器的页面
 */
export function addShareBehavior(pageName: string) {
  return {
    methods: {
      onShareAppMessage() {
        return onShareAppMessage(pageName);
      },
      onShareTimeline() {
        return onShareTimeline(pageName);
      }
    }
  };
}
