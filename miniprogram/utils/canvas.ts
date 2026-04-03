// utils/canvas.ts
// Canvas 2D 工具函数

import type { CanvasContext } from '../types/index';

type CanvasCtx = any;
type TextAlign = any;
type TextBaseline = any;

/**
 * 创建 Canvas 2D 上下文
 * @param id Canvas ID
 * @param component 组件实例
 * @returns CanvasContext
 */
export const createCanvasContext = async (
  id: string,
  component?: any
): Promise<CanvasContext> => {
  return new Promise((resolve, reject) => {
    const query = component ? component.createSelectorQuery() : wx.createSelectorQuery();
    
    query
      .select(`#${id}`)
      .fields({ node: true, size: true })
      .exec((res: any) => {
        if (!res[0] || !res[0].node) {
          reject(new Error(`Canvas #${id} not found`));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        resolve({
          canvas,
          ctx,
          width: res[0].width,
          height: res[0].height
        });
      });
  });
};

/**
 * 设置 Canvas 尺寸
 * @param canvas Canvas 节点
 * @param width 宽度
 * @param height 高度
 */
export const setCanvasSize = (
  canvas: any,
  width: number,
  height: number
): void => {
  canvas.width = width;
  canvas.height = height;
};

/**
 * 加载图片到 Canvas
 * @param ctx Canvas 上下文
 * @param src 图片路径
 * @param x X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param height 高度
 * @returns Promise
 */
export const drawImage = (
  ctx: CanvasCtx,
  src: string,
  x: number = 0,
  y: number = 0,
  width?: number,
  height?: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = { path: src } as any;
    
    img.onload = () => {
      if (width !== undefined && height !== undefined) {
        ctx.drawImage(img, x, y, width, height);
      } else {
        ctx.drawImage(img, x, y);
      }
      resolve();
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
  });
};

/**
 * 将 Canvas 导出为临时文件
 * @param canvas Canvas 节点
 * @param options 导出选项
 * @returns 临时文件路径
 */
export const canvasToTempFile = async (
  canvas: any,
  options: {
    fileType?: 'jpg' | 'png';
    quality?: number;
    width?: number;
    height?: number;
  } = {}
): Promise<string> => {
  const { fileType = 'jpg', quality = 0.9, width, height } = options;

  const res = await wx.canvasToTempFilePath({
    canvas,
    fileType,
    quality,
    width,
    height
  });

  return res.tempFilePath;
};

/**
 * 清空 Canvas
 * @param ctx Canvas 上下文
 * @param width 宽度
 * @param height 高度
 */
export const clearCanvas = (
  ctx: CanvasCtx,
  width: number,
  height: number
): void => {
  ctx.clearRect(0, 0, width, height);
};

/**
 * 填充背景色
 * @param ctx Canvas 上下文
 * @param width 宽度
 * @param height 高度
 * @param color 颜色
 */
export const fillBackground = (
  ctx: CanvasCtx,
  width: number,
  height: number,
  color: string = '#FFFFFF'
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
};

/**
 * 绘制圆角矩形
 * @param ctx Canvas 上下文
 * @param x X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param height 高度
 * @param radius 圆角半径
 */
export const drawRoundRect = (
  ctx: CanvasCtx,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * 绘制圆形
 * @param ctx Canvas 上下文
 * @param x 圆心X
 * @param y 圆心Y
 * @param radius 半径
 */
export const drawCircle = (
  ctx: CanvasCtx,
  x: number,
  y: number,
  radius: number
): void => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
};

/**
 * 绘制文字
 * @param ctx Canvas 上下文
 * @param text 文字内容
 * @param x X坐标
 * @param y Y坐标
 * @param options 选项
 */
export const drawText = (
  ctx: CanvasCtx,
  text: string,
  x: number,
  y: number,
  options: {
    font?: string;
    color?: string;
    align?: TextAlign;
    baseline?: TextBaseline;
  } = {}
): void => {
  const { font = '14px sans-serif', color = '#000000', align = 'left', baseline = 'alphabetic' } = options;
  
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
};

/**
 * 绘制多行文字
 * @param ctx Canvas 上下文
 * @param text 文字内容
 * @param x X坐标
 * @param y Y坐标
 * @param maxWidth 最大宽度
 * @param lineHeight 行高
 */
export const drawMultilineText = (
  ctx: CanvasCtx,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void => {
  const chars = text.split('');
  let line = '';
  let currentY = y;

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = chars[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  ctx.fillText(line, x, currentY);
};

/**
 * 保存 Canvas 状态
 * @param ctx Canvas 上下文
 */
export const saveContext = (ctx: CanvasCtx): void => {
  ctx.save();
};

/**
 * 恢复 Canvas 状态
 * @param ctx Canvas 上下文
 */
export const restoreContext = (ctx: CanvasCtx): void => {
  ctx.restore();
};

/**
 * 设置裁剪区域（矩形）
 * @param ctx Canvas 上下文
 * @param x X坐标
 * @param y Y坐标
 * @param width 宽度
 * @param height 高度
 */
export const clipRect = (
  ctx: CanvasCtx,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
};

/**
 * 设置裁剪区域（圆形）
 * @param ctx Canvas 上下文
 * @param x 圆心X
 * @param y 圆心Y
 * @param radius 半径
 */
export const clipCircle = (
  ctx: CanvasCtx,
  x: number,
  y: number,
  radius: number
): void => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
};

/**
 * 旋转 Canvas
 * @param ctx Canvas 上下文
 * @param angle 角度（度）
 * @param centerX 旋转中心X
 * @param centerY 旋转中心Y
 */
export const rotate = (
  ctx: CanvasCtx,
  angle: number,
  centerX: number = 0,
  centerY: number = 0
): void => {
  const rad = (angle * Math.PI) / 180;
  ctx.translate(centerX, centerY);
  ctx.rotate(rad);
  ctx.translate(-centerX, -centerY);
};

/**
 * 缩放 Canvas
 * @param ctx Canvas 上下文
 * @param scaleX X轴缩放
 * @param scaleY Y轴缩放
 */
export const scale = (
  ctx: CanvasCtx,
  scaleX: number,
  scaleY: number
): void => {
  ctx.scale(scaleX, scaleY);
};

/**
 * 水平翻转
 * @param ctx Canvas 上下文
 * @param centerX 中心点X
 */
export const flipHorizontal = (
  ctx: CanvasCtx,
  centerX: number
): void => {
  ctx.translate(centerX, 0);
  ctx.scale(-1, 1);
  ctx.translate(-centerX, 0);
};

/**
 * 垂直翻转
 * @param ctx Canvas 上下文
 * @param centerY 中心点Y
 */
export const flipVertical = (
  ctx: CanvasCtx,
  centerY: number
): void => {
  ctx.translate(0, centerY);
  ctx.scale(1, -1);
  ctx.translate(0, -centerY);
};
