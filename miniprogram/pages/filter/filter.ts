// filter.ts
// 滤镜美化页面

Component({
  data: {
    // 图片信息
    imagePath: '',
    filteredPath: '',
    imageWidth: 0,
    imageHeight: 0,

    // 滤镜列表
    filterList: [
      { id: 'none', name: '原图', icon: '✨' },
      { id: 'grayscale', name: '黑白', icon: '⚫' },
      { id: 'sepia', name: '复古', icon: '📷' },
      { id: 'brightness', name: '明亮', icon: '☀️' },
      { id: 'contrast', name: '高对比', icon: '🎭' },
      { id: 'blur', name: '模糊', icon: '💫' },
      { id: 'warm', name: '暖色', icon: '🔥' },
      { id: 'cool', name: '冷色', icon: '❄️' },
      { id: 'vintage', name: '胶片', icon: '🎞️' }
    ],

    // 当前选中的滤镜
    currentFilter: 'none',

    // 滤镜强度
    filterIntensity: 100,

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
                filteredPath: tempFilePath,
                imageWidth: imageInfo.width,
                imageHeight: imageInfo.height,
                hasImage: true,
                currentFilter: 'none',
                filterIntensity: 100
              });
            }
          });
        }
      });
    },

    // 选择滤镜
    onFilterTap(e: WechatMiniprogram.TouchEvent) {
      const filterId = e.currentTarget.dataset.id;
      this.setData({ currentFilter: filterId });
      this.applyFilter(filterId, this.data.filterIntensity);
    },

    // 强度滑块变化
    onIntensityChange(e: WechatMiniprogram.SliderChange) {
      const intensity = e.detail.value;
      this.setData({ filterIntensity: intensity });
      this.applyFilter(this.data.currentFilter, intensity);
    },

    // 应用滤镜
    async applyFilter(filterType: string, intensity: number) {
      if (!this.data.hasImage || filterType === 'none') {
        if (filterType === 'none') {
          this.setData({ filteredPath: this.data.imagePath });
        }
        return;
      }

      this.setData({ isProcessing: true });

      try {
        // 获取canvas节点
        const query = this.createSelectorQuery();
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve, reject) => {
          query.select('#filterCanvas').fields({ node: true, size: true }).exec((res) => {
            if (!res || !res[0] || !res[0].node) {
              reject(new Error('Canvas节点获取失败'));
              return;
            }
            resolve(res[0].node);
          });
        });

        const ctx = canvasNode.getContext('2d');
        if (!ctx) {
          throw new Error('CanvasContext获取失败');
        }

        const { imageWidth, imageHeight, imagePath } = this.data;

        // 限制处理尺寸，提高性能
        const maxSize = 800; // 降低最大尺寸以提高兼容性
        let canvasWidth = imageWidth;
        let canvasHeight = imageHeight;

        if (canvasWidth > maxSize || canvasHeight > maxSize) {
          if (canvasWidth > canvasHeight) {
            canvasHeight = Math.floor((canvasHeight * maxSize) / canvasWidth);
            canvasWidth = maxSize;
          } else {
            canvasWidth = Math.floor((canvasWidth * maxSize) / canvasHeight);
            canvasHeight = maxSize;
          }
        }

        console.log('Canvas尺寸:', canvasWidth, 'x', canvasHeight);

        // 设置canvas尺寸
        canvasNode.width = canvasWidth;
        canvasNode.height = canvasHeight;

        // 创建图片对象
        const image = canvasNode.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => {
            console.log('图片加载成功');
            resolve();
          };
          image.onerror = (err) => {
            console.error('图片加载失败:', err);
            reject(new Error('图片加载失败'));
          };
          image.src = imagePath;
        });

        // 清除画布
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 直接使用像素级处理（兼容性更好）
        const intensityRatio = intensity / 100;
        
        console.log('开始绘制图片');
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        console.log('图片绘制完成');

        // 应用像素级滤镜
        if (filterType !== 'none' && filterType !== 'blur') {
          console.log('开始应用像素滤镜:', filterType);
          await this.applyPixelFilter(ctx, canvasWidth, canvasHeight, filterType, intensityRatio);
          console.log('像素滤镜应用完成');
        }

        // 导出处理后的图片
        console.log('开始导出图片');
        const tempFilePath = await new Promise<string>((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas: canvasNode,
            fileType: 'jpg',
            quality: 0.92,
            success: (res) => {
              console.log('图片导出成功:', res.tempFilePath);
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error('图片导出失败:', err);
              reject(err);
            }
          });
        });

        this.setData({
          filteredPath: tempFilePath,
          isProcessing: false
        });

      } catch (err) {
        console.error('滤镜应用失败:', err);
        wx.showToast({ title: '滤镜应用失败', icon: 'none' });
        this.setData({ isProcessing: false });
      }
    },

    // 像素级滤镜处理（兼容性更好）
    async applyPixelFilter(
      ctx: WechatMiniprogram.CanvasContext,
      width: number,
      height: number,
      filterType: string,
      intensity: number
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageData = (ctx as any).getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          switch (filterType) {
            case 'grayscale':
              // 灰度
              const gray = r * 0.299 + g * 0.587 + b * 0.114;
              r = r + (gray - r) * intensity;
              g = g + (gray - g) * intensity;
              b = b + (gray - b) * intensity;
              break;

            case 'sepia':
              // 复古
              const tr = r * 0.393 + g * 0.769 + b * 0.189;
              const tg = r * 0.349 + g * 0.686 + b * 0.168;
              const tb = r * 0.272 + g * 0.534 + b * 0.131;
              r = r + (tr - r) * intensity;
              g = g + (tg - g) * intensity;
              b = b + (tb - b) * intensity;
              break;

            case 'brightness':
              // 明亮
              const brightness = 1 + intensity * 0.5;
              r = Math.min(255, r * brightness);
              g = Math.min(255, g * brightness);
              b = Math.min(255, b * brightness);
              break;

            case 'contrast':
              // 对比度
              const contrast = 1 + intensity * 0.5;
              r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
              g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
              b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
              break;

            case 'warm':
              // 暖色
              r = Math.min(255, r + 20 * intensity);
              g = Math.min(255, g + 10 * intensity);
              b = Math.max(0, b - 10 * intensity);
              break;

            case 'cool':
              // 冷色
              r = Math.max(0, r - 10 * intensity);
              g = Math.min(255, g + 5 * intensity);
              b = Math.min(255, b + 20 * intensity);
              break;

            case 'vintage':
              // 胶片
              const vr = r * 0.9 + g * 0.1;
              const vg = g * 0.9 + b * 0.1;
              const vb = b * 0.8 + r * 0.1;
              r = r + (vr - r) * intensity;
              g = g + (vg - g) * intensity;
              b = b + (vb - b) * intensity;
              break;
          }

          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx as any).putImageData(imageData, 0, 0);
      } catch (err) {
        console.error('像素处理失败:', err);
      }
    },

    // 预览图片
    previewImage() {
      wx.previewImage({
        urls: [this.data.filteredPath],
        current: this.data.filteredPath
      });
    },

    // 保存到相册
    async saveToAlbum() {
      if (!this.data.filteredPath) return;

      try {
        await wx.saveImageToPhotosAlbum({
          filePath: this.data.filteredPath
        });
        wx.showToast({ title: '已保存到相册', icon: 'success' });

        // 保存到历史记录
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
        type: 'filter',
        typeName: '滤镜美化',
        originalPath: this.data.imagePath,
        resultPath: this.data.filteredPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          filter: this.data.currentFilter,
          intensity: this.data.filterIntensity
        }
      });
      wx.setStorageSync('processHistory', history.slice(0, 20));
    },

    // 重新选择
    resetFilter() {
      this.setData({
        currentFilter: 'none',
        filterIntensity: 100,
        filteredPath: this.data.imagePath
      });
    }
  }
});
