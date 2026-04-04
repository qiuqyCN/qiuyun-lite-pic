// colorpicker.ts
// 图片取色页面 - 增强版

import { chooseImage, getImageInfo } from '../../utils/image';
import { handleError } from '../../utils/error';
import { showSuccess } from '../../utils/ui';
import { saveToHistory } from '../../utils/history';
import { STORAGE_KEYS } from '../../constants/storage-keys';

interface ColorPickerData {
  // 图片信息
  imagePath: string;
  originalWidth: number;
  originalHeight: number;

  // 取色结果
  pickedColor: string;
  pickedColorRgb: string;
  pickedColorHsl: string;
  colorFormat: 'hex' | 'rgb' | 'hsl';

  // 放大镜
  showMagnifier: boolean;
  magnifierX: number;
  magnifierY: number;

  // 显示缩放
  scale: number;
  canvasWidth: number;
  canvasHeight: number;

  // 历史记录
  colorHistory: string[];

  // 收藏颜色
  favoriteColors: string[];

  // 状态
  hasImage: boolean;
}



Component({
  data: {
    imagePath: '',
    originalWidth: 0,
    originalHeight: 0,

    pickedColor: '',
    pickedColorRgb: '',
    pickedColorHsl: '',
    colorFormat: 'hex',

    showMagnifier: false,
    magnifierX: 0,
    magnifierY: 0,

    scale: 1,
    canvasWidth: 0,
    canvasHeight: 0,

    colorHistory: [],
    favoriteColors: [],

    hasImage: false,
  } as ColorPickerData,

  lifetimes: {
    attached() {
      // 加载收藏的本地存储
      const favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITE_COLORS);
      if (favorites && favorites.length > 0) {
        this.setData({ favoriteColors: favorites });
      }
    }
  },

  methods: {
    /**
     * 选择图片
     */
    async chooseImage() {
      try {
        const imageInfo = await chooseImage();
        const info = await getImageInfo(imageInfo.path);

        // 计算显示缩放
        const { scale, canvasWidth, canvasHeight } = this.calculateDisplayScale(info.width, info.height);

        this.setData({
          imagePath: imageInfo.path,
          originalWidth: info.width,
          originalHeight: info.height,
          hasImage: true,
          scale,
          canvasWidth,
          canvasHeight,
          pickedColor: '',
          pickedColorRgb: '',
          pickedColorHsl: '',
          colorHistory: [],
        }, () => {
          this.initCanvas();
          this.initMagnifierCanvas();
        });
      } catch (err) {
        console.log('用户取消选择');
      }
    },

    /**
     * 计算显示缩放
     */
    calculateDisplayScale(imgWidth: number, imgHeight: number) {
      const windowInfo = (wx as any).getWindowInfo();
      const containerWidth = windowInfo.windowWidth - 60;
      const maxHeight = 400;

      const imgRatio = imgWidth / imgHeight;
      const containerRatio = containerWidth / maxHeight;

      let canvasWidth: number;
      let canvasHeight: number;

      if (imgRatio > containerRatio) {
        canvasWidth = Math.floor(containerWidth);
        canvasHeight = Math.floor(containerWidth / imgRatio);
      } else {
        canvasHeight = Math.floor(maxHeight);
        canvasWidth = Math.floor(maxHeight * imgRatio);
      }

      const scale = canvasWidth / imgWidth;

      return { scale, canvasWidth, canvasHeight };
    },

    /**
     * 初始化画布
     */
    async initCanvas() {
      const { imagePath, canvasWidth, canvasHeight } = this.data;

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

        canvasNode.width = canvasWidth;
        canvasNode.height = canvasHeight;

        const ctx = canvasNode.getContext('2d');

        const image = canvasNode.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imagePath;
        });

        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

        // 存储在组件实例上
        (this as any)._canvasContext = { canvas: canvasNode, ctx };
      } catch (err) {
        handleError(err, '画布初始化失败');
      }
    },

    /**
     * 初始化放大镜画布
     */
    async initMagnifierCanvas() {
      try {
        const query = wx.createSelectorQuery().in(this);
        const canvasNode = await new Promise<any>((resolve) => {
          query.select('#magnifierCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              resolve(res[0].node);
            });
        });

        if (!canvasNode) return;

        canvasNode.width = 80;
        canvasNode.height = 80;

        const ctx = canvasNode.getContext('2d');
        // 存储在组件实例上
        (this as any)._magnifierCanvas = { canvas: canvasNode, ctx };
      } catch (err) {
        console.error('放大镜画布初始化失败', err);
      }
    },

    /**
     * 触摸开始
     */
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      (this as any).pickColor(e);
      this.setData({ showMagnifier: true });
    },

    /**
     * 触摸移动
     */
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      (this as any).pickColor(e);
      (this as any).updateMagnifier(e);
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
      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext) return;

      const touch = e.touches[0];
      const { ctx, canvas } = canvasContext;

      // 获取相对于 canvas 的坐标
      // 小程序 Canvas 2D 中，touch.x/y 是相对于 canvas 的坐标
      const touchAny = touch as any;
      const x = Math.floor(touchAny.x || 0);
      const y = Math.floor(touchAny.y || 0);

      // 限制在 canvas 范围内
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

      try {
        // 获取像素数据
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        const hex = (this as any).rgbToHex(r, g, b);
        const rgb = `rgb(${r}, ${g}, ${b})`;
        const hsl = (this as any).rgbToHsl(r, g, b);

        this.setData({
          pickedColor: hex,
          pickedColorRgb: rgb,
          pickedColorHsl: hsl,
        });

        // 更新放大镜
        (this as any).drawMagnifier(x, y);
      } catch (err) {
        // 取色失败，静默处理
      }
    },

    /**
     * 绘制放大镜
     */
    drawMagnifier(x: number, y: number) {
      const canvasContext = (this as any)._canvasContext;
      const magnifierCanvas = (this as any)._magnifierCanvas;
      if (!canvasContext || !magnifierCanvas) return;

      const { canvas: sourceCanvas } = canvasContext;
      const { ctx: magCtx } = magnifierCanvas;

      const zoomLevel = 4;
      const size = 80;
      const sourceSize = size / zoomLevel;

      // 清除放大镜画布
      magCtx.clearRect(0, 0, size, size);

      // 计算源区域（以当前点为中心）
      let sourceX = x - sourceSize / 2;
      let sourceY = y - sourceSize / 2;

      // 边界处理
      if (sourceX < 0) sourceX = 0;
      if (sourceY < 0) sourceY = 0;
      if (sourceX + sourceSize > sourceCanvas.width) sourceX = sourceCanvas.width - sourceSize;
      if (sourceY + sourceSize > sourceCanvas.height) sourceY = sourceCanvas.height - sourceSize;

      // 绘制放大后的图像
      magCtx.imageSmoothingEnabled = false;
      magCtx.drawImage(
        sourceCanvas,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, size, size
      );

      // 绘制十字准星
      magCtx.strokeStyle = '#ffffff';
      magCtx.lineWidth = 1;
      magCtx.beginPath();
      magCtx.moveTo(size / 2, 0);
      magCtx.lineTo(size / 2, size);
      magCtx.moveTo(0, size / 2);
      magCtx.lineTo(size, size / 2);
      magCtx.stroke();

      // 绘制中心点
      magCtx.fillStyle = '#ff0000';
      magCtx.fillRect(size / 2 - 1, size / 2 - 1, 2, 2);
    },

    /**
     * 更新放大镜位置
     */
    updateMagnifier(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches[0];
      const touchAny = touch as any;
      const x = touchAny.x || 0;
      const y = touchAny.y || 0;

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
     * RGB转HSL
     */
    rgbToHsl(r: number, g: number, b: number): string {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    },

    /**
     * 切换颜色格式
     */
    switchColorFormat() {
      const formats: ('hex' | 'rgb' | 'hsl')[] = ['hex', 'rgb', 'hsl'];
      const currentIndex = formats.indexOf(this.data.colorFormat);
      const nextIndex = (currentIndex + 1) % formats.length;
      this.setData({ colorFormat: formats[nextIndex] });
    },

    /**
     * 获取当前显示的颜色值
     */
    getCurrentColor(): string {
      const { colorFormat, pickedColor, pickedColorRgb, pickedColorHsl } = this.data;
      switch (colorFormat) {
        case 'rgb': return pickedColorRgb;
        case 'hsl': return pickedColorHsl;
        default: return pickedColor;
      }
    },

    /**
     * 复制颜色到剪贴板
     */
    copyColor() {
      const color = (this as any).getCurrentColor();
      if (!color) return;

      wx.setClipboardData({
        data: color,
        success: () => {
          showSuccess('颜色已复制');
          // 添加到页面历史记录
          (this as any).addToHistory(this.data.pickedColor);
          // 保存到全局历史记录
          this.saveHistory();
        }
      });
    },

    /**
     * 保存到全局历史记录
     */
    saveHistory() {
      const { imagePath, pickedColor, pickedColorRgb, pickedColorHsl, colorFormat } = this.data;
      if (!pickedColor) return;

      saveToHistory({
        type: 'colorpicker',
        typeName: '图片取色',
        originalPath: imagePath,
        resultPath: '', // 取色不生成图片
        params: {
          color: pickedColor,
          rgb: pickedColorRgb,
          hsl: pickedColorHsl,
          format: colorFormat
        }
      });
    },

    /**
     * 添加到历史记录
     */
    addToHistory(color: string) {
      if (!color) return;
      const { colorHistory } = this.data;
      // 去重并限制数量
      const newHistory = [color, ...colorHistory.filter(c => c !== color)].slice(0, 8);
      this.setData({ colorHistory: newHistory });
    },

    /**
     * 从历史记录选择颜色
     */
    selectFromHistory(e: WechatMiniprogram.TouchEvent) {
      const color = e.currentTarget.dataset.color;
      if (color) {
        // 解析颜色值
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        this.setData({
          pickedColor: color,
          pickedColorRgb: `rgb(${r}, ${g}, ${b})`,
          pickedColorHsl: (this as any).rgbToHsl(r, g, b),
        });
      }
    },

    /**
     * 收藏/取消收藏颜色
     */
    toggleFavorite() {
      const { pickedColor, favoriteColors } = this.data;
      if (!pickedColor) return;

      let newFavorites: string[];
      if (favoriteColors.includes(pickedColor)) {
        newFavorites = favoriteColors.filter(c => c !== pickedColor);
      } else {
        newFavorites = [pickedColor, ...favoriteColors].slice(0, 12);
      }

      this.setData({ favoriteColors: newFavorites });
      wx.setStorageSync(STORAGE_KEYS.FAVORITE_COLORS, newFavorites);
      showSuccess(favoriteColors.includes(pickedColor) ? '已取消收藏' : '已收藏');
    },

    /**
     * 从收藏选择颜色
     */
    selectFromFavorites(e: WechatMiniprogram.TouchEvent) {
      const color = e.currentTarget.dataset.color;
      if (color) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        this.setData({
          pickedColor: color,
          pickedColorRgb: `rgb(${r}, ${g}, ${b})`,
          pickedColorHsl: (this as any).rgbToHsl(r, g, b),
        });
      }
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
     * 重置
     */
    resetPicker() {
      this.setData({
        pickedColor: '',
        pickedColorRgb: '',
        pickedColorHsl: '',
        colorHistory: [],
      });
    },
  },
});
