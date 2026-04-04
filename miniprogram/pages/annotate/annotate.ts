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
  isEraser: boolean;
  brushType: 'normal' | 'neon' | 'marker' | 'blur';

  // Canvas 显示尺寸
  canvasWidth: number;
  canvasHeight: number;
  canvasOffsetX: number;
  canvasOffsetY: number;

  // 输出格式
  fileType: 'jpg' | 'png';

  // 状态
  isProcessing: boolean;
  hasImage: boolean;
  isDrawing: boolean;
}

// 预设颜色（更多颜色选择）
const PRESET_COLORS = [
  // 基础色
  '#000000', '#ffffff', '#808080',
  // 红色系
  '#ff0000', '#ff4444', '#ff8888', '#ffaaaa',
  // 橙色系
  '#ff6600', '#ff8800', '#ffaa00', '#ffcc00',
  // 黄色系
  '#ffff00', '#ffff44', '#ffff88',
  // 绿色系
  '#00ff00', '#44ff44', '#88ff88', '#41bc3f', '#2d8c2b',
  // 青色系
  '#00ffff', '#44ffff', '#88ffff',
  // 蓝色系
  '#0000ff', '#4444ff', '#8888ff', '#0066ff', '#0088ff',
  // 紫色系
  '#ff00ff', '#ff44ff', '#ff88ff', '#8800ff', '#aa44ff',
  // 粉色系
  '#ff0088', '#ff44aa', '#ff88cc', '#ffcccc',
  // 棕色系
  '#8b4513', '#a0522d', '#cd853f', '#deb887'
];

Component({
  data: {
    imagePath: '',
    originalWidth: 0,
    originalHeight: 0,

    brushColor: '#41bc3f',
    brushSize: 5,
    isEraser: false,
    brushType: 'normal' as const,

    canvasWidth: 0,
    canvasHeight: 0,
    canvasOffsetX: 0,
    canvasOffsetY: 0,

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
        const canvasRes = await new Promise<any>((resolve) => {
          query.select('#annotateCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              resolve(res[0]);
            });
        });

        if (!canvasRes || !canvasRes.node) return;

        const canvasNode = canvasRes.node;
        const canvasRect = canvasRes;

        // 计算显示尺寸 - 保持图片比例
        const sysInfo = wx.getSystemInfoSync();
        const containerWidth = sysInfo.windowWidth - 60; // 减去padding
        const maxHeight = 400;

        // 计算保持比例的缩放
        const imgRatio = originalWidth / originalHeight;
        const containerRatio = containerWidth / maxHeight;

        let displayWidth: number;
        let displayHeight: number;

        if (imgRatio > containerRatio) {
          // 图片更宽，以宽度为基准
          displayWidth = Math.floor(containerWidth);
          displayHeight = Math.floor(containerWidth / imgRatio);
        } else {
          // 图片更高，以高度为基准
          displayHeight = Math.floor(maxHeight);
          displayWidth = Math.floor(maxHeight * imgRatio);
        }

        // 计算居中偏移
        const offsetX = Math.floor((containerWidth - displayWidth) / 2);
        const offsetY = Math.floor((maxHeight - displayHeight) / 2);

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

        // 保存canvas信息
        this.setData({
          canvasWidth: displayWidth,
          canvasHeight: displayHeight,
          canvasOffsetX: offsetX,
          canvasOffsetY: offsetY,
        });

        this.canvasContext = { canvas: canvasNode, ctx, scale: displayWidth / originalWidth };
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
      const { ctx } = this.canvasContext;
      const { brushColor, brushSize, isEraser, brushType } = this.data;

      // 获取触摸点在canvas上的坐标（使用target的相对坐标）
      const x = touch.x;
      const y = touch.y;

      this.setData({ isDrawing: true });

      // 开始路径
      ctx.beginPath();
      ctx.moveTo(x, y);

      if (isEraser) {
        // 橡皮擦模式
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;
      } else {
        // 画笔模式 - 根据画笔类型设置样式
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 根据画笔类型设置特效
        switch (brushType) {
          case 'neon':
            // 霓虹效果
            ctx.shadowBlur = brushSize * 2;
            ctx.shadowColor = brushColor;
            break;
          case 'marker':
            // 马克笔效果 - 半透明
            ctx.globalAlpha = 0.6;
            ctx.shadowBlur = 0;
            break;
          case 'blur':
            // 模糊效果
            ctx.shadowBlur = brushSize;
            ctx.shadowColor = brushColor;
            break;
          default:
            // 普通画笔
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
      }
    },

    /**
     * 触摸移动
     */
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isDrawing || !this.canvasContext) return;

      const touch = e.touches[0];
      const { ctx } = this.canvasContext;

      // 获取触摸点在canvas上的坐标
      const x = touch.x;
      const y = touch.y;

      // 绘制线条
      ctx.lineTo(x, y);
      ctx.stroke();
    },

    /**
     * 触摸结束
     */
    onTouchEnd() {
      if (this.canvasContext) {
        const { ctx } = this.canvasContext;
        // 重置画笔特效
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      this.setData({ isDrawing: false });
    },

    /**
     * 选择画笔类型
     */
    onBrushTypeSelect(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type;
      this.setData({ brushType: type, isEraser: false });
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
     * 切换橡皮擦模式
     */
    toggleEraser() {
      this.setData({ isEraser: !this.data.isEraser });
    },

    /**
     * 重置画布 - 清空涂鸦并恢复初始状态
     */
    resetCanvas() {
      if (!this.canvasContext) return;

      const { ctx, canvas } = this.canvasContext;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 重新绘制原图
      const image = canvas.createImage();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = this.data.imagePath;

      // 重置画笔设置
      this.setData({
        brushColor: '#41bc3f',
        brushSize: 5,
        isEraser: false,
        brushType: 'normal',
      });
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
