// watermark.ts
// 添加水印页面

Component({
  data: {
    // 图片信息
    imagePath: '',
    watermarkedPath: '',
    imageWidth: 0,
    imageHeight: 0,

    // 水印设置
    watermarkType: 'text' as 'text' | 'image',
    watermarkText: '秋云轻图',
    watermarkImage: '',

    // 文字水印样式
    fontSize: 40,
    fontColor: '#ffffff',
    opacity: 50,
    rotation: 0,

    // 位置
    position: 'bottomRight' as 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | 'tile',

    // 预设颜色
    colorList: ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],

    // 状态
    isProcessing: false,
    hasImage: false
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

          // 获取图片尺寸
          wx.getImageInfo({
            src: tempFilePath,
            success: (imageInfo) => {
              this.setData({
                imagePath: tempFilePath,
                imageWidth: imageInfo.width,
                imageHeight: imageInfo.height,
                hasImage: true,
                watermarkedPath: tempFilePath
              }, () => {
                // 如果有水印设置，重新应用
                if (this.data.watermarkText || this.data.watermarkImage) {
                  this.applyWatermark();
                }
              });
            }
          });
        }
      });
    },

    // 选择水印图片
    chooseWatermarkImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res) => {
          this.setData({
            watermarkImage: res.tempFiles[0].tempFilePath
          }, () => {
            this.applyWatermark();
          });
        }
      });
    },

    // 切换水印类型
    onTypeChange(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type as 'text' | 'image';
      this.setData({ watermarkType: type }, () => {
        this.applyWatermark();
      });
    },

    // 文字输入
    onTextInput(e: WechatMiniprogram.Input) {
      this.setData({ watermarkText: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    // 字体大小变化
    onFontSizeChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ fontSize: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    // 透明度变化
    onOpacityChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ opacity: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    // 旋转角度变化
    onRotationChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ rotation: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    // 选择颜色
    onColorSelect(e: WechatMiniprogram.TouchEvent) {
      const color = e.currentTarget.dataset.color;
      this.setData({ fontColor: color }, () => {
        this.applyWatermark();
      });
    },

    // 选择位置
    onPositionSelect(e: WechatMiniprogram.TouchEvent) {
      const position = e.currentTarget.dataset.position;
      this.setData({ position }, () => {
        this.applyWatermark();
      });
    },

    // 应用水印
    async applyWatermark() {
      if (!this.data.hasImage) return;

      // 文字水印检查
      if (this.data.watermarkType === 'text' && !this.data.watermarkText) {
        this.setData({ watermarkedPath: this.data.imagePath });
        return;
      }

      // 图片水印检查
      if (this.data.watermarkType === 'image' && !this.data.watermarkImage) {
        this.setData({ watermarkedPath: this.data.imagePath });
        return;
      }

      // 等待图片加载完成
      if (!this.data.imageWidth || !this.data.imageHeight) {
        return;
      }

      this.setData({ isProcessing: true });

      try {
        // 获取canvas节点
        const query = this.createSelectorQuery();
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#watermarkCanvas').fields({ node: true, size: true }).exec((res) => {
            resolve(res[0].node);
          });
        });

        const ctx = canvasNode.getContext('2d');

        // 设置canvas尺寸
        canvasNode.width = this.data.imageWidth;
        canvasNode.height = this.data.imageHeight;

        // 绘制原图
        const image = canvasNode.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = this.data.imagePath;
        });
        ctx.drawImage(image, 0, 0, this.data.imageWidth, this.data.imageHeight);

        // 应用水印
        if (this.data.watermarkType === 'text') {
          await this.drawTextWatermark(ctx, canvasNode);
        } else {
          await this.drawImageWatermark(ctx, canvasNode);
        }

        // 导出图片
        const tempFilePath = await new Promise<string>((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas: canvasNode,
            fileType: 'jpg',
            quality: 0.92,
            success: (res) => resolve(res.tempFilePath),
            fail: (err) => reject(err)
          });
        });

        this.setData({
          watermarkedPath: tempFilePath,
          isProcessing: false
        });

      } catch (err) {
        console.error('水印应用失败:', err);
        wx.showToast({ title: '水印应用失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
    },

    // 绘制文字水印
    async drawTextWatermark(ctx: WechatMiniprogram.CanvasContext, canvasNode: WechatMiniprogram.Canvas) {
      const { watermarkText, fontSize, fontColor, opacity, rotation, position, imageWidth, imageHeight } = this.data;

      ctx.save();

      // 设置字体和样式
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = fontColor;
      ctx.globalAlpha = opacity / 100;

      // 测量文字尺寸
      const metrics = ctx.measureText(watermarkText);
      const textWidth = metrics.width;
      const textHeight = fontSize;

      // 平铺模式
      if (position === 'tile') {
        const gapX = textWidth + 50;
        const gapY = textHeight + 50;

        for (let y = 0; y < imageHeight + gapY; y += gapY) {
          for (let x = 0; x < imageWidth + gapX; x += gapX) {
            ctx.save();
            ctx.translate(x + textWidth / 2, y + textHeight / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillText(watermarkText, -textWidth / 2, textHeight / 4);
            ctx.restore();
          }
        }
      } else {
        // 单点位置
        let x = 0, y = 0;
        const padding = 30;

        switch (position) {
          case 'topLeft':
            x = padding;
            y = padding + textHeight;
            break;
          case 'topRight':
            x = imageWidth - textWidth - padding;
            y = padding + textHeight;
            break;
          case 'bottomLeft':
            x = padding;
            y = imageHeight - padding;
            break;
          case 'bottomRight':
            x = imageWidth - textWidth - padding;
            y = imageHeight - padding;
            break;
          case 'center':
            x = (imageWidth - textWidth) / 2;
            y = imageHeight / 2 + textHeight / 4;
            break;
        }

        ctx.translate(x + textWidth / 2, y - textHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillText(watermarkText, -textWidth / 2, textHeight / 4);
      }

      ctx.restore();
    },

    // 绘制图片水印
    async drawImageWatermark(ctx: WechatMiniprogram.CanvasContext, canvasNode: WechatMiniprogram.Canvas) {
      const { watermarkImage, opacity, position, imageWidth, imageHeight } = this.data;

      // 加载水印图片
      const watermarkImg = canvasNode.createImage();
      await new Promise<void>((resolve, reject) => {
        watermarkImg.onload = () => resolve();
        watermarkImg.onerror = reject;
        watermarkImg.src = watermarkImage;
      });

      ctx.save();

      // 计算水印尺寸（最大为原图的1/4）
      const maxWidth = imageWidth / 4;
      const maxHeight = imageHeight / 4;
      let watermarkWidth = watermarkImg.width;
      let watermarkHeight = watermarkImg.height;

      if (watermarkWidth > maxWidth) {
        const ratio = maxWidth / watermarkWidth;
        watermarkWidth = maxWidth;
        watermarkHeight = watermarkHeight * ratio;
      }
      if (watermarkHeight > maxHeight) {
        const ratio = maxHeight / watermarkHeight;
        watermarkHeight = maxHeight;
        watermarkWidth = watermarkWidth * ratio;
      }

      ctx.globalAlpha = opacity / 100;

      // 计算位置
      let x = 0, y = 0;
      const padding = 30;

      switch (position) {
        case 'topLeft':
          x = padding;
          y = padding;
          break;
        case 'topRight':
          x = imageWidth - watermarkWidth - padding;
          y = padding;
          break;
        case 'bottomLeft':
          x = padding;
          y = imageHeight - watermarkHeight - padding;
          break;
        case 'bottomRight':
          x = imageWidth - watermarkWidth - padding;
          y = imageHeight - watermarkHeight - padding;
          break;
        case 'center':
          x = (imageWidth - watermarkWidth) / 2;
          y = (imageHeight - watermarkHeight) / 2;
          break;
        case 'tile':
          // 平铺模式
          const gapX = watermarkWidth + 50;
          const gapY = watermarkHeight + 50;
          for (let ty = 0; ty < imageHeight + gapY; ty += gapY) {
            for (let tx = 0; tx < imageWidth + gapX; tx += gapX) {
              ctx.drawImage(watermarkImg as any, tx, ty, watermarkWidth, watermarkHeight);
            }
          }
          ctx.restore();
          return;
      }

      ctx.drawImage(watermarkImg as any, x, y, watermarkWidth, watermarkHeight);
      ctx.restore();
    },

    // 预览图片
    previewImage() {
      wx.previewImage({
        urls: [this.data.watermarkedPath],
        current: this.data.watermarkedPath
      });
    },

    // 保存到相册
    async saveToAlbum() {
      if (!this.data.watermarkedPath) return;

      try {
        await wx.saveImageToPhotosAlbum({
          filePath: this.data.watermarkedPath
        });
        wx.showToast({ title: '已保存到相册', icon: 'success' });
        this.saveToHistory();
      } catch (err) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    },

    // 保存到历史记录
    saveToHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      history.unshift({
        id: Date.now().toString(),
        type: 'watermark',
        typeName: '添加水印',
        originalPath: this.data.imagePath,
        resultPath: this.data.watermarkedPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          watermarkType: this.data.watermarkType,
          watermarkText: this.data.watermarkText,
          position: this.data.position,
          opacity: this.data.opacity
        }
      });
      wx.setStorageSync('processHistory', history.slice(0, 20));
    }
  }
});
