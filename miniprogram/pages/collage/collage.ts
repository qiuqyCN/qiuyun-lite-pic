// collage.ts
// 拼图拼接页面

import { chooseImage, chooseMultipleImages, getImageInfo } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { saveToHistory } from '../../utils/history';
import { handleError, showSuccess } from '../../utils/error';
import { debounce } from '../../utils/debounce';

/** 布局模板 */
interface LayoutTemplate {
  id: string;
  name: string;
  icon: string;
  cols: number;
  rows: number;
  maxImages: number;
  mode?: 'grid' | 'horizontal' | 'vertical';
}

/** 图片尺寸信息 */
interface ImageSizeInfo {
  width: number;
  height: number;
}

/** 组件数据 */
interface CollageData {
  /** 图片列表 */
  images: string[];
  /** 图片尺寸信息列表 */
  imageInfos: ImageSizeInfo[];
  /** 布局模板列表 */
  layoutTemplates: LayoutTemplate[];
  /** 当前布局 */
  currentLayout: LayoutTemplate;
  /** 间距设置 */
  spacing: number;
  /** 圆角设置 */
  borderRadius: number;
  /** 背景颜色 */
  backgroundColor: string;
  /** 预设颜色列表 */
  colorList: string[];
  /** 输出宽度 */
  outputWidth: number;
  /** 输出质量 */
  outputQuality: number;
  /** 输出格式 */
  fileType: 'jpg' | 'png';
  /** 是否处理中 */
  isProcessing: boolean;
  /** 是否有图片 */
  hasImages: boolean;
  /** 结果图片路径 */
  resultPath: string;
  /** 是否显示预览 */
  showPreview: boolean;
}

Component({
  data: {
    // 图片列表
    images: [] as string[],
    imageInfos: [] as ImageSizeInfo[],

    // 布局模板
    layoutTemplates: [
      { id: 'grid2', name: '双格', icon: '⬛⬛', cols: 2, rows: 1, maxImages: 9 },
      { id: 'grid3', name: '三格', icon: '⬛⬛⬛', cols: 3, rows: 1, maxImages: 9 },
      { id: 'grid4', name: '四宫格', icon: '⬛⬛\n⬛⬛', cols: 2, rows: 2, maxImages: 9 },
      { id: 'grid6', name: '六宫格', icon: '⬛⬛⬛\n⬛⬛⬛', cols: 3, rows: 2, maxImages: 9 },
      { id: 'grid9', name: '九宫格', icon: '⬛⬛⬛\n⬛⬛⬛\n⬛⬛⬛', cols: 3, rows: 3, maxImages: 9 },
      { id: 'horizontal', name: '横向拼接', icon: '➡️', cols: 1, rows: 1, maxImages: 9, mode: 'horizontal' },
      { id: 'vertical', name: '纵向拼接', icon: '⬇️', cols: 1, rows: 1, maxImages: 9, mode: 'vertical' }
    ],

    // 当前布局
    currentLayout: { id: 'grid2', name: '双格', cols: 2, rows: 1, maxImages: 9, mode: 'grid' } as LayoutTemplate,

    // 间距设置
    spacing: 10,
    borderRadius: 0,
    backgroundColor: '#ffffff',

    // 预设颜色
    colorList: ['#ffffff', '#000000', '#f5f5f7', '#ffe8e8', '#e8f5ff', '#fff8e8', '#f0ffe8', '#f8e8ff'],

    // 输出设置
    outputWidth: 1200,
    outputQuality: 90,

    // 输出格式
    fileType: 'jpg',

    // 状态
    isProcessing: false,
    hasImages: false,
    resultPath: '',
    showPreview: false
  } as CollageData,

  methods: {
    /**
     * 选择图片
     * 根据当前布局的最大图片数量选择图片
     */
    async chooseImages() {
      const maxCount = this.data.currentLayout.maxImages;

      try {
        const imageInfos = await chooseMultipleImages(maxCount);
        const imagePaths = imageInfos.map(img => img.path);
        await this.loadImageInfos(imagePaths);
      } catch (error) {
        handleError(error, '选择图片失败');
      }
    },

    /**
     * 添加图片
     * 在当前图片基础上继续添加图片
     */
    async addImages() {
      const currentCount = this.data.images.length;
      const maxCount = this.data.currentLayout.maxImages;
      const remaining = maxCount - currentCount;

      if (remaining <= 0) {
        wx.showToast({ title: '已达最大数量', icon: 'none' });
        return;
      }

      try {
        const images = await chooseMultipleImages(remaining);
        const newPaths = images.map(img => img.path);
        await this.loadImageInfos([...this.data.images, ...newPaths]);
      } catch (error) {
        handleError(error, '添加图片失败');
      }
    },

    /**
     * 加载图片信息
     * @param imagePaths 图片路径数组
     */
    async loadImageInfos(imagePaths: string[]) {
      const infos: ImageSizeInfo[] = [];

      for (const path of imagePaths) {
        try {
          const info = await getImageInfo(path);
          infos.push({ width: info.width, height: info.height });
        } catch (err) {
          infos.push({ width: 100, height: 100 });
        }
      }

      this.setData({
        images: imagePaths,
        imageInfos: infos,
        hasImages: imagePaths.length > 0,
        resultPath: '',
        showPreview: false
      }, () => {
        if (imagePaths.length > 0) {
          this.generateCollage();
        }
      });
    },

    /**
     * 删除图片
     * @param e 触摸事件
     */
    removeImage(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index as number;
      const images = [...this.data.images];
      const imageInfos = [...this.data.imageInfos];
      images.splice(index, 1);
      imageInfos.splice(index, 1);

      this.setData({
        images,
        imageInfos,
        hasImages: images.length > 0,
        resultPath: '',
        showPreview: false
      }, () => {
        if (images.length > 0) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 更换图片
     * @param e 触摸事件
     */
    async replaceImage(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index as number;

      try {
        const imageInfo = await chooseImage();
        const images = [...this.data.images];
        const imageInfos = [...this.data.imageInfos];
        images[index] = imageInfo.path;
        imageInfos[index] = { width: imageInfo.width, height: imageInfo.height };

        this.setData({ images, imageInfos }, () => {
          this.debouncedGenerate();
        });
      } catch (error) {
        handleError(error, '更换图片失败');
      }
    },

    /**
     * 选择布局
     * @param e 组件事件
     */
    onLayoutSelect(e: WechatMiniprogram.CustomEvent) {
      const template = e.detail.item;
      if (!template) return;

      const layout: LayoutTemplate = {
        id: template.id,
        name: template.name,
        icon: template.icon || '📐',
        cols: template.cols,
        rows: template.rows,
        maxImages: template.maxImages,
        mode: (template.mode || 'grid') as 'grid' | 'horizontal' | 'vertical'
      };

      // 如果当前图片数量超过新布局的最大数量，裁剪图片
      let images = [...this.data.images];
      let imageInfos = [...this.data.imageInfos];
      if (images.length > layout.maxImages) {
        images = images.slice(0, layout.maxImages);
        imageInfos = imageInfos.slice(0, layout.maxImages);
      }

      this.setData({
        currentLayout: layout,
        images,
        imageInfos,
        resultPath: '',
        showPreview: false
      }, () => {
        if (images.length > 0) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 间距变化
     * @param e 组件事件
     */
    onSpacingChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ spacing: e.detail.value }, () => {
        if (this.data.hasImages) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 圆角变化
     * @param e 组件事件
     */
    onRadiusChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ borderRadius: e.detail.value }, () => {
        if (this.data.hasImages) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 选择背景色
     * @param e 组件事件
     */
    onColorSelect(e: WechatMiniprogram.CustomEvent) {
      const color = e.detail.color;
      this.setData({ backgroundColor: color }, () => {
        if (this.data.hasImages) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 输出宽度变化
     * @param e 组件事件
     */
    onWidthChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ outputWidth: e.detail.value }, () => {
        if (this.data.hasImages) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 画质变化
     * @param e 组件事件
     */
    onQualityChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ outputQuality: e.detail.value }, () => {
        if (this.data.hasImages) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 格式选择变化
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ fileType: format }, () => {
        // 如果已经生成了拼图，重新生成以使用新格式
        if (this.data.resultPath && this.data.images.length > 0) {
          this.debouncedGenerate();
        }
      });
    },

    /**
     * 防抖生成（实时预览）
     */
    debouncedGenerate: debounce(function(this: any) {
      if (this.data.hasImages && !this.data.isProcessing) {
        this.generateCollage();
      }
    }, 500),

    /**
     * 重置拼图
     */
    resetCollage() {
      this.setData({
        images: [],
        imageInfos: [],
        hasImages: false,
        resultPath: '',
        showPreview: false,
        spacing: 10,
        borderRadius: 0,
        backgroundColor: '#ffffff'
      });
    },

    /**
     * 生成拼图
     */
    async generateCollage() {
      if (this.data.images.length === 0) return;

      this.setData({ isProcessing: true });

      try {
        const { images, imageInfos, currentLayout, spacing, borderRadius, backgroundColor, outputWidth, outputQuality } = this.data;

        // 获取canvas上下文
        const { canvas: canvasNode, ctx } = await createCanvasContext('collageCanvas', this);

        // 计算输出尺寸
        let canvasWidth: number, canvasHeight: number;

        if (currentLayout.mode === 'horizontal') {
          // 横向拼接
          const totalSpacing = spacing * (images.length - 1);
          const availableWidth = outputWidth - totalSpacing;
          let totalAspectRatio = 0;

          for (let i = 0; i < images.length; i++) {
            const info = imageInfos[i] || { width: 100, height: 100 };
            totalAspectRatio += info.width / info.height;
          }

          const cellHeight = Math.floor(availableWidth / totalAspectRatio);
          canvasWidth = outputWidth;
          canvasHeight = cellHeight;

          canvasNode.width = canvasWidth;
          canvasNode.height = canvasHeight;

          // 填充背景
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 绘制图片
          let currentX = 0;
          for (let i = 0; i < images.length; i++) {
            const info = imageInfos[i] || { width: 100, height: 100 };
            const cellWidth = Math.floor((info.width / info.height) * cellHeight);

            await this.drawImageToCanvas(ctx, canvasNode, images[i], currentX, 0, cellWidth, cellHeight, borderRadius);
            currentX += cellWidth + spacing;
          }

        } else if (currentLayout.mode === 'vertical') {
          // 纵向拼接
          const totalSpacing = spacing * (images.length - 1);

          let totalHeight = 0;
          const cellWidths: number[] = [];
          const cellHeights: number[] = [];

          for (let i = 0; i < images.length; i++) {
            const info = imageInfos[i] || { width: 100, height: 100 };
            const aspectRatio = info.height / info.width;
            const cellWidth = outputWidth;
            const cellHeight = Math.floor(cellWidth * aspectRatio);
            cellWidths.push(cellWidth);
            cellHeights.push(cellHeight);
            totalHeight += cellHeight;
          }

          canvasWidth = outputWidth;
          canvasHeight = totalHeight + totalSpacing;

          canvasNode.width = canvasWidth;
          canvasNode.height = canvasHeight;

          // 填充背景
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 绘制图片
          let currentY = 0;
          for (let i = 0; i < images.length; i++) {
            await this.drawImageToCanvas(ctx, canvasNode, images[i], 0, currentY, cellWidths[i], cellHeights[i], borderRadius);
            currentY += cellHeights[i] + spacing;
          }

        } else {
          // 网格布局 - 动态计算行数
          const cols = currentLayout.cols;
          const rows = Math.ceil(images.length / cols); // 根据图片数量动态计算行数
          const totalHSpacing = spacing * (cols - 1);
          const totalVSpacing = spacing * (rows - 1);

          // 限制最大高度，确保所有图片都能显示
          const maxHeight = 2400;
          const maxCellHeight = Math.floor((maxHeight - totalVSpacing) / rows);
          const maxCellWidth = Math.floor((outputWidth - totalHSpacing) / cols);

          // 单元格取较小值，保持正方形
          const cellSize = Math.min(maxCellWidth, maxCellHeight);
          const cellWidth = cellSize;
          const cellHeight = cellSize;

          canvasWidth = cols * cellWidth + totalHSpacing;
          canvasHeight = rows * cellHeight + totalVSpacing;

          canvasNode.width = canvasWidth;
          canvasNode.height = canvasHeight;

          // 填充背景
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 绘制图片 - 顺序绘制避免 Canvas 状态冲突
          for (let i = 0; i < images.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * (cellWidth + spacing);
            const y = row * (cellHeight + spacing);

            await this.drawImageToCanvas(ctx, canvasNode, images[i], x, y, cellWidth, cellHeight, borderRadius);
          }
        }

        // 导出图片
        const tempFilePath = await canvasToTempFile(canvasNode, {
          fileType: this.data.fileType,
          quality: outputQuality / 100
        });

        this.setData({
          resultPath: tempFilePath,
          isProcessing: false,
          showPreview: true
        });

      } catch (err) {
        handleError(err, '拼图生成失败');
        this.setData({ isProcessing: false });
      }
    },

    /**
     * 绘制图片到canvas（支持圆角）
     * @param ctx Canvas上下文
     * @param canvasNode Canvas节点
     * @param imagePath 图片路径
     * @param x X坐标
     * @param y Y坐标
     * @param width 宽度
     * @param height 高度
     * @param borderRadius 圆角半径
     */
    async drawImageToCanvas(
      ctx: any,
      canvasNode: any,
      imagePath: string,
      x: number,
      y: number,
      width: number,
      height: number,
      borderRadius: number
    ) {
      // 加载图片
      const image = canvasNode.createImage();

      // 等待图片加载完成
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imagePath;
      });

      // 保存当前状态
      ctx.save();

      try {
        // 创建矩形裁剪路径（必须始终裁剪，防止图片超出单元格）
        ctx.beginPath();
        if (borderRadius > 0) {
          // 圆角矩形
          ctx.moveTo(x + borderRadius, y);
          ctx.lineTo(x + width - borderRadius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
          ctx.lineTo(x + width, y + height - borderRadius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
          ctx.lineTo(x + borderRadius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
        ctx.lineTo(x, y + borderRadius);
          ctx.quadraticCurveTo(x, y, x + borderRadius, y);
        } else {
          // 普通矩形
          ctx.rect(x, y, width, height);
        }
        ctx.closePath();
        ctx.clip();

        // 计算图片绘制区域（保持比例裁剪填充）
        const imgAspect = image.width / image.height;
        const cellAspect = width / height;

        let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

        if (imgAspect > cellAspect) {
          // 图片更宽，以高度为基准
          drawHeight = height;
          drawWidth = height * imgAspect;
          drawX = x - (drawWidth - width) / 2;
          drawY = y;
        } else {
          // 图片更高，以宽度为基准
          drawWidth = width;
          drawHeight = width / imgAspect;
          drawX = x;
          drawY = y - (drawHeight - height) / 2;
        }

        // 绘制图片
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      } finally {
        // 确保恢复状态
        ctx.restore();
      }
    },

    /**
     * 预览图片
     */
    previewImage() {
      if (!this.data.resultPath) return;
      wx.previewImage({
        urls: [this.data.resultPath],
        current: this.data.resultPath
      });
    },

    /**
     * 保存到相册
     */
    async saveToAlbum() {
      if (!this.data.resultPath) return;

      try {
        await saveImageToAlbum(this.data.resultPath);
        showSuccess('已保存到相册');
        this.saveToHistory();
      } catch (error) {
        handleError(error, '保存失败');
      }
    },

    /**
     * 保存到历史记录
     */
    saveToHistory() {
      saveToHistory({
        type: 'collage',
        typeName: '拼图拼接',
        originalPath: this.data.images[0],
        resultPath: this.data.resultPath,
        params: {
          layout: this.data.currentLayout.name,
          imageCount: this.data.images.length,
          spacing: this.data.spacing
        }
      });
    }
  }
});
