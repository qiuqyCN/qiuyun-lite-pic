// annotate.ts
// 图片标注/涂鸦页面

import { chooseImage, getImageInfo } from '../../utils/image';
import { saveImageToAlbum } from '../../utils/file';
import { handleError, showSuccess, showLoading } from '../../utils/error';

interface AnnotateData {
  // 图片信息
  imagePath: string;
  originalWidth: number;
  originalHeight: number;

  // 画笔设置
  brushColor: string;
  brushSize: number;

  // 输出格式
  fileType: 'jpg' | 'png';

  // 状态
  isProcessing: boolean;
  hasImage: boolean;
  isDrawing: boolean;
}

// 预设颜色
const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#41bc3f'
];

Component({
  data: {
    imagePath: '',
    originalWidth: 0,
    originalHeight: 0,

    brushColor: '#41bc3f',
    brushSize: 5,

    fileType: 'jpg',

    isProcessing: false,
    hasImage: false,
    isDrawing: false,

    presetColors: PRESET_COLORS,
  } as AnnotateData & { presetColors: typeof PRESET_COLORS },

  canvasContext: null as any,

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
        }, () => {
          this.initCanvas();
        });
      } catch (err) {
        console.log('用户取消选择');
      }
    },

    /**
     * 初始化画布
     */
    async initCanvas() {
      const { imagePath, originalWidth, originalHeight } = this.data;

      try {
        // 获取canvas上下文
        const query = wx.createSelectorQuery().in(this);
        const canvasNode = await new Promise<any>((resolve) => {
          query.select('#annotateCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              resolve(res[0].node);
            });
        });

        if (!canvasNode) return;

        // 计算显示尺寸
        const sysInfo = wx.getSystemInfoSync();
        const maxWidth = sysInfo.windowWidth - 60;
        const maxHeight = 400;

        const scaleX = maxWidth / originalWidth;
        const scaleY = maxHeight / originalHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const displayWidth = Math.floor(originalWidth * scale);
        const displayHeight = Math.floor(originalHeight * scale);

        // 设置canvas尺寸
        canvasNode.width = displayWidth;
        canvasNode.height = displayHeight;

        const ctx = canvasNode.getContext('2d');

        // 加载并绘制原图
        const image = canvasNode.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

        this.canvasContext = { canvas: canvasNode, ctx, scale };
      } catch (err) {
        handleError(err, '画布初始化失败');
      }
    },

    /**
     * 触摸开始
     */
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      if (!this.canvasContext) return;

      const touch = e.touches[0];
      const { ctx, canvas } = this.canvasContext;
      const { brushColor, brushSize } = this.data;

      // 获取canvas位置
      const rect = (e.target as any).getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      this.setData({ isDrawing: true });

      // 开始路径
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    },

    /**
     * 触摸移动
     */
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isDrawing || !this.canvasContext) return;

      const touch = e.touches[0];
      const { ctx } = this.canvasContext;

      // 获取canvas位置
      const rect = (e.target as any).getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // 绘制线条
      ctx.lineTo(x, y);
      ctx.stroke();
    },

    /**
     * 触摸结束
     */
    onTouchEnd() {
      this.setData({ isDrawing: false });
    },

    /**
     * 选择颜色
     */
    onColorSelect(e: WechatMiniprogram.TouchEvent) {
      const color = e.currentTarget.dataset.color;
      this.setData({ brushColor: color });
    },

    /**
     * 画笔大小变化
     */
    onSizeChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ brushSize: e.detail.value });
    },

    /**
     * 清空画布
     */
    clearCanvas() {
      if (!this.canvasContext) return;

      const { ctx, canvas } = this.canvasContext;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 重新绘制原图
      const image = canvas.createImage();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = this.data.imagePath;
    },

    /**
     * 撤销上一步（简化版：重新加载原图）
     */
    undo() {
      this.clearCanvas();
    },

    /**
     * 预览图片
     */
    previewImage() {
      if (!this.canvasContext) return;

      const { canvas } = this.canvasContext;

      // 导出canvas为图片
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => {
          wx.previewImage({
            urls: [res.tempFilePath],
            current: res.tempFilePath
          });
        }
      });
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
      if (!this.canvasContext) return;

      const hideLoading = showLoading('保存中...');

      try {
        const { canvas } = this.canvasContext;
        const { fileType } = this.data;

        // 导出canvas为图片
        const res = await new Promise<any>((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas,
            fileType,
            quality: 0.95,
            success: resolve,
            fail: reject
          });
        });

        await saveImageToAlbum(res.tempFilePath);
        showSuccess('已保存到相册');
      } catch (err) {
        handleError(err, '保存失败');
      } finally {
        hideLoading();
      }
    },
  },
});
