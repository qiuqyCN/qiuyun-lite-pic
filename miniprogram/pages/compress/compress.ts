// compress.ts
// 图片压缩页面

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
    quality: 80,
    targetSize: 0, // KB, 0表示不限制
    
    // 状态
    isProcessing: false,
    hasImage: false,
    showResult: false,
    progress: 0
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

        this.setData({
          imagePath: tempFilePath,
          originalSize: Math.round(fileSize / 1024), // KB
          originalWidth: imageInfo.width,
          originalHeight: imageInfo.height,
          hasImage: true,
          showResult: false,
          compressedPath: '',
          compressedSize: 0
        });

      } catch (err) {
        console.log('用户取消选择');
      }
    },

    // 质量滑块变化
    onQualityChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ quality: e.detail.value });
    },

    // 目标大小输入
    onTargetSizeInput(e: WechatMiniprogram.Input) {
      const value = parseInt(e.detail.value) || 0;
      this.setData({ targetSize: value });
    },

    // 开始压缩
    async startCompress() {
      if (!this.data.hasImage) {
        wx.showToast({ title: '请先选择图片', icon: 'none' });
        return;
      }

      this.setData({ isProcessing: true, progress: 0 });

      try {
        // 创建canvas上下文
        const query = this.createSelectorQuery();
        const canvasCtx = await new Promise<WechatMiniprogram.CanvasContext>((resolve) => {
          query.select('#compressCanvas').fields({ node: true, size: true }).exec((res) => {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            resolve(ctx as any);
          });
        });

        // 获取canvas节点
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#compressCanvas').fields({ node: true, size: true }).exec((res) => {
            resolve(res[0].node);
          });
        });

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
        canvasCtx.drawImage(image, 0, 0, this.data.originalWidth, this.data.originalHeight);

        this.setData({ progress: 50 });

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

        this.setData({
          compressedPath: tempFilePath,
          compressedSize: Math.round(fileInfo.size / 1024),
          isProcessing: false,
          showResult: true,
          progress: 100
        });

        // 保存到历史记录
        this.saveToHistory();

        // 更新使用统计
        this.updateUsageStats();

      } catch (err) {
        console.error('压缩失败:', err);
        wx.showToast({ title: '压缩失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
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
      stats.savedSpace += (this.data.originalSize - this.data.compressedSize);

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
    },

    // 分享图片
    onShareAppMessage() {
      if (this.data.compressedPath) {
        return {
          title: '我用秋云轻图压缩了图片',
          path: '/pages/index/index',
          imageUrl: this.data.compressedPath
        };
      }
      return {
        title: '秋云轻图 - 轻点之间，美图呈现',
        path: '/pages/index/index'
      };
    }
  }
});
