// resize.ts
// 尺寸调整页面 - 优化版

import {
  chooseImage,
  calculateAspectRatioSize,
  calculateDisplaySize
} from '../../utils/image';
import {
  createCanvasContext,
  canvasToTempFile,
  fillBackground
} from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { handleError, showSuccess, showLoading } from '../../utils/error';
import { ALL_PRESETS } from '../../constants/presets';
import type { PresetSize } from '../../types/index';

/** 页面数据接口 */
interface ResizeData {
  // 图片信息
  imagePath: string;
  originalWidth: number;
  originalHeight: number;
  hasImage: boolean;

  // 预览相关
  previewPath: string;
  previewDisplayWidth: number;
  previewDisplayHeight: number;

  // 预设尺寸
  presetSizes: PresetSize[];
  selectedPreset: string;

  // 尺寸设置
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;

  // 输出格式
  fileType: 'jpg' | 'png';

  // 状态
  isProcessing: boolean;
  resultPath: string;
}

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
    presetSizes: ALL_PRESETS,
    selectedPreset: '',

    // 尺寸设置
    targetWidth: 0,
    targetHeight: 0,
    maintainAspectRatio: true,

    // 输出格式
    fileType: 'jpg',

    // 状态
    isProcessing: false,
    resultPath: '',
  } as ResizeData,

  methods: {
    /**
     * 选择图片
     * 从相册或相机选择图片并获取图片信息
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();

        const originalWidth = imageInfo.width;
        const originalHeight = imageInfo.height;

        this.setData({
          imagePath: imageInfo.path,
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
        // 用户取消选择，不显示错误
        console.log('用户取消选择');
      }
    },

    /**
     * 选择预设尺寸
     * @param e - 组件事件对象
     */
    onPresetSelect(e: WechatMiniprogram.CustomEvent) {
      const preset = e.detail.item;
      if (!preset) return;

      this.setData({
        selectedPreset: preset.id,
        targetWidth: preset.width,
        targetHeight: preset.height,
        maintainAspectRatio: false,
      });

      this.generatePreview();
    },

    /**
     * 宽度输入变化处理
     * 根据是否保持宽高比自动计算高度
     * @param e - 输入事件对象
     */
    onWidthInput(e: WechatMiniprogram.Input) {
      const value = parseInt(e.detail.value) || 0;
      const { originalWidth, originalHeight, maintainAspectRatio } = this.data;

      if (maintainAspectRatio && originalWidth > 0) {
        const newSize = calculateAspectRatioSize(
          originalWidth,
          originalHeight,
          value,
          this.data.targetHeight,
          true
        );
        this.setData({
          targetWidth: value,
          targetHeight: newSize.height,
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

    /**
     * 高度输入变化处理
     * 根据是否保持宽高比自动计算宽度
     * @param e - 输入事件对象
     */
    onHeightInput(e: WechatMiniprogram.Input) {
      const value = parseInt(e.detail.value) || 0;
      const { originalWidth, originalHeight, maintainAspectRatio } = this.data;

      if (maintainAspectRatio && originalHeight > 0) {
        const newSize = calculateAspectRatioSize(
          originalWidth,
          originalHeight,
          this.data.targetWidth,
          value,
          true
        );
        this.setData({
          targetHeight: value,
          targetWidth: newSize.width,
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

    /**
     * 格式选择变化
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ fileType: format });
    },

    /**
     * 锁定比例切换处理
     * 切换时根据当前宽度重新计算高度
     * @param e - 开关变化事件对象
     */
    onAspectRatioChange(e: WechatMiniprogram.SwitchChange) {
      const maintainAspectRatio = e.detail.value;

      if (maintainAspectRatio) {
        const { originalWidth, originalHeight, targetWidth } = this.data;
        if (originalWidth > 0 && targetWidth > 0) {
          const newSize = calculateAspectRatioSize(
            originalWidth,
            originalHeight,
            targetWidth,
            this.data.targetHeight,
            true
          );
          this.setData({
            maintainAspectRatio,
            targetHeight: newSize.height,
          });
          this.generatePreview();
          return;
        }
      }

      this.setData({ maintainAspectRatio });
    },

    /**
     * 生成预览图
     * 在预览画布上显示调整后的图片效果
     */
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
        const displaySize = calculateDisplaySize(
          originalWidth,
          originalHeight,
          containerWidth,
          containerHeight
        );

        const imageDisplayWidth = displaySize.width;
        const imageDisplayHeight = displaySize.height;

        // 获取 Canvas 上下文
        const { canvas, ctx } = await createCanvasContext('previewCanvas', this);

        // Canvas 尺寸与图片显示尺寸一致，不要有灰色背景
        canvas.width = imageDisplayWidth;
        canvas.height = imageDisplayHeight;

        // 创建图片对象
        const image = canvas.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        // 直接绘制图片，填满整个 Canvas，不要有背景
        ctx.drawImage(image, 0, 0, imageDisplayWidth, imageDisplayHeight);

        // 导出预览图
        const tempFilePath = await canvasToTempFile(canvas, {
          quality: 0.8,
          fileType: 'jpg',
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

    /**
     * 确认调整尺寸
     * 验证参数并生成最终图片
     */
    async confirmResize() {
      if (!this.data.hasImage) {
        handleError(null, '请先选择图片');
        return;
      }

      const { targetWidth, targetHeight } = this.data;
      if (targetWidth <= 0 || targetHeight <= 0) {
        handleError(null, '尺寸必须大于0');
        return;
      }

      if (targetWidth > 8192 || targetHeight > 8192) {
        handleError(null, '尺寸不能超过8192px');
        return;
      }

      const hideLoading = showLoading('处理中...');
      this.setData({ isProcessing: true });

      try {
        const resultPath = await this.generateResultImage();

        this.setData({
          resultPath,
          isProcessing: false,
        });

        this.saveToHistory();
        showSuccess('调整完成');
      } catch (err) {
        console.error('调整失败:', err);
        handleError(err, '调整失败');
        this.setData({ isProcessing: false });
      } finally {
        hideLoading();
      }
    },

    /**
     * 生成结果图片
     * 在画布上绘制调整尺寸后的图片
     * @returns 临时文件路径
     */
    async generateResultImage(): Promise<string> {
      const { imagePath, targetWidth, targetHeight } = this.data;

      // 获取 Canvas 上下文
      const { canvas, ctx } = await createCanvasContext('resizeCanvas', this);

      // 设置 Canvas 尺寸
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 创建图片对象
      const image = canvas.createImage();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imagePath;
      });

      // 清空画布（白色背景）
      fillBackground(ctx, targetWidth, targetHeight, '#ffffff');

      // 计算绘制参数（居中裁剪填充）
      const targetAspect = targetWidth / targetHeight;
      const imageAspect = image.width / image.height;

      let drawWidth: number;
      let drawHeight: number;
      let drawX: number;
      let drawY: number;

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
      return await canvasToTempFile(canvas, {
        quality: 0.95,
        fileType: this.data.fileType,
      });
    },

    /**
     * 保存到相册
     * 将处理后的图片保存到系统相册
     */
    async saveToAlbum() {
      if (!this.data.resultPath) return;

      const hideLoading = showLoading('保存中...');

      try {
        await saveImageToAlbum(this.data.resultPath);
        showSuccess('已保存到相册');
      } catch (err) {
        handleError(err, '保存失败');
      } finally {
        hideLoading();
      }
    },

    /**
     * 重新调整
     * 清除结果，重新生成预览
     */
    resetResize() {
      this.setData({
        resultPath: '',
        previewPath: '',
      });
      this.generatePreview();
    },

    /**
     * 保存到历史记录
     * 将处理记录保存到本地存储
     */
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
