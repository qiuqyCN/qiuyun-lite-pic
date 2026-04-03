// utils/error.ts
// 错误处理工具函数

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  CANVAS = 'CANVAS',
  USER_CANCEL = 'USER_CANCEL',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  type: ErrorType;
  code?: number;

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, code?: number) {
    super(message);
    this.type = type;
    this.code = code;
    this.name = 'AppError';
  }
}

/**
 * 错误消息映射
 */
const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络连接失败，请检查网络',
  [ErrorType.FILE]: '文件操作失败',
  [ErrorType.IMAGE]: '图片处理失败',
  [ErrorType.CANVAS]: '画布操作失败',
  [ErrorType.USER_CANCEL]: '用户取消操作',
  [ErrorType.PERMISSION]: '权限不足，请授权后重试',
  [ErrorType.UNKNOWN]: '操作失败，请重试'
};

/**
 * 处理错误
 * @param error 错误对象
 * @param customMessage 自定义消息
 */
export const handleError = (error: unknown, customMessage?: string): void => {
  console.error('Error:', error);

  let message = customMessage || '操作失败，请重试';
  let type = ErrorType.UNKNOWN;

  if (error instanceof AppError) {
    message = error.message || errorMessages[error.type];
    type = error.type;
  } else if (error instanceof Error) {
    // 根据错误消息判断类型
    if (error.message.includes('network') || error.message.includes('Network')) {
      type = ErrorType.NETWORK;
      message = errorMessages[ErrorType.NETWORK];
    } else if (error.message.includes('cancel') || error.message.includes('Cancel')) {
      type = ErrorType.USER_CANCEL;
      return; // 用户取消不显示错误
    } else if (error.message.includes('permission') || error.message.includes('Permission')) {
      type = ErrorType.PERMISSION;
      message = errorMessages[ErrorType.PERMISSION];
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

/**
 * 处理错误并显示模态框
 * @param error 错误对象
 * @param title 标题
 * @param customMessage 自定义消息
 */
export const handleErrorModal = (
  error: unknown,
  title: string = '提示',
  customMessage?: string
): void => {
  console.error('Error:', error);

  let message = customMessage || '操作失败，请重试';

  if (error instanceof AppError) {
    message = error.message || errorMessages[error.type];
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  wx.showModal({
    title,
    content: message,
    showCancel: false
  });
};

/**
 * 包装异步函数，自动处理错误
 * @param fn 异步函数
 * @param errorMessage 错误消息
 * @returns 包装后的函数
 */
export const withErrorHandler = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): ((...args: Parameters<T>) => Promise<ReturnType<T> | undefined>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, errorMessage);
      return undefined;
    }
  };
};

/**
 * 尝试执行函数，返回成功或失败
 * @param fn 要执行的函数
 * @returns 是否成功
 */
export const tryCatch = <T>(fn: () => T): { success: boolean; data?: T; error?: Error } => {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

/**
 * 尝试执行异步函数
 * @param fn 要执行的异步函数
 * @returns 结果
 */
export const tryCatchAsync = async <T>(
  fn: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: Error }> => {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

/**
 * 显示成功提示
 * @param message 消息
 * @param duration 持续时间
 */
export const showSuccess = (message: string, duration: number = 1500): void => {
  wx.showToast({
    title: message,
    icon: 'success',
    duration
  });
};

/**
 * 显示加载中
 * @param message 消息
 * @returns 隐藏函数
 */
export const showLoading = (message: string = '处理中...'): (() => void) => {
  wx.showLoading({
    title: message,
    mask: true
  });

  return () => {
    wx.hideLoading();
  };
};

/**
 * 显示确认对话框
 * @param title 标题
 * @param content 内容
 * @returns Promise<boolean>
 */
export const showConfirm = (title: string, content: string): Promise<boolean> => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
};

/**
 * 检查网络状态
 * @returns 是否在线
 */
export const checkNetwork = async (): Promise<boolean> => {
  try {
    const res = await wx.getNetworkType();
    return res.networkType !== 'none';
  } catch {
    return false;
  }
};

/**
 * 网络错误重试包装器
 * @param fn 异步函数
 * @param retries 重试次数
 * @returns 结果
 */
export const withRetry = <T>(
  fn: () => Promise<T>,
  retries: number = 3
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const attempt = async (remaining: number) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 1000);
        } else {
          reject(error);
        }
      }
    };

    attempt(retries);
  });
};
