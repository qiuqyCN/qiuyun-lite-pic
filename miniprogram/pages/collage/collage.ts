// collage.ts
// 拼图拼接页面

Component({
  data: {
    // 图片列表
    images: [] as string[],
    imageInfos: [] as { width: number; height: number }[],

    // 布局模板
    layoutTemplates: [
      { id: 'grid2', name: '双格', icon: '⬛⬛', cols: 2, rows: 1, maxImages: 9 },
      { id: 'grid3', name: '三格', icon: '⬛⬛⬛', cols: 3, rows: 1, maxImages: 9 },
      { id: 'grid4', name: '四宫格', icon: '⬛⬛\n⬛⬛', cols: 2, rows: 2, maxImages: 9 },
      { id: 'grid6', name: '六宫格', icon: '⬛⬛⬛\n⬛⬛⬛', cols: 3, rows: 2, maxImages: 9 },
      { id: 'grid9', name: '九宫格', icon: '⬛⬛⬛\n⬛⬛⬛\n⬛⬛⬛', cols: 3, rows: 3, maxImages: 9 },
      { id: 'horizontal', name: '横向拼接', icon: '➡️', cols: 1, rows: 1, maxImages: 9, mode: 'horizontal' },
      { id: 'vertical', name: '纵向拼接', icon: '⬇️', cols: 1, rows: 1, maxImages: 9, mode: 'vertical' }
    ],

    // 当前布局
    currentLayout: { id: 'grid4', name: '四宫格', cols: 2, rows: 2, maxImages: 9, mode: 'grid' } as LayoutTemplate,

    // 间距设置
    spacing: 10,
    borderRadius: 0,
    backgroundColor: '#ffffff',

    // 预设颜色
    colorList: ['#ffffff', '#000000', '#f5f5f7', '#ffe8e8', '#e8f5ff', '#fff8e8', '#f0ffe8', '#f8e8ff'],

    // 输出设置
    outputWidth: 1200,
    outputQuality: 90,

    // 状态
    isProcessing: false,
    hasImages: false,
    resultPath: '',
    showPreview: false
  },

  methods: {
    // 选择图片
    chooseImages() {
      const maxCount = this.data.currentLayout.maxImages;
      wx.chooseMedia({
        count: maxCount,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = res.tempFiles.map(file => file.tempFilePath);
          this.loadImageInfos(newImages);
        }
      });
    },

    // 添加图片
    addImages() {
      const currentCount = this.data.images.length;
      const maxCount = this.data.currentLayout.maxImages;
      const remaining = maxCount - currentCount;

      if (remaining <= 0) {
        wx.showToast({ title: '已达最大数量', icon: 'none' });
        return;
      }

      wx.chooseMedia({
        count: remaining,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = res.tempFiles.map(file => file.tempFilePath);
          this.loadImageInfos([...this.data.images, ...newImages]);
        }
      });
    },

    // 加载图片信息
    async loadImageInfos(imagePaths: string[]) {
      const infos: { width: number; height: number }[] = [];

      for (const path of imagePaths) {
        try {
          const info = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            wx.getImageInfo({
              src: path,
              success: (res) => resolve({ width: res.width, height: res.height }),
              fail: reject
            });
          });
          infos.push(info);
        } catch (err) {
          infos.push({ width: 100, height: 100 });
        }
      }

      this.setData({
        images: imagePaths,
        imageInfos: infos,
        hasImages: imagePaths.length > 0,
        resultPath: '',
        showPreview: false
      }, () => {
        if (imagePaths.length > 0) {
          this.generateCollage();
        }
      });
    },

    // 删除图片
    removeImage(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index;
      const images = [...this.data.images];
      const imageInfos = [...this.data.imageInfos];
      images.splice(index, 1);
      imageInfos.splice(index, 1);

      this.setData({
        images,
        imageInfos,
        hasImages: images.length > 0,
        resultPath: '',
        showPreview: false
      }, () => {
        if (images.length > 0) {
          this.generateCollage();
        }
      });
    },

    // 更换图片
    replaceImage(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index;
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newPath = res.tempFiles[0].tempFilePath;
          wx.getImageInfo({
            src: newPath,
            success: (imageInfo) => {
              const images = [...this.data.images];
              const imageInfos = [...this.data.imageInfos];
              images[index] = newPath;
              imageInfos[index] = { width: imageInfo.width, height: imageInfo.height };

              this.setData({ images, imageInfos }, () => {
                this.generateCollage();
              });
            }
          });
        }
      });
    },

    // 选择布局
    onLayoutSelect(e: WechatMiniprogram.TouchEvent) {
      const layoutId = e.currentTarget.dataset.id;
      const template = this.data.layoutTemplates.find(t => t.id === layoutId);
      if (!template) return;

      const layout: LayoutTemplate = {
        id: template.id,
        name: template.name,
        cols: template.cols,
        rows: template.rows,
        maxImages: template.maxImages,
        mode: (template.mode || 'grid') as 'grid' | 'horizontal' | 'vertical'
      };

      // 如果当前图片数量超过新布局的最大数量，裁剪图片
      let images = [...this.data.images];
      let imageInfos = [...this.data.imageInfos];
      if (images.length > layout.maxImages) {
        images = images.slice(0, layout.maxImages);
        imageInfos = imageInfos.slice(0, layout.maxImages);
      }

      this.setData({
        currentLayout: layout,
        images,
        imageInfos,
        resultPath: '',
        showPreview: false
      }, () => {
        if (images.length > 0) {
          this.generateCollage();
        }
      });
    },

    // 间距变化
    onSpacingChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ spacing: e.detail.value }, () => {
        if (this.data.hasImages) {
          this.generateCollage();
        }
      });
    },

    // 圆角变化
    onRadiusChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ borderRadius: e.detail.value }, () => {
        if (this.data.hasImages) {
          this.generateCollage();
        }
      });
    },

    // 选择背景色
    onColorSelect(e: WechatMiniprogram.TouchEvent) {
      const color = e.currentTarget.dataset.color;
      this.setData({ backgroundColor: color }, () => {
        if (this.data.hasImages) {
          this.generateCollage();
        }
      });
    },

    // 输出宽度变化
    onWidthChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ outputWidth: e.detail.value });
    },

    // 画质变化
    onQualityChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ outputQuality: e.detail.value });
    },

    // 生成拼图
    async generateCollage() {
      if (this.data.images.length === 0) return;

      this.setData({ isProcessing: true });

      try {
        const { images, imageInfos, currentLayout, spacing, borderRadius, backgroundColor, outputWidth } = this.data;

        // 获取canvas节点
        const query = this.createSelectorQuery();
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#collageCanvas').fields({ node: true, size: true }).exec((res) => {
            resolve(res[0].node);
          });
        });

        const ctx = canvasNode.getContext('2d');

        // 计算输出尺寸
        let canvasWidth: number, canvasHeight: number;

        if (currentLayout.mode === 'horizontal') {
          // 横向拼接
          const totalSpacing = spacing * (images.length - 1);
          const availableWidth = outputWidth - totalSpacing;
          let totalAspectRatio = 0;

          for (let i = 0; i < images.length; i++) {
            const info = imageInfos[i] || { width: 100, height: 100 };
            totalAspectRatio += info.width / info.height;
          }

          const cellHeight = Math.floor(availableWidth / totalAspectRatio);
          canvasWidth = outputWidth;
          canvasHeight = cellHeight;

          canvasNode.width = canvasWidth;
          canvasNode.height = canvasHeight;

          // 填充背景
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 绘制图片
          let currentX = 0;
          for (let i = 0; i < images.length; i++) {
            const info = imageInfos[i] || { width: 100, height: 100 };
            const cellWidth = Math.floor((info.width / info.height) * cellHeight);

            await this.drawImageToCanvas(ctx, canvasNode, images[i], currentX, 0, cellWidth, cellHeight, borderRadius);
            currentX += cellWidth + spacing;
          }

        } else if (currentLayout.mode === 'vertical') {
          // 纵向拼接
          const totalSpacing = spacing * (images.length - 1);

          let totalHeight = 0;
          const cellWidths: number[] = [];
          const cellHeights: number[] = [];

          for (let i = 0; i < images.length; i++) {
            const info = imageInfos[i] || { width: 100, height: 100 };
            const aspectRatio = info.height / info.width;
            const cellWidth = outputWidth;
            const cellHeight = Math.floor(cellWidth * aspectRatio);
            cellWidths.push(cellWidth);
            cellHeights.push(cellHeight);
            totalHeight += cellHeight;
          }

          canvasWidth = outputWidth;
          canvasHeight = totalHeight + totalSpacing;

          canvasNode.width = canvasWidth;
          canvasNode.height = canvasHeight;

          // 填充背景
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 绘制图片
          let currentY = 0;
          for (let i = 0; i < images.length; i++) {
            await this.drawImageToCanvas(ctx, canvasNode, images[i], 0, currentY, cellWidths[i], cellHeights[i], borderRadius);
            currentY += cellHeights[i] + spacing;
          }

        } else {
          // 网格布局 - 动态计算行数
          const cols = currentLayout.cols;
          const rows = Math.ceil(images.length / cols); // 根据图片数量动态计算行数
          const totalHSpacing = spacing * (cols - 1);
          const totalVSpacing = spacing * (rows - 1);

          const cellWidth = Math.floor((outputWidth - totalHSpacing) / cols);
          const cellHeight = cellWidth; // 正方形单元格

          canvasWidth = outputWidth;
          canvasHeight = rows * cellHeight + totalVSpacing;

          canvasNode.width = canvasWidth;
          canvasNode.height = canvasHeight;

          // 填充背景
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 绘制图片
          for (let i = 0; i < images.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * (cellWidth + spacing);
            const y = row * (cellHeight + spacing);

            await this.drawImageToCanvas(ctx, canvasNode, images[i], x, y, cellWidth, cellHeight, borderRadius);
          }
        }

        // 导出图片
        const tempFilePath = await new Promise<string>((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas: canvasNode,
            fileType: 'jpg',
            quality: this.data.outputQuality / 100,
            success: (res) => resolve(res.tempFilePath),
            fail: (err) => reject(err)
          });
        });

        this.setData({
          resultPath: tempFilePath,
          isProcessing: false,
          showPreview: true
        });

      } catch (err) {
        console.error('拼图生成失败:', err);
        wx.showToast({ title: '拼图生成失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
    },

    // 绘制图片到canvas（支持圆角）
    async drawImageToCanvas(
      ctx: WechatMiniprogram.CanvasContext,
      canvasNode: WechatMiniprogram.Canvas,
      imagePath: string,
      x: number,
      y: number,
      width: number,
      height: number,
      borderRadius: number
    ) {
      // 加载图片
      const image = canvasNode.createImage();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imagePath;
      });

      ctx.save();

      // 创建圆角裁剪路径
      if (borderRadius > 0) {
        ctx.beginPath();
        ctx.moveTo(x + borderRadius, y);
        ctx.lineTo(x + width - borderRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
        ctx.lineTo(x + width, y + height - borderRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
        ctx.lineTo(x + borderRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
        ctx.lineTo(x, y + borderRadius);
        ctx.quadraticCurveTo(x, y, x + borderRadius, y);
        ctx.closePath();
        ctx.clip();
      }

      // 计算图片绘制区域（保持比例裁剪填充）
      const imgAspect = image.width / image.height;
      const cellAspect = width / height;

      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      if (imgAspect > cellAspect) {
        // 图片更宽，以高度为基准
        drawHeight = height;
        drawWidth = height * imgAspect;
        drawX = x - (drawWidth - width) / 2;
        drawY = y;
      } else {
        // 图片更高，以宽度为基准
        drawWidth = width;
        drawHeight = width / imgAspect;
        drawX = x;
        drawY = y - (drawHeight - height) / 2;
      }

      ctx.drawImage(image as any, drawX, drawY, drawWidth, drawHeight);

      ctx.restore();
    },

    // 预览图片
    previewImage() {
      if (!this.data.resultPath) return;
      wx.previewImage({
        urls: [this.data.resultPath],
        current: this.data.resultPath
      });
    },

    // 保存到相册
    async saveToAlbum() {
      if (!this.data.resultPath) return;

      try {
        await wx.saveImageToPhotosAlbum({
          filePath: this.data.resultPath
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
        type: 'collage',
        typeName: '拼图拼接',
        originalPath: this.data.images[0],
        resultPath: this.data.resultPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          layout: this.data.currentLayout.name,
          imageCount: this.data.images.length,
          spacing: this.data.spacing
        }
      });
      wx.setStorageSync('processHistory', history.slice(0, 20));
    }
  }
});

// 布局模板类型
interface LayoutTemplate {
  id: string;
  name: string;
  cols: number;
  rows: number;
  maxImages: number;
  mode: 'grid' | 'horizontal' | 'vertical';
}
