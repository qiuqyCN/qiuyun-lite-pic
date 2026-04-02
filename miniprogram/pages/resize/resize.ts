// resize.ts
// 尺寸调整页面 - 优化版

Component({
  data: {
    // 图片信息
    imagePath: '',
    originalWidth: 0,
    originalHeight: 0,
    hasImage: false,

    // 预览相关
    previewPath: '',
    previewDisplayWidth: 280,
    previewDisplayHeight: 240,

    // 预设尺寸
    presetSizes: [
      { id: 'idcard', name: '身份证', width: 358, height: 441, category: '证件' },
      { id: 'oneinch', name: '一寸', width: 295, height: 413, category: '证件' },
      { id: 'smallone', name: '小一寸', width: 260, height: 378, category: '证件' },
      { id: 'bigone', name: '大一寸', width: 390, height: 567, category: '证件' },
      { id: 'twoinch', name: '二寸', width: 413, height: 626, category: '证件' },
      { id: 'smalltwo', name: '小二寸', width: 413, height: 531, category: '证件' },
      { id: 'cet', name: '英语四六级', width: 144, height: 192, category: '考试' },
      { id: 'computer', name: '计算机等级', width: 144, height: 192, category: '考试' },
      { id: 'mandarin', name: '普通话', width: 390, height: 567, category: '考试' },
      { id: 'teacher', name: '教师资格证', width: 295, height: 413, category: '考试' },
      { id: 'civil', name: '公务员', width: 295, height: 413, category: '考试' },
      { id: 'postgraduate', name: '研究生', width: 480, height: 640, category: '考试' },
      { id: 'social', name: '社保卡', width: 358, height: 441, category: '证件' },
      { id: 'passport', name: '护照', width: 390, height: 567, category: '证件' },
      { id: 'driving', name: '驾驶证', width: 260, height: 378, category: '证件' },
    ],
    selectedPreset: '',

    // 尺寸设置
    targetWidth: 0,
    targetHeight: 0,
    maintainAspectRatio: true,

    // 状态
    isProcessing: false,
    resultPath: '',
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

        // 获取图片信息
        const imageInfo = await wx.getImageInfo({
          src: tempFilePath
        });

        const originalWidth = imageInfo.width;
        const originalHeight = imageInfo.height;

        this.setData({
          imagePath: tempFilePath,
          originalWidth,
          originalHeight,
          hasImage: true,
          resultPath: '',
          selectedPreset: '',
          targetWidth: originalWidth,
          targetHeight: originalHeight,
        });

        // 生成预览
        this.generatePreview();

      } catch (err) {
        console.log('用户取消选择');
      }
    },

    // 选择预设尺寸
    onPresetSelect(e: WechatMiniprogram.TouchEvent) {
      const presetId = e.currentTarget.dataset.id;
      const preset = this.data.presetSizes.find(p => p.id === presetId);
      if (!preset) return;

      this.setData({
        selectedPreset: presetId,
        targetWidth: preset.width,
        targetHeight: preset.height,
        maintainAspectRatio: false,
      });

      this.generatePreview();
    },

    // 宽度输入变化
    onWidthInput(e: WechatMiniprogram.Input) {
      const value = parseInt(e.detail.value) || 0;
      const { originalWidth, originalHeight, maintainAspectRatio } = this.data;

      if (maintainAspectRatio && originalWidth > 0) {
        const ratio = value / originalWidth;
        const newHeight = Math.round(originalHeight * ratio);
        this.setData({
          targetWidth: value,
          targetHeight: newHeight,
          selectedPreset: '',
        });
      } else {
        this.setData({
          targetWidth: value,
          selectedPreset: '',
        });
      }

      this.generatePreview();
    },

    // 高度输入变化
    onHeightInput(e: WechatMiniprogram.Input) {
      const value = parseInt(e.detail.value) || 0;
      const { originalWidth, originalHeight, maintainAspectRatio } = this.data;

      if (maintainAspectRatio && originalHeight > 0) {
        const ratio = value / originalHeight;
        const newWidth = Math.round(originalWidth * ratio);
        this.setData({
          targetHeight: value,
          targetWidth: newWidth,
          selectedPreset: '',
        });
      } else {
        this.setData({
          targetHeight: value,
          selectedPreset: '',
        });
      }

      this.generatePreview();
    },

    // 锁定比例切换
    onAspectRatioChange(e: WechatMiniprogram.SwitchChange) {
      const maintainAspectRatio = e.detail.value;

      if (maintainAspectRatio) {
        const { originalWidth, originalHeight, targetWidth } = this.data;
        if (originalWidth > 0 && targetWidth > 0) {
          const ratio = targetWidth / originalWidth;
          const newHeight = Math.round(originalHeight * ratio);
          this.setData({
            maintainAspectRatio,
            targetHeight: newHeight,
          });
          this.generatePreview();
          return;
        }
      }

      this.setData({ maintainAspectRatio });
    },

    // 生成预览
    async generatePreview() {
      if (!this.data.hasImage) return;

      const { imagePath, originalWidth, originalHeight, targetWidth, targetHeight } = this.data;

      try {
        // 计算预览容器尺寸（限制最大显示尺寸）
        const maxContainerSize = 280;
        let containerWidth = targetWidth;
        let containerHeight = targetHeight;

        if (containerWidth > maxContainerSize || containerHeight > maxContainerSize) {
          if (containerWidth > containerHeight) {
            const scale = maxContainerSize / containerWidth;
            containerHeight = containerHeight * scale;
            containerWidth = maxContainerSize;
          } else {
            const scale = maxContainerSize / containerHeight;
            containerWidth = containerWidth * scale;
            containerHeight = maxContainerSize;
          }
        }

        // 计算图片在容器中 aspectFit 后的实际显示尺寸
        const containerAspect = containerWidth / containerHeight;
        const imageAspect = originalWidth / originalHeight;

        let imageDisplayWidth, imageDisplayHeight;

        if (imageAspect > containerAspect) {
          // 图片更宽，以容器宽度为基准，高度会有留白
          imageDisplayWidth = containerWidth;
          imageDisplayHeight = imageDisplayWidth / imageAspect;
        } else {
          // 图片更高，以容器高度为基准，宽度会有留白
          imageDisplayHeight = containerHeight;
          imageDisplayWidth = imageDisplayHeight * imageAspect;
        }

        // 获取canvas节点
        const query = this.createSelectorQuery();
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#previewCanvas').fields({ node: true, size: true }).exec((res) => {
            resolve(res[0].node);
          });
        });

        const ctx = canvasNode.getContext('2d');

        // Canvas 尺寸与图片显示尺寸一致，不要有灰色背景
        canvasNode.width = imageDisplayWidth;
        canvasNode.height = imageDisplayHeight;

        // 创建图片对象
        const image = canvasNode.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        // 直接绘制图片，填满整个 Canvas，不要有背景
        ctx.drawImage(image, 0, 0, imageDisplayWidth, imageDisplayHeight);

        // 导出预览图
        const tempFilePath = await new Promise<string>((resolve) => {
          wx.canvasToTempFilePath({
            canvas: canvasNode,
            quality: 0.8,
            fileType: 'jpg',
            success: (res) => resolve(res.tempFilePath)
          });
        });

        this.setData({
          previewPath: tempFilePath,
          previewDisplayWidth: Math.round(imageDisplayWidth),
          previewDisplayHeight: Math.round(imageDisplayHeight),
        });

      } catch (err) {
        console.error('预览生成失败:', err);
      }
    },

    // 确认调整
    async confirmResize() {
      if (!this.data.hasImage) {
        wx.showToast({ title: '请先选择图片', icon: 'none' });
        return;
      }

      const { targetWidth, targetHeight } = this.data;
      if (targetWidth <= 0 || targetHeight <= 0) {
        wx.showToast({ title: '尺寸必须大于0', icon: 'none' });
        return;
      }

      if (targetWidth > 8192 || targetHeight > 8192) {
        wx.showToast({ title: '尺寸不能超过8192px', icon: 'none' });
        return;
      }

      this.setData({ isProcessing: true });

      try {
        const resultPath = await this.generateResultImage();

        this.setData({
          resultPath,
          isProcessing: false,
        });

        this.saveToHistory();
        wx.showToast({ title: '调整完成', icon: 'success' });

      } catch (err) {
        console.error('调整失败:', err);
        wx.showToast({ title: '调整失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
    },

    // 生成结果图片
    async generateResultImage(): Promise<string> {
      const { imagePath, targetWidth, targetHeight } = this.data;

      // 获取canvas节点
      const query = this.createSelectorQuery();
      const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
        query.select('#resizeCanvas').fields({ node: true, size: true }).exec((res) => {
          resolve(res[0].node);
        });
      });

      const ctx = canvasNode.getContext('2d');

      // 设置canvas尺寸
      canvasNode.width = targetWidth;
      canvasNode.height = targetHeight;

      // 创建图片对象
      const image = canvasNode.createImage();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imagePath;
      });

      // 清空画布（白色背景）
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 计算绘制参数（居中裁剪填充）
      const targetAspect = targetWidth / targetHeight;
      const imageAspect = image.width / image.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imageAspect > targetAspect) {
        // 图片更宽，以高度为基准
        drawHeight = targetHeight;
        drawWidth = drawHeight * imageAspect;
        drawX = (targetWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        // 图片更高，以宽度为基准
        drawWidth = targetWidth;
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = (targetHeight - drawHeight) / 2;
      }

      // 绘制图片
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      // 导出图片
      return await new Promise<string>((resolve) => {
        wx.canvasToTempFilePath({
          canvas: canvasNode,
          quality: 0.95,
          fileType: 'jpg',
          success: (res) => resolve(res.tempFilePath)
        });
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
      } catch (err) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    },

    // 保存到历史记录
    saveToHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      history.unshift({
        id: Date.now().toString(),
        type: 'resize',
        typeName: '尺寸调整',
        originalPath: this.data.imagePath,
        resultPath: this.data.resultPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          originalWidth: this.data.originalWidth,
          originalHeight: this.data.originalHeight,
          targetWidth: this.data.targetWidth,
          targetHeight: this.data.targetHeight,
        }
      });
      wx.setStorageSync('processHistory', history.slice(0, 20));
    },
  }
});
