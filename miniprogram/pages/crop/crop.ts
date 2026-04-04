// crop.ts
// 图片裁剪页面

import { chooseImage, getImageInfo } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { saveToHistory } from '../../utils/history';
import { handleError, showSuccess, showLoading } from '../../utils/error';
import { debounce } from '../../utils/debounce';

interface CropData {
  // 图片信息
  imagePath: string;
  originalWidth: number;
  originalHeight: number;
  croppedPath: string;

  // 裁剪参数
  aspectRatio: number; // 宽高比，0表示自由裁剪
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;

  // 输出格式
  fileType: 'jpg' | 'png';

  // 显示缩放
  scale: number;
  offsetX: number;
  offsetY: number;

  // 状态
  isProcessing: boolean;
  hasImage: boolean;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;

  // 调整大小
  isResizing: boolean;
  resizeCorner: string; // 'tl', 'tr', 'bl', 'br' - 四个角
}

// 预设比例
const ASPECT_RATIOS = [
  { label: '自由', value: 0 },
  { label: '1:1', value: 1 },
  { label: '3:4', value: 3/4 },
  { label: '4:3', value: 4/3 },
  { label: '9:16', value: 9/16 },
  { label: '16:9', value: 16/9 },
];

Component({
  data: {
    imagePath: '',
    originalWidth: 0,
    originalHeight: 0,
    croppedPath: '',

    aspectRatio: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,

    fileType: 'jpg',

    scale: 1,
    offsetX: 0,
    offsetY: 0,

    isProcessing: false,
    hasImage: false,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    isResizing: false,
    resizeCorner: '',

    aspectRatios: ASPECT_RATIOS,
  } as CropData & { aspectRatios: typeof ASPECT_RATIOS },

  methods: {
    /**
     * 选择图片
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();
        const info = await getImageInfo(imageInfo.path);

        // 计算显示缩放
        const { scale, offsetX, offsetY } = this.calculateDisplayScale(info.width, info.height);

        // 初始化裁剪区域为整张图片
        this.setData({
          imagePath: imageInfo.path,
          originalWidth: info.width,
          originalHeight: info.height,
          hasImage: true,
          croppedPath: '',
          scale,
          offsetX,
          offsetY,
          cropX: 0,
          cropY: 0,
          cropWidth: info.width,
          cropHeight: info.height,
          aspectRatio: 0,
        }, () => {
          // 自动裁剪预览
          this.debouncedCrop();
        });
      } catch (err) {
        console.log('用户取消选择');
      }
    },

    /**
     * 计算显示缩放
     */
    calculateDisplayScale(imgWidth: number, imgHeight: number) {
      const sysInfo = wx.getSystemInfoSync();
      const windowWidth = sysInfo.windowWidth - 60; // 减去padding
      const maxHeight = 400; // 最大显示高度

      const scaleX = windowWidth / imgWidth;
      const scaleY = maxHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      const displayWidth = imgWidth * scale;
      const displayHeight = imgHeight * scale;

      const offsetX = (windowWidth - displayWidth) / 2;
      const offsetY = (maxHeight - displayHeight) / 2;

      return { scale, offsetX, offsetY };
    },

    /**
     * 选择比例
     */
    onRatioSelect(e: WechatMiniprogram.TouchEvent) {
      const ratio = parseFloat(e.currentTarget.dataset.ratio);
      this.setData({ aspectRatio: ratio }, () => {
        this.resetCropArea();
        this.debouncedCrop();
      });
    },

    /**
     * 重置裁剪区域
     */
    resetCropArea() {
      const { originalWidth, originalHeight, aspectRatio } = this.data;

      let cropWidth = originalWidth;
      let cropHeight = originalHeight;

      if (aspectRatio > 0) {
        // 根据比例计算裁剪区域
        const imgRatio = originalWidth / originalHeight;
        if (imgRatio > aspectRatio) {
          // 图片更宽，以高度为基准
          cropWidth = originalHeight * aspectRatio;
          cropHeight = originalHeight;
        } else {
          // 图片更高，以宽度为基准
          cropWidth = originalWidth;
          cropHeight = originalWidth / aspectRatio;
        }
      }

      // 居中裁剪
      const cropX = (originalWidth - cropWidth) / 2;
      const cropY = (originalHeight - cropHeight) / 2;

      this.setData({ cropX, cropY, cropWidth, cropHeight });
    },

    /**
     * 触摸开始
     */
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches[0];
      this.setData({
        isDragging: true,
        dragStartX: touch.clientX,
        dragStartY: touch.clientY,
      });
    },

    /**
     * 触摸移动
     */
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isDragging) return;

      const touch = e.touches[0];
      const { dragStartX, dragStartY, scale, originalWidth, originalHeight, cropWidth, cropHeight } = this.data;

      // 计算移动距离（转换为原图坐标）
      const deltaX = (touch.clientX - dragStartX) / scale;
      const deltaY = (touch.clientY - dragStartY) / scale;

      // 更新裁剪位置（注意：拖动方向与裁剪框移动方向相反）
      let newCropX = this.data.cropX + deltaX;
      let newCropY = this.data.cropY + deltaY;

      // 限制在图片范围内
      newCropX = Math.max(0, Math.min(newCropX, originalWidth - cropWidth));
      newCropY = Math.max(0, Math.min(newCropY, originalHeight - cropHeight));

      this.setData({
        cropX: newCropX,
        cropY: newCropY,
        dragStartX: touch.clientX,
        dragStartY: touch.clientY,
      });

      // 实时预览
      this.debouncedCrop();
    },

    /**
     * 触摸结束
     */
    onTouchEnd() {
      this.setData({ 
        isDragging: false,
        isResizing: false,
        resizeCorner: ''
      });
    },

    /**
     * 开始调整大小
     */
    onResizeStart(e: WechatMiniprogram.TouchEvent) {
      const corner = e.currentTarget.dataset.corner as string;
      const touch = e.touches[0];
      this.setData({
        isResizing: true,
        resizeCorner: corner,
        dragStartX: touch.clientX,
        dragStartY: touch.clientY,
      });
    },

    /**
     * 调整大小中
     */
    onResizeMove(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isResizing) return;

      const touch = e.touches[0];
      const { resizeCorner, dragStartX, dragStartY, scale, originalWidth, originalHeight, aspectRatio } = this.data;
      let { cropX, cropY, cropWidth, cropHeight } = this.data;

      // 计算移动距离（转换为原图坐标）
      const deltaX = (touch.clientX - dragStartX) / scale;
      const deltaY = (touch.clientY - dragStartY) / scale;

      // 根据角落调整大小
      switch (resizeCorner) {
        case 'tl': // 左上角
          cropX += deltaX;
          cropY += deltaY;
          cropWidth -= deltaX;
          cropHeight -= deltaY;
          break;
        case 'tr': // 右上角
          cropY += deltaY;
          cropWidth += deltaX;
          cropHeight -= deltaY;
          break;
        case 'bl': // 左下角
          cropX += deltaX;
          cropWidth -= deltaX;
          cropHeight += deltaY;
          break;
        case 'br': // 右下角
          cropWidth += deltaX;
          cropHeight += deltaY;
          break;
      }

      // 保持比例
      if (aspectRatio > 0) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          cropHeight = cropWidth / aspectRatio;
        } else {
          cropWidth = cropHeight * aspectRatio;
        }
      }

      // 限制最小尺寸
      const minSize = 50;
      if (cropWidth < minSize) cropWidth = minSize;
      if (cropHeight < minSize) cropHeight = minSize;

      // 限制在图片范围内
      if (cropX < 0) {
        cropX = 0;
        cropWidth = this.data.cropX + this.data.cropWidth - cropX;
      }
      if (cropY < 0) {
        cropY = 0;
        cropHeight = this.data.cropY + this.data.cropHeight - cropY;
      }
      if (cropX + cropWidth > originalWidth) {
        cropWidth = originalWidth - cropX;
        if (aspectRatio > 0) {
          cropHeight = cropWidth / aspectRatio;
        }
      }
      if (cropY + cropHeight > originalHeight) {
        cropHeight = originalHeight - cropY;
        if (aspectRatio > 0) {
          cropWidth = cropHeight * aspectRatio;
        }
      }

      this.setData({
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        dragStartX: touch.clientX,
        dragStartY: touch.clientY,
      });

      // 实时预览
      this.debouncedCrop();
    },

    /**
     * 防抖裁剪
     */
    debouncedCrop: debounce(function(this: any) {
      if (this.data.hasImage && !this.data.isProcessing) {
        this.cropImage();
      }
    }, 300),

    /**
     * 裁剪图片
     */
    async cropImage() {
      const { imagePath, cropX, cropY, cropWidth, cropHeight, fileType } = this.data;

      if (!imagePath || cropWidth <= 0 || cropHeight <= 0) return;

      this.setData({ isProcessing: true });

      try {
        const { canvas, ctx } = await createCanvasContext('cropCanvas', this);

        // 设置canvas尺寸为裁剪尺寸
        canvas.width = Math.floor(cropWidth);
        canvas.height = Math.floor(cropHeight);

        // 加载原图
        const image = canvas.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        // 绘制裁剪区域
        ctx.drawImage(
          image,
          Math.floor(cropX), Math.floor(cropY),
          Math.floor(cropWidth), Math.floor(cropHeight),
          0, 0,
          Math.floor(cropWidth), Math.floor(cropHeight)
        );

        // 导出
        const tempFilePath = await canvasToTempFile(canvas, {
          fileType,
          quality: 0.95,
        });

        this.setData({
          croppedPath: tempFilePath,
          isProcessing: false,
        });
      } catch (err) {
        handleError(err, '裁剪失败');
        this.setData({ isProcessing: false });
      }
    },

    /**
     * 格式选择变化
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ fileType: format }, () => {
        // 重新裁剪以使用新格式
        this.debouncedCrop();
      });
    },

    /**
     * 预览图片
     */
    previewImage() {
      const url = this.data.croppedPath || this.data.imagePath;
      if (url) {
        wx.previewImage({ urls: [url], current: url });
      }
    },

    /**
     * 重置裁剪
     */
    resetCrop() {
      const { originalWidth, originalHeight } = this.data;

      // 重置为初始状态：自由裁剪，整张图片
      this.setData({
        aspectRatio: 0,
        cropX: 0,
        cropY: 0,
        cropWidth: originalWidth,
        cropHeight: originalHeight,
        croppedPath: '',
      }, () => {
        this.debouncedCrop();
      });
    },

    /**
     * 保存到相册
     */
    async saveToAlbum() {
      if (!this.data.croppedPath) {
        await this.cropImage();
      }

      if (!this.data.croppedPath) return;

      const hideLoading = showLoading('保存中...');

      try {
        await saveImageToAlbum(this.data.croppedPath);
        // 保存到历史记录
        this.saveHistory();
        showSuccess('已保存到相册');
      } catch (err) {
        handleError(err, '保存失败');
      } finally {
        hideLoading();
      }
    },

    /**
     * 保存到历史记录
     */
    saveHistory() {
      const { imagePath, croppedPath, originalWidth, originalHeight, cropWidth, cropHeight, aspectRatio } = this.data;
      if (!croppedPath) return;

      saveToHistory({
        type: 'crop',
        typeName: '图片裁剪',
        originalPath: imagePath,
        resultPath: croppedPath,
        params: {
          originalWidth,
          originalHeight,
          cropWidth,
          cropHeight,
          aspectRatio: aspectRatio === 0 ? '自由' : aspectRatio
        }
      });
    },
  },
});
