// signature.ts
// 电子签名生成器

import { saveImageToAlbumWithUI } from '../../utils/file';
import { saveToHistory } from '../../utils/history';
import { handleError } from '../../utils/error';
import { onShareAppMessage, onShareTimeline } from '../../utils/share';

interface SignatureData {
  penColor: string;
  lineWidth: number;
  hasSignature: boolean;
  isSaving: boolean;
  presetColors: string[];
  fileType: 'jpg' | 'png';
  isDrawing: boolean;
}

// 预设颜色（与标注涂鸦一致，包含白色）
const PRESET_COLORS = [
  '#000000', '#ffffff', '#808080',
  '#ff0000', '#ff4444', '#ff8888',
  '#ff6600', '#ff8800', '#ffaa00',
  '#ffff00', '#ffff44', '#88ff88',
  '#00ff00', '#44ff44', '#41bc3f',
  '#00ffff', '#44ffff', '#0066ff',
  '#0000ff', '#4444ff', '#8800ff',
  '#ff00ff', '#ff44ff', '#ff0088',
  '#8b4513', '#a0522d', '#cd853f'
];

Component({
  data: {
    penColor: '#000000',
    lineWidth: 6,
    hasSignature: false,
    isSaving: false,
    presetColors: PRESET_COLORS,
    fileType: 'png',
    isDrawing: false,
  } as SignatureData,

  lifetimes: {
    attached() {
      (this as any)._canvasContext = null;
    }
  },

  pageLifetimes: {
    show() {
      this.initCanvas();
    }
  },

  methods: {
    onShareAppMessage() {
      return onShareAppMessage('signature');
    },

    onShareTimeline() {
      return onShareTimeline('signature');
    },

    async initCanvas() {
      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const query = wx.createSelectorQuery().in(this);
        const canvasRes = await new Promise<any>((resolve) => {
          query.select('#signatureCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              resolve(res[0]);
            });
        });

        if (!canvasRes || !canvasRes.node) return;

        const canvasNode = canvasRes.node;

        // 获取容器尺寸
        const containerRes = await new Promise<any>((resolve) => {
          query.select('.canvas-container')
            .boundingClientRect()
            .exec((res) => {
              resolve(res[0]);
            });
        });

        if (!containerRes) return;

        const displayWidth = Math.floor(containerRes.width);
        const displayHeight = Math.floor(containerRes.height);

        // 设置canvas像素尺寸等于显示尺寸（不使用DPR缩放，与标注涂鸦一致）
        canvasNode.width = displayWidth;
        canvasNode.height = displayHeight;

        const ctx = canvasNode.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        (this as any)._canvasContext = { canvas: canvasNode, ctx };

        this._saveHistory();
      } catch (err) {
        handleError(err, '画布初始化失败');
      }
    },

    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext) return;

      const touch = e.touches[0] as any;
      const { ctx } = canvasContext;
      const { penColor, lineWidth } = this.data;

      this.setData({ isDrawing: true });

      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.moveTo(touch.x, touch.y);
    },

    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isDrawing) return;

      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext) return;

      const touch = e.touches[0] as any;
      const { ctx } = canvasContext;

      ctx.lineTo(touch.x, touch.y);
      ctx.stroke();
    },

    onTouchEnd() {
      const canvasContext = (this as any)._canvasContext;
      if (canvasContext) {
        const { ctx } = canvasContext;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      this.setData({ isDrawing: false });

      this._saveHistory();
      this.setData({ hasSignature: true });
    },

    preventScroll() {
      // 空函数，阻止事件冒泡
    },

    _saveHistory() {
      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext) return;

      const { canvas, ctx } = canvasContext;

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (!(this as any)._history) {
          (this as any)._history = [];
          (this as any)._historyIndex = -1;
        }
        (this as any)._history = (this as any)._history.slice(0, (this as any)._historyIndex + 1);
        (this as any)._history.push(imageData);
        (this as any)._historyIndex = (this as any)._history.length - 1;

        if ((this as any)._history.length > 30) {
          (this as any)._history.shift();
          (this as any)._historyIndex--;
        }
      } catch (err) {
        // ignore
      }
    },

    undo() {
      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext) return;
      if ((this as any)._historyIndex <= 0) return;

      (this as any)._historyIndex--;
      const imageData = (this as any)._history[(this as any)._historyIndex];
      const { ctx, canvas } = canvasContext;

      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
      } catch (err) {
        // ignore
      }

      if ((this as any)._historyIndex === 0) {
        this.setData({ hasSignature: false });
      }
    },

    redo() {
      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext) return;
      if ((this as any)._historyIndex >= (this as any)._history.length - 1) return;

      (this as any)._historyIndex++;
      const imageData = (this as any)._history[(this as any)._historyIndex];
      const { ctx, canvas } = canvasContext;

      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
      } catch (err) {
        // ignore
      }

      this.setData({ hasSignature: true });
    },

    clearCanvas() {
      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext) return;

      const { ctx, canvas } = canvasContext;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      (this as any)._history = [];
      (this as any)._historyIndex = -1;
      this._saveHistory();

      this.setData({ hasSignature: false });
    },

    onColorSelect(e: WechatMiniprogram.TouchEvent) {
      const color = e.currentTarget.dataset.color;
      this.setData({ penColor: color });
    },

    onLineWidthChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ lineWidth: e.detail.value });
    },

    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ fileType: e.detail.format });
    },

    async saveToAlbum() {
      const canvasContext = (this as any)._canvasContext;
      if (!canvasContext || !this.data.hasSignature) {
        wx.showToast({ title: '请先签名', icon: 'none' });
        return;
      }

      this.setData({ isSaving: true });

      try {
        const { canvas } = canvasContext;
        const { fileType } = this.data;

        const res = await new Promise<any>((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas,
            fileType,
            quality: 1,
            success: resolve,
            fail: reject
          });
        });

        await saveImageToAlbumWithUI(res.tempFilePath, {
          onSuccess: () => this.saveHistory(res.tempFilePath)
        });
      } catch (err) {
        handleError(err, '保存失败');
      } finally {
        this.setData({ isSaving: false });
      }
    },

    saveHistory(resultPath: string) {
      saveToHistory({
        type: 'signature',
        typeName: '电子签名',
        originalPath: '',
        resultPath,
        params: {
          penColor: this.data.penColor,
          lineWidth: this.data.lineWidth
        }
      });
    },

    resetSignature() {
      this.clearCanvas();
      this.setData({
        penColor: '#000000',
        lineWidth: 6,
        fileType: 'png',
      });
    }
  }
});
