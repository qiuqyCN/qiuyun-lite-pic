// compress.ts
// 图片压缩页面 - 优化重构版

import { chooseImage, estimateCompressedSize, calculateSavedPercent } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { handleError, showSuccess, showLoading } from '../../utils/error';

interface CompressData {
  // 图片信息
  imagePath: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedPath: string;
  compressedSize: number;

  // 压缩参数
  quality: number;
  fileType: 'jpg' | 'png';

  // 估算范围
  estimatedMin: number;
  estimatedMax: number;

  // 节省百分比
  savedPercent: number;

  // 状态
  isProcessing: boolean;
  hasImage: boolean;
}

Component({
  data: {
    imagePath: '',
    originalSize: 0,
    originalWidth: 0,
    originalHeight: 0,
    compressedPath: '',
    compressedSize: 0,
    quality: 60,
    fileType: 'jpg',
    estimatedMin: 0,
    estimatedMax: 0,
    savedPercent: 0,
    isProcessing: false,
    hasImage: false,
  } as CompressData,

  methods: {
    /**
     * 根据原图大小推荐质量
     */
    recommendQuality(originalSizeKB: number): number {
      // 原图小于100KB，已经是小图，建议较低质量避免变大
      if (originalSizeKB < 100) return 50;
      // 原图100-500KB，建议使用中等质量
      if (originalSizeKB < 500) return 60;
      // 原图500KB-2MB，建议使用较高质量
      if (originalSizeKB < 2048) return 70;
      // 原图大于2MB，建议使用高质量压缩
      return 80;
    },

    /**
     * 选择图片
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();
        const originalSizeKB = Math.round(imageInfo.size / 1024);
        // 智能推荐质量
        const quality = this.recommendQuality(originalSizeKB);

        this.setData({
          imagePath: imageInfo.path,
          originalSize: originalSizeKB,
          originalWidth: imageInfo.width,
          originalHeight: imageInfo.height,
          hasImage: true,
          compressedPath: '',
          compressedSize: 0,
          quality,
          ...this.calculateEstimateRange(originalSizeKB, quality)
        });

        // 如果原图很小，提示用户
        if (originalSizeKB < 100) {
          wx.showToast({
            title: '原图已较小，建议降低质量',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (err) {
        // 用户取消选择，不显示错误
        console.log('用户取消选择');
      }
    },

    /**
     * 计算估算范围
     */
    calculateEstimateRange(originalSize: number, quality: number): { estimatedMin: number; estimatedMax: number } {
      const { min, max } = estimateCompressedSize(originalSize * 1024, quality);
      return {
        estimatedMin: Math.round(min / 1024),
        estimatedMax: Math.round(max / 1024)
      };
    },

    /**
     * 快速预设点击
     */
    onPresetTap(e: WechatMiniprogram.TouchEvent) {
      const quality = parseInt(e.currentTarget.dataset.quality);
      this.setData({
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    /**
     * 质量滑块变化
     */
    onQualityChanging(e: WechatMiniprogram.SliderChange) {
      const quality = e.detail.value;
      this.setData({
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    /**
     * 质量滑块变化（拖动结束）
     */
    onQualityChange(e: WechatMiniprogram.SliderChange) {
      const quality = e.detail.value;
      this.setData({
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    /**
     * 格式选择变化（压缩页面只支持JPG）
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      // 压缩功能只支持JPG，如果用户选择PNG，提示用户
      if (format === 'png') {
        wx.showToast({
          title: 'PNG为无损格式，无需压缩',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      this.setData({ fileType: format });
    },

    /**
     * 预览图片
     */
    previewImage() {
      const url = this.data.compressedPath || this.data.imagePath;
      wx.previewImage({
        urls: [url],
        current: url
      });
    },

    /**
     * 开始压缩
     */
    async startCompress() {
      if (!this.data.hasImage) {
        handleError(null, '请先选择图片');
        return;
      }

      const hideLoading = showLoading('压缩中...');
      this.setData({ isProcessing: true });

      try {
        const { canvas, ctx } = await createCanvasContext('compressCanvas', this);

        // 设置canvas尺寸
        canvas.width = this.data.originalWidth;
        canvas.height = this.data.originalHeight;

        // 创建图片对象
        const image = canvas.createImage();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = this.data.imagePath;
        });

        // 绘制图片
        ctx.drawImage(image, 0, 0, this.data.originalWidth, this.data.originalHeight);

        // 导出压缩后的图片（压缩只支持JPG格式）
        const tempFilePath = await canvasToTempFile(canvas, {
          quality: this.data.quality / 100,
          fileType: this.data.fileType === 'jpg' ? 'jpg' : 'jpg'
        });

        // 获取压缩后文件大小
        const fileInfo = await wx.getFileInfo({ filePath: tempFilePath });
        const compressedSize = Math.round(fileInfo.size / 1024);
        const savedPercent = calculateSavedPercent(this.data.originalSize, compressedSize);

        this.setData({
          compressedPath: tempFilePath,
          compressedSize,
          savedPercent: savedPercent > 0 ? savedPercent : 0,
          isProcessing: false
        });

        hideLoading();

        // 如果压缩后比原图大，提示用户
        if (compressedSize >= this.data.originalSize) {
          wx.showModal({
            title: '压缩提示',
            content: `压缩后(${compressedSize}KB)比原图(${this.data.originalSize}KB)更大，建议降低质量或直接使用原图`,
            showCancel: false,
            confirmText: '知道了'
          });
        }

        // 保存到历史记录
        this.saveToHistory();

        // 更新使用统计
        this.updateUsageStats();

        // 显示成功提示
        if (compressedSize < this.data.originalSize) {
          showSuccess(`节省 ${savedPercent}%`);
        } else {
          showSuccess('压缩完成');
        }

      } catch (err) {
        hideLoading();
        handleError(err, '压缩失败');
        this.setData({ isProcessing: false });
      }
    },

    /**
     * 重新压缩
     */
    resetCompress() {
      // 使用智能推荐质量
      const quality = this.recommendQuality(this.data.originalSize);
      this.setData({
        compressedPath: '',
        compressedSize: 0,
        savedPercent: 0,
        quality,
        ...this.calculateEstimateRange(this.data.originalSize, quality)
      });
    },

    /**
     * 保存到历史记录
     */
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

    /**
     * 更新使用统计
     */
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

    /**
     * 保存到相册
     */
    async saveToAlbum() {
      if (!this.data.compressedPath) return;

      try {
        await saveImageToAlbum(this.data.compressedPath);
        showSuccess('已保存到相册');
      } catch (err) {
        handleError(err, '保存失败');
      }
    }
  }
});
