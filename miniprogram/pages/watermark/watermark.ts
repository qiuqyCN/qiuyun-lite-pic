// watermark.ts
// 添加水印页面

import { chooseImage } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { handleError, showSuccess, showLoading } from '../../utils/error';
import type { HistoryItem } from '../../types/index';

/** 水印位置类型 */
type WatermarkPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | 'tile';

/** 水印类型 */
type WatermarkType = 'text' | 'image';

/** 页面数据接口 */
interface WatermarkData {
  /** 原图路径 */
  imagePath: string;
  /** 带水印图片路径 */
  watermarkedPath: string;
  /** 图片宽度 */
  imageWidth: number;
  /** 图片高度 */
  imageHeight: number;
  /** 水印类型 */
  watermarkType: WatermarkType;
  /** 水印文字 */
  watermarkText: string;
  /** 水印图片路径 */
  watermarkImage: string;
  /** 字体大小 */
  fontSize: number;
  /** 字体颜色 */
  fontColor: string;
  /** 透明度 0-100 */
  opacity: number;
  /** 旋转角度 */
  rotation: number;
  /** 水印位置 */
  position: WatermarkPosition;
  /** 预设颜色列表 */
  colorList: string[];
  /** 输出格式 */
  fileType: 'jpg' | 'png';
  /** 是否处理中 */
  isProcessing: boolean;
  /** 是否已选择图片 */
  hasImage: boolean;
}

Component({
  data: {
    // 图片信息
    imagePath: '',
    watermarkedPath: '',
    imageWidth: 0,
    imageHeight: 0,

    // 水印设置
    watermarkType: 'text' as WatermarkType,
    watermarkText: '秋云轻图',
    watermarkImage: '',

    // 文字水印样式
    fontSize: 50,
    fontColor: '#41bc3f',
    opacity: 50,
    rotation: 0,

    // 位置
    position: 'bottomRight' as WatermarkPosition,

    // 预设颜色
    colorList: ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],

    // 输出格式
    fileType: 'jpg',

    // 状态
    isProcessing: false,
    hasImage: false
  } as WatermarkData,

  methods: {
    /**
     * 选择图片
     * 从相册或相机选择图片并获取图片信息
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();

        this.setData({
          imagePath: imageInfo.path,
          imageWidth: imageInfo.width,
          imageHeight: imageInfo.height,
          hasImage: true,
          watermarkedPath: imageInfo.path
        }, () => {
          // 如果有水印设置，重新应用
          if (this.data.watermarkText || this.data.watermarkImage) {
            this.applyWatermark();
          }
        });
      } catch (error) {
        handleError(error, '选择图片失败');
      }
    },

    /**
     * 选择水印图片
     * 从相册选择图片作为水印
     */
    async chooseWatermarkImage() {
      try {
        const imageInfo = await chooseImage();
        this.setData({
          watermarkImage: imageInfo.path
        }, () => {
          this.applyWatermark();
        });
      } catch (error) {
        handleError(error, '选择水印图片失败');
      }
    },

    /**
     * 切换水印类型
     * @param e - 触摸事件对象
     */
    onTypeChange(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type as WatermarkType;
      this.setData({ watermarkType: type }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 文字输入事件处理
     * @param e - 输入事件对象
     */
    onTextInput(e: WechatMiniprogram.Input) {
      this.setData({ watermarkText: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 字体大小变化事件处理
     * @param e - 自定义事件对象
     */
    onFontSizeChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ fontSize: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 透明度变化事件处理
     * @param e - 自定义事件对象
     */
    onOpacityChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ opacity: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 旋转角度变化事件处理
     * @param e - 自定义事件对象
     */
    onRotationChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ rotation: e.detail.value }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 选择颜色事件处理
     * @param e - 自定义事件对象
     */
    onColorSelect(e: WechatMiniprogram.CustomEvent) {
      const color = e.detail.color;
      this.setData({ fontColor: color }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 选择位置事件处理
     * @param e - 触摸事件对象
     */
    onPositionSelect(e: WechatMiniprogram.TouchEvent) {
      const position = e.currentTarget.dataset.position;
      this.setData({ position }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 格式选择变化
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ fileType: format }, () => {
        this.applyWatermark();
      });
    },

    /**
     * 应用水印
     * 在 Canvas 上绘制原图并添加水印效果
     */
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
        // 创建 Canvas 上下文
        const { canvas, ctx } = await createCanvasContext('watermarkCanvas', this);

        // 设置 canvas 尺寸
        canvas.width = this.data.imageWidth;
        canvas.height = this.data.imageHeight;

        // 绘制原图
        const image = canvas.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = this.data.imagePath;
        });
        ctx.drawImage(image, 0, 0, this.data.imageWidth, this.data.imageHeight);

        // 应用水印
        if (this.data.watermarkType === 'text') {
          await this.drawTextWatermark(ctx);
        } else {
          await this.drawImageWatermark(ctx, canvas);
        }

        // 导出图片
        const tempFilePath = await canvasToTempFile(canvas, {
          fileType: this.data.fileType,
          quality: 0.92
        });

        this.setData({
          watermarkedPath: tempFilePath,
          isProcessing: false
        });

      } catch (error) {
        handleError(error, '水印应用失败');
        this.setData({ isProcessing: false });
      }
    },

    /**
     * 绘制文字水印
     * @param ctx - Canvas 2D 上下文
     */
    async drawTextWatermark(ctx: any) {
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

    /**
     * 绘制图片水印
     * @param ctx - Canvas 2D 上下文
     * @param canvas - Canvas 节点
     */
    async drawImageWatermark(ctx: any, canvas: any) {
      const { watermarkImage, opacity, position, imageWidth, imageHeight } = this.data;

      // 加载水印图片
      const watermarkImg = canvas.createImage();
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

    /**
     * 预览图片
     * 在微信中预览带水印的图片
     */
    previewImage() {
      wx.previewImage({
        urls: [this.data.watermarkedPath],
        current: this.data.watermarkedPath
      });
    },

    /**
     * 保存到相册
     * 将带水印的图片保存到系统相册
     */
    async saveToAlbum() {
      if (!this.data.watermarkedPath) return;

      const hideLoading = showLoading('保存中...');

      try {
        await saveImageToAlbum(this.data.watermarkedPath);
        hideLoading();
        showSuccess('已保存到相册');
        this.saveToHistory();
      } catch (error) {
        hideLoading();
        handleError(error, '保存失败');
      }
    },

    /**
     * 保存到历史记录
     * 将处理记录保存到本地存储
     */
    saveToHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        type: 'watermark',
        typeName: '添加水印',
        originalPath: this.data.imagePath,
        resultPath: this.data.watermarkedPath,
        timestamp: Date.now(),
        fileSize: 0
      };

      history.unshift(historyItem);
      wx.setStorageSync('processHistory', history.slice(0, 20));
    },

    /**
     * 重置水印设置
     * 将所有水印设置恢复到默认值
     */
    resetWatermark() {
      this.setData({
        watermarkType: 'text',
        watermarkText: '秋云轻图',
        watermarkImage: '',
        fontSize: 50,
        fontColor: '#41bc3f',
        opacity: 50,
        rotation: 0,
        position: 'bottomRight',
        fileType: 'jpg',
        watermarkedPath: this.data.imagePath
      }, () => {
        this.applyWatermark();
      });
    }
  }
});
