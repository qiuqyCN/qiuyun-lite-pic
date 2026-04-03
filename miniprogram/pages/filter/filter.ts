// filter.ts
// 滤镜美化页面

import { chooseImage } from '../../utils/image';
import { createCanvasContext, canvasToTempFile } from '../../utils/canvas';
import { saveImageToAlbum } from '../../utils/file';
import { handleError, showSuccess, showLoading } from '../../utils/error';
import { ALL_FILTERS, generateFilterStyle } from '../../constants/filters';
import type { ImageInfo, FilterParams } from '../../types/index';

/** 滤镜页面数据接口 */
interface FilterData {
  /** 原图路径 */
  imagePath: string;
  /** 处理后图片路径 */
  filteredPath: string;
  /** 图片宽度 */
  imageWidth: number;
  /** 图片高度 */
  imageHeight: number;
  /** 滤镜列表 */
  filterList: FilterParams[];
  /** 当前选中的滤镜ID */
  currentFilter: string;
  /** 滤镜强度 0-100 */
  filterIntensity: number;
  /** 输出格式 */
  fileType: 'jpg' | 'png';
  /** 是否处理中 */
  isProcessing: boolean;
  /** 是否有图片 */
  hasImage: boolean;
}

Component({
  data: {
    // 图片信息
    imagePath: '',
    filteredPath: '',
    imageWidth: 0,
    imageHeight: 0,

    // 滤镜列表 - 使用 ALL_FILTERS 替代硬编码
    filterList: ALL_FILTERS,

    // 当前选中的滤镜
    currentFilter: 'original',

    // 滤镜强度
    filterIntensity: 100,

    // 输出格式
    fileType: 'jpg',

    // 状态
    isProcessing: false,
    hasImage: false
  } as FilterData,

  methods: {
    /**
     * 选择图片
     * 使用 chooseImage 工具函数替代 wx.chooseMedia
     */
    async chooseImage() {
      const hideLoading = showLoading('加载图片中...');

      try {
        const imageInfo: ImageInfo = await chooseImage();

        this.setData({
          imagePath: imageInfo.path,
          filteredPath: imageInfo.path,
          imageWidth: imageInfo.width,
          imageHeight: imageInfo.height,
          hasImage: true,
          currentFilter: 'original',
          filterIntensity: 100
        });

        showSuccess('图片加载成功');
      } catch (error) {
        handleError(error, '图片选择失败');
      } finally {
        hideLoading();
      }
    },

    /**
     * 选择滤镜
     * @param e - 组件事件对象
     */
    onFilterSelect(e: WechatMiniprogram.CustomEvent) {
      const filterId = e.detail.item.id as string;
      this.setData({ currentFilter: filterId });
      this.applyFilter(filterId, this.data.filterIntensity);
    },

    /**
     * 强度滑块变化
     * @param e - 滑块变化事件对象
     */
    onIntensityChange(e: WechatMiniprogram.CustomEvent) {
      const intensity = e.detail.value as number;
      this.setData({ filterIntensity: intensity });
      this.applyFilter(this.data.currentFilter, intensity);
    },

    /**
     * 格式选择变化
     */
    onFormatChange(e: WechatMiniprogram.CustomEvent) {
      const format = e.detail.format as 'jpg' | 'png';
      this.setData({ fileType: format });
    },

    /**
     * 应用滤镜
     * @param filterType - 滤镜类型ID
     * @param intensity - 滤镜强度 0-100
     */
    async applyFilter(filterType: string, intensity: number) {
      if (!this.data.hasImage || filterType === 'original') {
        if (filterType === 'original') {
          this.setData({ filteredPath: this.data.imagePath });
        }
        return;
      }

      this.setData({ isProcessing: true });

      try {
        // 使用 createCanvasContext 工具函数获取 Canvas 上下文
        const { canvas, ctx } = await createCanvasContext('filterCanvas', this);

        if (!ctx) {
          throw new Error('CanvasContext获取失败');
        }

        const { imageWidth, imageHeight, imagePath } = this.data;

        // 限制处理尺寸，提高性能
        const maxSize = 800; // 降低最大尺寸以提高兼容性
        let canvasWidth = imageWidth;
        let canvasHeight = imageHeight;

        if (canvasWidth > maxSize || canvasHeight > maxSize) {
          if (canvasWidth > canvasHeight) {
            canvasHeight = Math.floor((canvasHeight * maxSize) / canvasWidth);
            canvasWidth = maxSize;
          } else {
            canvasWidth = Math.floor((canvasWidth * maxSize) / canvasHeight);
            canvasHeight = maxSize;
          }
        }

        console.log('Canvas尺寸:', canvasWidth, 'x', canvasHeight);

        // 设置canvas尺寸
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // 创建图片对象
        const image = canvas.createImage();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => {
            console.log('图片加载成功');
            resolve();
          };
          image.onerror = (err: any) => {
            console.error('图片加载失败:', err);
            reject(new Error('图片加载失败'));
          };
          image.src = imagePath;
        });

        // 清除画布
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 直接使用像素级处理（兼容性更好）
        const intensityRatio = intensity / 100;

        console.log('开始绘制图片');
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        console.log('图片绘制完成');

        // 应用像素级滤镜
        if (filterType !== 'original' && filterType !== 'blur') {
          console.log('开始应用像素滤镜:', filterType);
          await this.applyPixelFilter(ctx, canvasWidth, canvasHeight, filterType, intensityRatio);
          console.log('像素滤镜应用完成');
        }

        // 使用 canvasToTempFile 工具函数导出处理后的图片
        console.log('开始导出图片');
        const tempFilePath = await canvasToTempFile(canvas, {
          fileType: this.data.fileType,
          quality: 0.92
        });

        console.log('图片导出成功:', tempFilePath);

        this.setData({
          filteredPath: tempFilePath,
          isProcessing: false
        });

      } catch (err) {
        console.error('滤镜应用失败:', err);
        handleError(err, '滤镜应用失败');
        this.setData({ isProcessing: false });
      }
    },

    /**
     * 像素级滤镜处理（兼容性更好）
     * @param ctx - Canvas 2D 上下文
     * @param width - 画布宽度
     * @param height - 画布高度
     * @param filterType - 滤镜类型
     * @param intensity - 滤镜强度 0-1
     */
    async applyPixelFilter(
      ctx: WechatMiniprogram.CanvasContext,
      width: number,
      height: number,
      filterType: string,
      intensity: number
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageData = (ctx as any).getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          switch (filterType) {
            case 'bw':
              // 黑白
              {
                const gray = r * 0.299 + g * 0.587 + b * 0.114;
                r = r + (gray - r) * intensity;
                g = g + (gray - g) * intensity;
                b = b + (gray - b) * intensity;
              }
              break;

            case 'sepia':
              // 怀旧
              {
                const tr = r * 0.393 + g * 0.769 + b * 0.189;
                const tg = r * 0.349 + g * 0.686 + b * 0.168;
                const tb = r * 0.272 + g * 0.534 + b * 0.131;
                r = r + (tr - r) * intensity;
                g = g + (tg - g) * intensity;
                b = b + (tb - b) * intensity;
              }
              break;

            case 'bright':
              // 明亮
              {
                const brightness = 1 + intensity * 0.5;
                r = Math.min(255, r * brightness);
                g = Math.min(255, g * brightness);
                b = Math.min(255, b * brightness);
              }
              break;

            case 'vivid':
              // 高对比
              {
                const contrast = 1 + intensity * 0.5;
                r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
                g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
                b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
              }
              break;

            case 'warm':
              // 暖色
              r = Math.min(255, r + 20 * intensity);
              g = Math.min(255, g + 10 * intensity);
              b = Math.max(0, b - 10 * intensity);
              break;

            case 'cool':
              // 冷色
              r = Math.max(0, r - 10 * intensity);
              g = Math.min(255, g + 5 * intensity);
              b = Math.min(255, b + 20 * intensity);
              break;

            case 'film':
            case 'vintage':
              // 胶片/老照片
              {
                const vr = r * 0.9 + g * 0.1;
                const vg = g * 0.9 + b * 0.1;
                const vb = b * 0.8 + r * 0.1;
                r = r + (vr - r) * intensity;
                g = g + (vg - g) * intensity;
                b = b + (vb - b) * intensity;
              }
              break;

            default:
              // 其他滤镜使用默认处理
              break;
          }

          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx as any).putImageData(imageData, 0, 0);
      } catch (err) {
        console.error('像素处理失败:', err);
      }
    },

    /**
     * 预览图片
     */
    previewImage() {
      if (!this.data.filteredPath) return;

      wx.previewImage({
        urls: [this.data.filteredPath],
        current: this.data.filteredPath
      });
    },

    /**
     * 保存到相册
     * 使用 saveImageToAlbum 工具函数替代 wx.saveImageToPhotosAlbum
     */
    async saveToAlbum() {
      if (!this.data.filteredPath) return;

      const hideLoading = showLoading('保存中...');

      try {
        await saveImageToAlbum(this.data.filteredPath);
        showSuccess('已保存到相册');

        // 保存到历史记录
        this.saveToHistory();
      } catch (err) {
        handleError(err, '保存失败');
      } finally {
        hideLoading();
      }
    },

    /**
     * 保存到历史记录
     */
    saveToHistory() {
      const history = wx.getStorageSync('processHistory') || [];
      history.unshift({
        id: Date.now().toString(),
        type: 'filter',
        typeName: '滤镜美化',
        originalPath: this.data.imagePath,
        resultPath: this.data.filteredPath,
        createTime: Date.now(),
        timeStr: new Date().toLocaleString(),
        params: {
          filter: this.data.currentFilter,
          intensity: this.data.filterIntensity
        }
      });
      wx.setStorageSync('processHistory', history.slice(0, 20));
    },

    /**
     * 重置滤镜
     */
    resetFilter() {
      this.setData({
        currentFilter: 'original',
        filterIntensity: 100,
        filteredPath: this.data.imagePath
      });
    }
  }
});
