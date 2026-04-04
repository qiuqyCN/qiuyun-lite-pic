// types/index.ts
// 全局类型定义

/** 图片信息 */
export interface ImageInfo {
  /** 图片路径 */
  path: string;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
  /** 文件大小（字节） */
  size: number;
  /** 图片格式 */
  type: string;
}

/** 处理选项 */
export interface ProcessOptions {
  /** 压缩质量 0-100 */
  quality?: number;
  /** 目标宽度 */
  width?: number;
  /** 目标高度 */
  height?: number;
  /** 输出格式 */
  format?: 'jpg' | 'png';
  /** 保持宽高比 */
  maintainAspectRatio?: boolean;
}

/** 处理结果 */
export interface ProcessResult {
  /** 结果图片路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
}

/** 预设尺寸 */
export interface PresetSize {
  /** 预设ID */
  id: string;
  /** 预设名称 */
  name: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 分类 */
  category: string;
}

/** 滤镜参数 */
export interface FilterParams {
  /** 滤镜ID */
  id: string;
  /** 滤镜名称 */
  name: string;
  /** 亮度 -100 到 100 */
  brightness: number;
  /** 对比度 -100 到 100 */
  contrast: number;
  /** 饱和度 -100 到 100 */
  saturation: number;
  /** 模糊度 0 到 100 */
  blur?: number;
  /** 色温 -100 到 100 */
  warmth?: number;
  /** 色调 -100 到 100 */
  tint?: number;
}

/** 工具项 */
export interface ToolItem {
  /** 工具ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 图标 */
  icon: string;
  /** 图标背景色 */
  iconBg: string;
  /** 页面路径 */
  path: string;
  /** 是否热门 */
  isHot?: boolean;
  /** 是否新品 */
  isNew?: boolean;
}

/** 工具分类 */
export interface ToolCategory {
  /** 分类ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** 工具列表 */
  tools: ToolItem[];
}

/** 历史记录项 */
export interface HistoryItem {
  /** 记录ID */
  id: string;
  /** 处理类型 */
  type: string;
  /** 类型名称 */
  typeName: string;
  /** 原图路径 */
  originalPath: string;
  /** 结果路径 */
  resultPath: string;
  /** 处理时间 */
  timestamp: number;
  /** 文件大小 */
  fileSize?: number;
  /** 处理参数 */
  params?: Record<string, any>;
}

/** Canvas 上下文信息 */
export interface CanvasContext {
  /** Canvas 节点 */
  canvas: any;
  /** 2D 上下文 */
  ctx: any;
  /** Canvas 宽度 */
  width: number;
  /** Canvas 高度 */
  height: number;
}

/** 水印配置 */
export interface WatermarkConfig {
  /** 水印文字 */
  text: string;
  /** 字体大小 */
  fontSize: number;
  /** 字体颜色 */
  color: string;
  /** 透明度 0-1 */
  opacity: number;
  /** 旋转角度 */
  rotation: number;
  /** 水平间距 */
  gapX: number;
  /** 垂直间距 */
  gapY: number;
}

/** 拼图布局 */
export interface CollageLayout {
  /** 布局ID */
  id: string;
  /** 布局名称 */
  name: string;
  /** 布局图标 */
  icon: string;
  /** 图片数量 */
  imageCount: number;
  /** 布局配置 */
  config: LayoutConfig[];
}

/** 布局配置项 */
export interface LayoutConfig {
  /** 相对X坐标 */
  x: number;
  /** 相对Y坐标 */
  y: number;
  /** 相对宽度 */
  width: number;
  /** 相对高度 */
  height: number;
}

/** 压缩选项 */
export interface CompressOptions {
  /** 压缩质量 0-100 */
  quality: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
}

/** 尺寸调整选项 */
export interface ResizeOptions {
  /** 目标宽度 */
  width: number;
  /** 目标高度 */
  height: number;
  /** 保持宽高比 */
  maintainAspectRatio: boolean;
}

/** 格式转换选项 */
export interface ConvertOptions {
  /** 目标格式 */
  format: 'jpg' | 'png';
  /** 背景颜色（PNG转JPG时） */
  backgroundColor?: string;
}
