// convert.ts
// 格式转换页面

import { chooseImage, getImageInfo } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { formatFileSizeSimple } from '../../utils/format';
import { handleError, showSuccess, showLoading } from '../../utils/error';
import type { ImageInfo } from '../../types/index';

/** 格式选项 */
interface FormatOption {
  id: 'jpg' | 'png';
  name: string;
  desc: string;
}

/** 页面数据 */
interface ConvertData {
  // 图片信息
  imagePath: string;
  originalSize: number;
  originalFormat: string;
  convertedPath: string;
  convertedSize: number;
  convertedFormat: string;

  // 格式设置
  targetFormat: 'jpg' | 'png';
  quality: number;

  // 状态
  isProcessing: boolean;
  hasImage: boolean;

  // 支持的输出格式（Canvas只支持导出jpg/png）
  formatList: FormatOption[];
}

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
    targetFormat: 'jpg',
    quality: 92,

    // 状态
    isProcessing: false,
    hasImage: false,

    // 支持的输出格式（Canvas只支持导出jpg/png）
    formatList: [
      { id: 'jpg', name: 'JPG', desc: '有损压缩，广泛兼容' },
      { id: 'png', name: 'PNG', desc: '无损压缩，支持透明' }
    ]
  } as ConvertData,

  methods: {
    /**
     * 选择图片
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();

        console.log('Selected file path:', imageInfo.path);

        // 检测原图格式
        const detectedFormat = this.detectFormat(imageInfo.path);
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
          imagePath: imageInfo.path,
          originalSize: Math.round(imageInfo.size / 1024),
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
      } catch (err) {
        console.log('选择图片失败或取消', err);
      }
    },

    /**
     * 检测图片格式
     * @param filePath 文件路径
     * @returns 检测到的格式
     */
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

    /**
     * 格式选择
     * @param e 组件事件
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ targetFormat: format });
    },

    /**
     * 质量滑块变化
     * @param e 滑块变化事件
     */
    onQualityChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ quality: e.detail.value });
    },

    /**
     * 预览图片
     */
    previewImage() {
      const currentPath = this.data.convertedPath || this.data.imagePath;
      wx.previewImage({
        urls: [currentPath],
        current: currentPath
      });
    },

    /**
     * 开始转换
     */
    async startConvert() {
      if (!this.data.hasImage) {
        handleError(null, '请先选择图片');
        return;
      }

      const { targetFormat, quality, originalFormat } = this.data;

      // 检查是否是相同格式
      const originalLower = originalFormat.toLowerCase();
      console.log('Converting from', originalLower, 'to', targetFormat);

      // 如果原格式不是jpg/png，允许转换为jpg
      const isSupportedOriginal = ['jpg', 'jpeg', 'png'].includes(originalLower);
      if (targetFormat === originalLower && isSupportedOriginal) {
        handleError(null, '目标格式与原格式相同');
        return;
      }

      const hideLoading = showLoading('转换中...');
      this.setData({ isProcessing: true });

      try {
        // 创建 Canvas 上下文
        const { canvas, ctx } = await createCanvasContext('convertCanvas', this);

        // 获取原图信息
        const imageInfo = await getImageInfo(this.data.imagePath);

        // 设置canvas尺寸
        canvas.width = imageInfo.width;
        canvas.height = imageInfo.height;

        // 创建图片对象
        const image = canvas.createImage();
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

        const tempFilePath = await canvasToTempFile(canvas, {
          fileType: targetFormat,
          quality: exportQuality
        });

        console.log('Export success:', tempFilePath);

        // 获取转换后文件大小
        const convertedFileInfo = await getImageInfo(tempFilePath);

        const newConvertedFormat = targetFormat.toUpperCase();
        console.log('Setting convertedFormat to:', newConvertedFormat);

        this.setData({
          convertedPath: tempFilePath,
          convertedSize: Math.round(convertedFileInfo.size / 1024),
          convertedFormat: newConvertedFormat,
          isProcessing: false
        }, () => {
          console.log('Convert complete - convertedFormat:', this.data.convertedFormat);
        });

        // 保存到历史记录
        this.saveToHistory();

        // 更新使用统计
        this.updateUsageStats();

        showSuccess('转换完成');
      } catch (err) {
        console.error('转换失败:', err);
        handleError(err, '转换失败');
        this.setData({ isProcessing: false });
      } finally {
        hideLoading();
      }
    },

    /**
     * 重新转换
     */
    resetConvert() {
      this.setData({
        convertedPath: '',
        convertedSize: 0,
        convertedFormat: ''
      });
    },

    /**
     * 保存到历史记录
     */
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

      wx.setStorageSync('usageStats', stats);
    },

    /**
     * 保存到相册
     */
    async saveToAlbum() {
      if (!this.data.convertedPath) return;

      console.log('Saving to album:', this.data.convertedPath);
      console.log('Expected format:', this.data.convertedFormat);

      try {
        await saveImageToAlbum(this.data.convertedPath);
        showSuccess('已保存到相册');
      } catch (err) {
        console.error('Save to album failed:', err);
        handleError(err, '保存失败');
      }
    }
  }
});
