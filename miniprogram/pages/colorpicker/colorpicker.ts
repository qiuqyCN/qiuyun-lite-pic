// colorpicker.ts
// 图片取色页面

import { chooseImage, getImageInfo } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { handleError, showSuccess, showLoading } from '../../utils/error';

interface ColorPickerData {
  // 图片信息
  imagePath: string;
  originalWidth: number;
  originalHeight: number;

  // 取色结果
  pickedColor: string;
  pickedColorRgb: string;

  // 放大镜
  showMagnifier: boolean;
  magnifierX: number;
  magnifierY: number;
  magnifierImage: string;

  // 显示缩放
  scale: number;
  offsetX: number;
  offsetY: number;

  // 输出格式
  fileType: 'jpg' | 'png';

  // 状态
  hasImage: boolean;
  isProcessing: boolean;
}

Component({
  data: {
    imagePath: '',
    originalWidth: 0,
    originalHeight: 0,

    pickedColor: '',
    pickedColorRgb: '',

    showMagnifier: false,
    magnifierX: 0,
    magnifierY: 0,
    magnifierImage: '',

    scale: 1,
    offsetX: 0,
    offsetY: 0,

    fileType: 'jpg',

    hasImage: false,
    isProcessing: false,
  } as ColorPickerData,

  canvasContext: null as any,

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

        this.setData({
          imagePath: imageInfo.path,
          originalWidth: info.width,
          originalHeight: info.height,
          hasImage: true,
          scale,
          offsetX,
          offsetY,
          pickedColor: '',
          pickedColorRgb: '',
        }, () => {
          this.initCanvas();
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
      const windowWidth = sysInfo.windowWidth - 60;
      const maxHeight = 400;

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
     * 初始化画布
     */
    async initCanvas() {
      const { imagePath, originalWidth, originalHeight } = this.data;

      try {
        const query = wx.createSelectorQuery().in(this);
        const canvasNode = await new Promise<any>((resolve) => {
          query.select('#colorCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              resolve(res[0].node);
            });
        });

        if (!canvasNode) return;

        const { scale } = this.data;
        const displayWidth = Math.floor(originalWidth * scale);
        const displayHeight = Math.floor(originalHeight * scale);

        canvasNode.width = displayWidth;
        canvasNode.height = displayHeight;

        const ctx = canvasNode.getContext('2d');

        const image = canvasNode.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

        this.canvasContext = { canvas: canvasNode, ctx };
      } catch (err) {
        handleError(err, '画布初始化失败');
      }
    },

    /**
     * 触摸开始
     */
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      this.pickColor(e);
      this.setData({ showMagnifier: true });
    },

    /**
     * 触摸移动
     */
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      this.pickColor(e);
      this.updateMagnifier(e);
    },

    /**
     * 触摸结束
     */
    onTouchEnd() {
      this.setData({ showMagnifier: false });
    },

    /**
     * 取色
     */
    pickColor(e: WechatMiniprogram.TouchEvent) {
      if (!this.canvasContext) return;

      const touch = e.touches[0];
      const { ctx, canvas } = this.canvasContext;
      const { scale } = this.data;

      // 获取canvas位置
      const rect = (e.target as any).getBoundingClientRect();
      const x = Math.floor(touch.clientX - rect.left);
      const y = Math.floor(touch.clientY - rect.top);

      // 限制在canvas范围内
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

      try {
        // 获取像素数据
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        const hex = this.rgbToHex(r, g, b);
        const rgb = `rgb(${r}, ${g}, ${b})`;

        this.setData({
          pickedColor: hex,
          pickedColorRgb: rgb,
        });
      } catch (err) {
        // 取色失败，静默处理
      }
    },

    /**
     * 更新放大镜位置
     */
    updateMagnifier(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches[0];
      const rect = (e.target as any).getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      this.setData({
        magnifierX: x,
        magnifierY: y,
      });
    },

    /**
     * RGB转HEX
     */
    rgbToHex(r: number, g: number, b: number): string {
      const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },

    /**
     * 复制颜色到剪贴板
     */
    copyColor() {
      const { pickedColor } = this.data;
      if (!pickedColor) return;

      wx.setClipboardData({
        data: pickedColor,
        success: () => {
          showSuccess('颜色已复制');
        }
      });
    },

    /**
     * 预览图片
     */
    previewImage() {
      const { imagePath } = this.data;
      if (imagePath) {
        wx.previewImage({ urls: [imagePath], current: imagePath });
      }
    },

    /**
     * 格式选择变化
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ fileType: format });
    },

    /**
     * 保存到相册
     */
    async saveToAlbum() {
      const { imagePath, fileType } = this.data;

      if (!imagePath) return;

      const hideLoading = showLoading('保存中...');
      this.setData({ isProcessing: true });

      try {
        const { canvas, ctx } = await createCanvasContext('saveCanvas', this);

        // 加载原图
        const image = canvas.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        // 设置canvas尺寸为原图尺寸
        canvas.width = image.width;
        canvas.height = image.height;

        // 绘制图片
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // 导出为指定格式
        const tempFilePath = await canvasToTempFile(canvas, {
          fileType,
          quality: 0.95,
        });

        await saveImageToAlbum(tempFilePath);
        showSuccess('已保存到相册');
      } catch (err) {
        handleError(err, '保存失败');
      } finally {
        hideLoading();
        this.setData({ isProcessing: false });
      }
    },
  },
});
