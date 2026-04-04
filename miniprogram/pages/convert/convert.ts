// convert.ts
// 格式转换页面

import { chooseImage, getImageInfo } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbumWithUI } from '../../utils/file';
import { saveToHistory } from '../../utils/history';
import { handleError } from '../../utils/error';
import { showLoading } from '../../utils/ui';
import { debounce } from '../../utils/debounce';

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

  // 禁用的格式（与原格式相同）
  disabledFormats: string[];
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

    // 禁用的格式
    disabledFormats: [],
  } as ConvertData,

  methods: {
    /**
     * 选择图片
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();

        // 检测原图格式
        const detectedFormat = this.detectFormat(imageInfo.path);

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

        // 计算禁用的格式（与原格式相同的格式）
        const disabledFormats = ['jpg', 'jpeg'].includes(detectedFormat)
          ? ['jpg']
          : detectedFormat === 'png'
            ? ['png']
            : [];

        this.setData({
          imagePath: imageInfo.path,
          originalSize: Math.round(imageInfo.size / 1024),
          originalFormat: originalFormat,
          hasImage: true,
          convertedPath: '',
          convertedSize: 0,
          convertedFormat: '',
          targetFormat: targetFormat,
          quality: 92,
          disabledFormats
        });

        // 自动开始转换
        setTimeout(() => {
          this.startConvert();
        }, 100);
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
      this.setData({ targetFormat: format }, () => {
        // 实时转换预览
        this.debouncedConvert();
      });
    },

    /**
     * 防抖转换（实时预览）
     */
    debouncedConvert: debounce(function(this: any) {
      if (this.data.hasImage && !this.data.isProcessing) {
        this.startConvert();
      }
    }, 500),

    /**
     * 质量滑块变化
     * @param e 滑块变化事件
     */
    onQualityChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ quality: e.detail.value }, () => {
        // 实时转换预览
        this.debouncedConvert();
      });
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

        const tempFilePath = await canvasToTempFile(canvas, {
          fileType: targetFormat,
          quality: exportQuality
        });

        // 获取转换后文件大小
        const convertedFileInfo = await getImageInfo(tempFilePath);

        this.setData({
          convertedPath: tempFilePath,
          convertedSize: Math.round(convertedFileInfo.size / 1024),
          convertedFormat: targetFormat.toUpperCase(),
          isProcessing: false
        });

        // 保存到历史记录
        this.saveToHistory();

      } catch (err) {
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
      }, () => {
        // 重置后自动触发转换
        this.startConvert();
      });
    },

    /**
     * 保存到历史记录
     */
    saveToHistory() {
      saveToHistory({
        type: 'convert',
        typeName: '格式转换',
        originalPath: this.data.imagePath,
        resultPath: this.data.convertedPath,
        params: {
          originalFormat: this.data.originalFormat,
          convertedFormat: this.data.convertedFormat,
          originalSize: this.data.originalSize,
          convertedSize: this.data.convertedSize,
          quality: this.data.quality
        }
      });
    },

    /**
     * 保存到相册
     */
    async saveToAlbum() {
      if (!this.data.convertedPath) return;

      await saveImageToAlbumWithUI(this.data.convertedPath);
    }
  }
});
