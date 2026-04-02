// resize.ts
// 尺寸调整页面

Component({
  data: {
    // 图片信息
    imagePath: '',
    originalSize: 0,
    originalWidth: 0,
    originalHeight: 0,
    resizedPath: '',
    resizedSize: 0,
    resizedWidth: 0,
    resizedHeight: 0,

    // 尺寸设置
    targetWidth: 0,
    targetHeight: 0,
    maintainAspectRatio: true,
    scalePercent: 100,

    // 状态
    isProcessing: false,
    hasImage: false,
  },

  methods: {
    // 选择图片
    async chooseImage() {
      try {
        const res = await wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera']
        });

        const tempFilePath = res.tempFiles[0].tempFilePath;
        const fileSize = res.tempFiles[0].size;

        // 获取图片信息
        const imageInfo = await wx.getImageInfo({
          src: tempFilePath
        });

        const originalWidth = imageInfo.width;
        const originalHeight = imageInfo.height;

        this.setData({
          imagePath: tempFilePath,
          originalSize: Math.round(fileSize / 1024),
          originalWidth,
          originalHeight,
          hasImage: true,
          resizedPath: '',
          resizedSize: 0,
          resizedWidth: 0,
          resizedHeight: 0,
          targetWidth: originalWidth,
          targetHeight: originalHeight,
          scalePercent: 100,
          maintainAspectRatio: true,
        });

      } catch (err) {
        console.log('用户取消选择');
      }
    },

    // 快速预设点击
    onPresetTap(e: WechatMiniprogram.TouchEvent) {
      const percent = parseInt(e.currentTarget.dataset.percent);
      this.updateDimensionsByPercent(percent);
    },

    // 根据百分比更新尺寸
    updateDimensionsByPercent(percent: number) {
      const { originalWidth, originalHeight } = this.data;

      // 无论是否锁定比例，都根据百分比计算新的宽高
      const newWidth = Math.round(originalWidth * percent / 100);
      const newHeight = Math.round(originalHeight * percent / 100);
      this.setData({
        targetWidth: newWidth,
        targetHeight: newHeight,
        scalePercent: percent
      });
    },

    // 宽度输入变化
    onWidthInput(e: WechatMiniprogram.Input) {
      const value = parseInt(e.detail.value) || 0;
      const { originalWidth, originalHeight, maintainAspectRatio } = this.data;

      if (maintainAspectRatio && originalWidth > 0) {
        const ratio = value / originalWidth;
        const newHeight = Math.round(originalHeight * ratio);
        const percent = Math.round(ratio * 100);
        this.setData({
          targetWidth: value,
          targetHeight: newHeight,
          scalePercent: percent
        });
      } else {
        this.setData({
          targetWidth: value
        });
      }
    },

    // 高度输入变化
    onHeightInput(e: WechatMiniprogram.Input) {
      const value = parseInt(e.detail.value) || 0;
      const { originalWidth, originalHeight, maintainAspectRatio } = this.data;

      if (maintainAspectRatio && originalHeight > 0) {
        const ratio = value / originalHeight;
        const newWidth = Math.round(originalWidth * ratio);
        const percent = Math.round(ratio * 100);
        this.setData({
          targetHeight: value,
          targetWidth: newWidth,
          scalePercent: percent
        });
      } else {
        this.setData({
          targetHeight: value
        });
      }
    },

    // 锁定比例切换
    onAspectRatioChange(e: WechatMiniprogram.SwitchChange) {
      const maintainAspectRatio = e.detail.value;

      // 如果开启锁定，根据当前宽度重新计算高度
      if (maintainAspectRatio) {
        const { originalWidth, originalHeight, targetWidth } = this.data;
        if (originalWidth > 0 && targetWidth > 0) {
          const ratio = targetWidth / originalWidth;
          const newHeight = Math.round(originalHeight * ratio);
          const percent = Math.round(ratio * 100);
          this.setData({
            maintainAspectRatio,
            targetHeight: newHeight,
            scalePercent: percent
          });
          return;
        }
      }

      this.setData({ maintainAspectRatio });
    },

    // 预览图片
    previewImage() {
      wx.previewImage({
        urls: [this.data.resizedPath || this.data.imagePath],
        current: this.data.resizedPath || this.data.imagePath
      });
    },

    // 开始调整尺寸
    async startResize() {
      if (!this.data.hasImage) {
        wx.showToast({ title: '请先选择图片', icon: 'none' });
        return;
      }

      const { targetWidth, targetHeight } = this.data;
      if (targetWidth <= 0 || targetHeight <= 0) {
        wx.showToast({ title: '尺寸必须大于0', icon: 'none' });
        return;
      }

      // 限制最大尺寸
      if (targetWidth > 8192 || targetHeight > 8192) {
        wx.showToast({ title: '尺寸不能超过8192px', icon: 'none' });
        return;
      }

      this.setData({ isProcessing: true });

      try {
        // 获取canvas节点
        const query = this.createSelectorQuery();
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#resizeCanvas').fields({ node: true, size: true }).exec((res) => {
            resolve(res[0].node);
          });
        });

        const ctx = canvasNode.getContext('2d');

        // 设置canvas尺寸为目标尺寸
        canvasNode.width = targetWidth;
        canvasNode.height = targetHeight;

        // 创建图片对象
        const image = canvasNode.createImage();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = this.data.imagePath;
        });

        // 绘制图片（缩放至目标尺寸）
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        // 导出调整后的图片
        const tempFilePath = await new Promise<string>((resolve) => {
          wx.canvasToTempFilePath({
            canvas: canvasNode,
            quality: 0.92,
            fileType: 'jpg',
            success: (res) => resolve(res.tempFilePath)
          });
        });

        // 获取调整后文件大小
        const fileInfo = await wx.getFileInfo({
          filePath: tempFilePath
        });

        this.setData({
          resizedPath: tempFilePath,
          resizedSize: Math.round(fileInfo.size / 1024),
          resizedWidth: targetWidth,
          resizedHeight: targetHeight,
          isProcessing: false
        });

        // 保存到历史记录
        this.saveToHistory();

        // 更新使用统计
        this.updateUsageStats();

        wx.showToast({
          title: '调整完成',
          icon: 'success'
        });

      } catch (err) {
        console.error('调整失败:', err);
        wx.showToast({ title: '调整失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
    },

    // 重新调整
    resetResize() {
      const { originalWidth, originalHeight } = this.data;
      this.setData({
        resizedPath: '',
        resizedSize: 0,
        resizedWidth: 0,
        resizedHeight: 0,
        targetWidth: originalWidth,
        targetHeight: originalHeight,
        scalePercent: 100
      });
    },

    // 保存到历史记录
    saveToHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      history.unshift({
        id: Date.now().toString(),
        type: 'resize',
        typeName: '尺寸调整',
        originalPath: this.data.imagePath,
        resultPath: this.data.resizedPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          originalWidth: this.data.originalWidth,
          originalHeight: this.data.originalHeight,
          resizedWidth: this.data.resizedWidth,
          resizedHeight: this.data.resizedHeight,
          originalSize: this.data.originalSize,
          resizedSize: this.data.resizedSize
        }
      });
      wx.setStorageSync('processHistory', history.slice(0, 20));
    },

    // 更新使用统计
    updateUsageStats() {
      const stats = wx.getStorageSync('usageStats') || {
        todayCount: 0,
        totalCount: 0,
        savedSpace: 0,
        lastDate: new Date().toDateString()
      };

      const today = new Date().toDateString();
      if (stats.lastDate !== today) {
        stats.todayCount = 0;
        stats.lastDate = today;
      }

      stats.todayCount++;
      stats.totalCount++;

      wx.setStorageSync('usageStats', stats);
    },

    // 保存到相册
    async saveToAlbum() {
      if (!this.data.resizedPath) return;

      try {
        await wx.saveImageToPhotosAlbum({
          filePath: this.data.resizedPath
        });
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      } catch (err) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  }
});
