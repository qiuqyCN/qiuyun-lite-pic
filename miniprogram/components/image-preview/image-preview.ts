// d:\Codes\WeChatProjects\qiuyun-lite-pic\miniprogram\components\image-preview\image-preview.ts
Component({
  properties: {
    // 图片路径（必填）
    imagePath: {
      type: String,
      value: ''
    },
    // 标题
    title: {
      type: String,
      value: '图片预览'
    },
    // 是否显示更换按钮
    showChange: {
      type: Boolean,
      value: true
    },
    // 是否处理中
    isProcessing: {
      type: Boolean,
      value: false
    },
    // 处理中文字
    processingText: {
      type: String,
      value: '处理中...'
    }
  },

  data: {
    imageLoading: false,
    imageLoaded: false
  },

  observers: {
    'imagePath': function(newPath: string) {
      if (newPath) {
        // 路径变化时，重置加载状态
        this.setData({
          imageLoading: true,
          imageLoaded: false
        });
      } else {
        this.setData({
          imageLoading: false,
          imageLoaded: false
        });
      }
    }
  },

  methods: {
    // 点击更换按钮
    onChangeTap() {
      this.triggerEvent('change');
    },

    // 点击图片预览
    onImageTap() {
      if (this.data.isProcessing) return;

      if (this.data.imagePath) {
        wx.previewImage({
          current: this.data.imagePath,
          urls: [this.data.imagePath]
        });
        this.triggerEvent('preview', {
          imagePath: this.data.imagePath
        });
      }
    },

    // 图片加载完成
    onImageLoad() {
      this.setData({
        imageLoading: false,
        imageLoaded: true
      });
    },

    // 图片加载失败
    onImageError() {
      this.setData({
        imageLoading: false,
        imageLoaded: false
      });
    }
  }
});
