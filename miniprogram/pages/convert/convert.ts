// convert.ts
// 格式转换页面

Component({
  data: {
    // 图片信息
    imagePath: '',
    originalSize: 0,
    originalFormat: 'JPG',
    convertedPath: '',
    convertedSize: 0,
    convertedFormat: '',

    // 格式设置
    targetFormat: 'jpg' as 'jpg' | 'png',
    quality: 92,

    // 状态
    isProcessing: false,
    hasImage: false,

    // 支持的输出格式（Canvas只支持导出jpg/png）
    formatList: [
      { id: 'jpg', name: 'JPG', desc: '有损压缩，广泛兼容' },
      { id: 'png', name: 'PNG', desc: '无损压缩，支持透明' }
    ]
  },

  methods: {
    // 选择图片
    chooseImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          const fileSize = res.tempFiles[0].size;

          console.log('Selected file path:', tempFilePath);

          // 检测原图格式
          const detectedFormat = (this as any).detectFormat(tempFilePath);
          console.log('Detected format:', detectedFormat);

          // 设置原格式显示（大写）
          const originalFormat = detectedFormat.toUpperCase();

          // 默认目标格式
          let targetFormat: 'jpg' | 'png' = 'jpg';
          if (detectedFormat === 'jpg' || detectedFormat === 'jpeg') {
            targetFormat = 'png';
          } else if (detectedFormat === 'png') {
            targetFormat = 'jpg';
          } else {
            // gif/bmp/heic 等其他格式默认转为 jpg
            targetFormat = 'jpg';
          }

          this.setData({
            imagePath: tempFilePath,
            originalSize: Math.round(fileSize / 1024),
            originalFormat: originalFormat,
            hasImage: true,
            convertedPath: '',
            convertedSize: 0,
            convertedFormat: '',
            targetFormat: targetFormat,
            quality: 92
          }, () => {
            console.log('Set data complete - originalFormat:', this.data.originalFormat);
          });
        },
        fail: (err) => {
          console.log('选择图片失败或取消', err);
        }
      });
    },

    // 检测图片格式
    detectFormat(filePath: string): string {
      const path = filePath.toLowerCase();
      
      // 检查是否包含格式标识
      if (path.includes('.png')) return 'png';
      if (path.includes('.webp')) return 'webp';
      if (path.includes('.gif')) return 'gif';
      if (path.includes('.bmp')) return 'bmp';
      if (path.includes('.heic')) return 'heic';
      if (path.includes('.tiff') || path.includes('.tif')) return 'tiff';
      if (path.includes('.jpg') || path.includes('.jpeg')) return 'jpg';
      
      // 默认返回 jpg
      return 'jpg';
    },

    // 格式选择
    onFormatChange(e: WechatMiniprogram.TouchEvent) {
      const format = e.currentTarget.dataset.format;
      this.setData({ targetFormat: format });
    },

    // 质量滑块变化
    onQualityChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ quality: e.detail.value });
    },

    // 预览图片
    previewImage() {
      wx.previewImage({
        urls: [this.data.convertedPath || this.data.imagePath],
        current: this.data.convertedPath || this.data.imagePath
      });
    },

    // 开始转换
    async startConvert() {
      if (!this.data.hasImage) {
        wx.showToast({ title: '请先选择图片', icon: 'none' });
        return;
      }

      const { targetFormat, quality, originalFormat } = this.data;

      // 检查是否是相同格式
      const originalLower = originalFormat.toLowerCase();
      console.log('Converting from', originalLower, 'to', targetFormat);
      
      // 如果原格式不是jpg/png，允许转换为jpg
      const isSupportedOriginal = ['jpg', 'jpeg', 'png'].includes(originalLower);
      if (targetFormat === originalLower && isSupportedOriginal) {
        wx.showToast({ title: '目标格式与原格式相同', icon: 'none' });
        return;
      }

      this.setData({ isProcessing: true });

      try {
        // 获取canvas节点
        const query = this.createSelectorQuery();
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#convertCanvas').fields({ node: true, size: true }).exec((res) => {
            resolve(res[0].node);
          });
        });

        const ctx = canvasNode.getContext('2d');

        // 获取原图尺寸
        const imageInfo = await wx.getImageInfo({
          src: this.data.imagePath
        });

        // 设置canvas尺寸
        canvasNode.width = imageInfo.width;
        canvasNode.height = imageInfo.height;

        // 创建图片对象
        const image = canvasNode.createImage();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = this.data.imagePath;
        });

        // 绘制图片
        ctx.drawImage(image, 0, 0, imageInfo.width, imageInfo.height);

        // 导出转换后的图片
        // Canvas只支持导出jpg/png
        const exportQuality = targetFormat === 'png' ? 1 : quality / 100;
        
        console.log('Exporting with format:', targetFormat, 'quality:', exportQuality);
        
        const tempFilePath = await new Promise<string>((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas: canvasNode,
            fileType: targetFormat as 'jpg' | 'png',
            quality: exportQuality,
            success: (res) => {
              console.log('Export success:', res.tempFilePath);
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error('Export failed:', err);
              reject(err);
            }
          });
        });

        // 获取转换后文件大小
        const fileInfo = await wx.getFileInfo({
          filePath: tempFilePath
        });

        const newConvertedFormat = targetFormat.toUpperCase();
        console.log('Setting convertedFormat to:', newConvertedFormat);
        
        this.setData({
          convertedPath: tempFilePath,
          convertedSize: Math.round(fileInfo.size / 1024),
          convertedFormat: newConvertedFormat,
          isProcessing: false
        }, () => {
          console.log('Convert complete - convertedFormat:', this.data.convertedFormat);
        });

        // 保存到历史记录
        this.saveToHistory();

        // 更新使用统计
        this.updateUsageStats();

        wx.showToast({
          title: '转换完成',
          icon: 'success'
        });

      } catch (err) {
        console.error('转换失败:', err);
        wx.showToast({ title: '转换失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
    },

    // 重新转换
    resetConvert() {
      this.setData({
        convertedPath: '',
        convertedSize: 0,
        convertedFormat: ''
      });
    },

    // 保存到历史记录
    saveToHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      history.unshift({
        id: Date.now().toString(),
        type: 'convert',
        typeName: '格式转换',
        originalPath: this.data.imagePath,
        resultPath: this.data.convertedPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          originalFormat: this.data.originalFormat,
          convertedFormat: this.data.convertedFormat,
          originalSize: this.data.originalSize,
          convertedSize: this.data.convertedSize,
          quality: this.data.quality
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
      if (!this.data.convertedPath) return;

      console.log('Saving to album:', this.data.convertedPath);
      console.log('Expected format:', this.data.convertedFormat);

      try {
        await wx.saveImageToPhotosAlbum({
          filePath: this.data.convertedPath
        });
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      } catch (err) {
        console.error('Save to album failed:', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  }
});
