// compress.ts
// 图片压缩页面 - 方案二简洁设计

Component({
  data: {
    // 图片信息
    imagePath: '',
    originalSize: 0,
    originalWidth: 0,
    originalHeight: 0,
    compressedPath: '',
    compressedSize: 0,

    // 压缩参数
    quality: 60,

    // 估算范围
    estimatedMin: 0,
    estimatedMax: 0,

    // 节省百分比
    savedPercent: 0,

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

        const originalSize = Math.round(fileSize / 1024);
        const quality = 60;

        this.setData({
          imagePath: tempFilePath,
          originalSize,
          originalWidth: imageInfo.width,
          originalHeight: imageInfo.height,
          hasImage: true,
          compressedPath: '',
          compressedSize: 0,
          quality,
          ...this.calculateEstimateRange(originalSize, quality)
        });

      } catch (err) {
        console.log('用户取消选择');
      }
    },

    // 计算估算范围
    calculateEstimateRange(originalSize: number, quality: number): { estimatedMin: number; estimatedMax: number } {
      // 根据质量给出合理的估算范围
      // 最小值：质量系数 × 0.5（理想情况）
      // 最大值：质量系数 × 1.2（复杂图片）
      const factor = quality / 100;
      const estimatedMin = Math.round(originalSize * factor * 0.5);
      const estimatedMax = Math.round(originalSize * factor * 1.2);
      return { estimatedMin, estimatedMax };
    },

    // 快速预设点击
    onPresetTap(e: WechatMiniprogram.TouchEvent) {
      const quality = parseInt(e.currentTarget.dataset.quality);
      this.setData({
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    // 质量滑块变化（拖动中）
    onQualityChanging(e: WechatMiniprogram.SliderChange) {
      const quality = e.detail.value;
      this.setData({
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    // 质量滑块变化（拖动结束）
    onQualityChange(e: WechatMiniprogram.SliderChange) {
      const quality = e.detail.value;
      this.setData({
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    // 预览图片
    previewImage() {
      wx.previewImage({
        urls: [this.data.compressedPath || this.data.imagePath],
        current: this.data.compressedPath || this.data.imagePath
      });
    },

    // 开始压缩
    async startCompress() {
      if (!this.data.hasImage) {
        wx.showToast({ title: '请先选择图片', icon: 'none' });
        return;
      }

      this.setData({ isProcessing: true });

      try {
        // 获取canvas节点
        const query = this.createSelectorQuery();
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#compressCanvas').fields({ node: true, size: true }).exec((res) => {
            resolve(res[0].node);
          });
        });

        const ctx = canvasNode.getContext('2d');

        // 设置canvas尺寸
        canvasNode.width = this.data.originalWidth;
        canvasNode.height = this.data.originalHeight;

        // 创建图片对象
        const image = canvasNode.createImage();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = this.data.imagePath;
        });

        // 绘制图片
        ctx.drawImage(image, 0, 0, this.data.originalWidth, this.data.originalHeight);

        // 导出压缩后的图片
        const tempFilePath = await new Promise<string>((resolve) => {
          wx.canvasToTempFilePath({
            canvas: canvasNode,
            quality: this.data.quality / 100,
            fileType: 'jpg',
            success: (res) => resolve(res.tempFilePath)
          });
        });

        // 获取压缩后文件大小
        const fileInfo = await wx.getFileInfo({
          filePath: tempFilePath
        });

        const compressedSize = Math.round(fileInfo.size / 1024);
        const savedPercent = Math.round((this.data.originalSize - compressedSize) / this.data.originalSize * 100);

        this.setData({
          compressedPath: tempFilePath,
          compressedSize,
          savedPercent: savedPercent > 0 ? savedPercent : 0,
          isProcessing: false
        });

        // 保存到历史记录
        this.saveToHistory();

        // 更新使用统计
        this.updateUsageStats();

        // 显示成功提示
        wx.showToast({
          title: savedPercent > 0 ? `节省 ${savedPercent}%` : '压缩完成',
          icon: 'success'
        });

      } catch (err) {
        console.error('压缩失败:', err);
        wx.showToast({ title: '压缩失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
    },

    // 重新压缩
    resetCompress() {
      const quality = 60;
      this.setData({
        compressedPath: '',
        compressedSize: 0,
        savedPercent: 0,
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    // 保存到历史记录
    saveToHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      history.unshift({
        id: Date.now().toString(),
        type: 'compress',
        typeName: '图片压缩',
        originalPath: this.data.imagePath,
        resultPath: this.data.compressedPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          quality: this.data.quality,
          originalSize: this.data.originalSize,
          compressedSize: this.data.compressedSize
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
      if (this.data.originalSize > this.data.compressedSize) {
        stats.savedSpace += (this.data.originalSize - this.data.compressedSize);
      }

      wx.setStorageSync('usageStats', stats);
    },

    // 保存到相册
    async saveToAlbum() {
      if (!this.data.compressedPath) return;

      try {
        await wx.saveImageToPhotosAlbum({
          filePath: this.data.compressedPath
        });
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      } catch (err) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  }
});
