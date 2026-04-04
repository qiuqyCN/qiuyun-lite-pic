// rotate.ts
// 图片旋转/翻转页面

import { chooseImage, getImageInfo } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { handleError, showSuccess, showLoading } from '../../utils/error';
import { debounce } from '../../utils/debounce';

interface RotateData {
  // 图片信息
  imagePath: string;
  originalWidth: number;
  originalHeight: number;
  resultPath: string;

  // 变换参数
  rotation: number; // 旋转角度：0, 90, 180, 270
  flipH: boolean;   // 水平翻转
  flipV: boolean;   // 垂直翻转

  // 输出格式
  fileType: 'jpg' | 'png';

  // 状态
  isProcessing: boolean;
  hasImage: boolean;
}

// 旋转选项
const ROTATION_OPTIONS = [
  { label: '0°', value: 0, icon: '↻' },
  { label: '90°', value: 90, icon: '↻' },
  { label: '180°', value: 180, icon: '↻' },
  { label: '270°', value: 270, icon: '↻' },
];

Component({
  data: {
    imagePath: '',
    originalWidth: 0,
    originalHeight: 0,
    resultPath: '',

    rotation: 0,
    flipH: false,
    flipV: false,

    fileType: 'jpg',

    isProcessing: false,
    hasImage: false,

    rotationOptions: ROTATION_OPTIONS,
  } as RotateData & { rotationOptions: typeof ROTATION_OPTIONS },

  methods: {
    /**
     * 选择图片
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();
        const info = await getImageInfo(imageInfo.path);

        this.setData({
          imagePath: imageInfo.path,
          originalWidth: info.width,
          originalHeight: info.height,
          hasImage: true,
          resultPath: '',
          rotation: 0,
          flipH: false,
          flipV: false,
        }, () => {
          this.debouncedTransform();
        });
      } catch (err) {
        console.log('用户取消选择');
      }
    },

    /**
     * 选择旋转角度
     */
    onRotationSelect(e: WechatMiniprogram.TouchEvent) {
      const rotation = parseInt(e.currentTarget.dataset.rotation);
      this.setData({ rotation }, () => {
        this.debouncedTransform();
      });
    },

    /**
     * 切换水平翻转
     */
    toggleFlipH() {
      this.setData({ flipH: !this.data.flipH }, () => {
        this.debouncedTransform();
      });
    },

    /**
     * 切换垂直翻转
     */
    toggleFlipV() {
      this.setData({ flipV: !this.data.flipV }, () => {
        this.debouncedTransform();
      });
    },

    /**
     * 防抖变换
     */
    debouncedTransform: debounce(function(this: any) {
      if (this.data.hasImage && !this.data.isProcessing) {
        this.transformImage();
      }
    }, 300),

    /**
     * 格式选择变化
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ fileType: format }, () => {
        // 重新处理以使用新格式
        this.debouncedTransform();
      });
    },

    /**
     * 变换图片
     */
    async transformImage() {
      const { imagePath, originalWidth, originalHeight, rotation, flipH, flipV } = this.data;

      if (!imagePath) return;

      this.setData({ isProcessing: true });

      try {
        const { canvas, ctx } = await createCanvasContext('rotateCanvas', this);

        // 计算变换后的尺寸
        const isRotated90 = rotation === 90 || rotation === 270;
        const canvasWidth = isRotated90 ? originalHeight : originalWidth;
        const canvasHeight = isRotated90 ? originalWidth : originalHeight;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // 清空画布
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 保存上下文
        ctx.save();

        // 移动原点到画布中心
        ctx.translate(canvasWidth / 2, canvasHeight / 2);

        // 应用旋转
        ctx.rotate((rotation * Math.PI) / 180);

        // 应用翻转
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        // 加载原图
        const image = canvas.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        // 绘制图片（使用原始尺寸，因为旋转是在变换矩阵中完成的）
        ctx.drawImage(
          image,
          -originalWidth / 2,
          -originalHeight / 2,
          originalWidth,
          originalHeight
        );

        // 恢复上下文
        ctx.restore();

        // 导出
        const tempFilePath = await canvasToTempFile(canvas, {
          fileType: this.data.fileType,
          quality: 0.95,
        });

        this.setData({
          resultPath: tempFilePath,
          isProcessing: false,
        });
      } catch (err) {
        handleError(err, '处理失败');
        this.setData({ isProcessing: false });
      }
    },

    /**
     * 预览图片
     */
    previewImage() {
      const url = this.data.resultPath || this.data.imagePath;
      if (url) {
        wx.previewImage({ urls: [url], current: url });
      }
    },

    /**
     * 重置变换
     */
    resetTransform() {
      this.setData({
        rotation: 0,
        flipH: false,
        flipV: false,
      }, () => {
        this.debouncedTransform();
      });
    },

    /**
     * 保存到相册
     */
    async saveToAlbum() {
      if (!this.data.resultPath) {
        await this.transformImage();
      }

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
  },
});
