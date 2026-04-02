// filter.ts
// 滤镜美化页面

Component({
  data: {
    // 图片信息
    imagePath: '',
    filteredPath: '',
    
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
          
          this.setData({
            imagePath: tempFilePath,
            filteredPath: tempFilePath,
            hasImage: true,
            currentFilter: 'none',
            filterIntensity: 100
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
        const canvasNode = await new Promise<WechatMiniprogram.Canvas>((resolve) => {
          query.select('#filterCanvas').fields({ node: true, size: true }).exec((res) => {
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

        // 清除画布
        ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);

        // 应用滤镜效果
        const intensityRatio = intensity / 100;
        
        switch (filterType) {
          case 'grayscale':
            ctx.filter = `grayscale(${intensityRatio * 100}%)`;
            break;
          case 'sepia':
            ctx.filter = `sepia(${intensityRatio * 100}%)`;
            break;
          case 'brightness':
            ctx.filter = `brightness(${100 + intensityRatio * 50}%)`;
            break;
          case 'contrast':
            ctx.filter = `contrast(${100 + intensityRatio * 50}%)`;
            break;
          case 'blur':
            ctx.filter = `blur(${intensityRatio * 5}px)`;
            break;
          case 'warm':
            ctx.filter = `sepia(${intensityRatio * 30}%) saturate(${100 + intensityRatio * 20}%)`;
            break;
          case 'cool':
            ctx.filter = `hue-rotate(${intensityRatio * 30}deg) saturate(${100 + intensityRatio * 10}%)`;
            break;
          case 'vintage':
            ctx.filter = `sepia(${intensityRatio * 50}%) contrast(${100 + intensityRatio * 20}%) brightness(${100 - intensityRatio * 10}%)`;
            break;
          default:
            ctx.filter = 'none';
        }

        // 绘制图片
        ctx.drawImage(image, 0, 0, imageInfo.width, imageInfo.height);

        // 导出处理后的图片
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
          filteredPath: tempFilePath,
          isProcessing: false
        });

      } catch (err) {
        console.error('滤镜应用失败:', err);
        wx.showToast({ title: '滤镜应用失败', icon: 'none' });
        this.setData({ isProcessing: false });
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
