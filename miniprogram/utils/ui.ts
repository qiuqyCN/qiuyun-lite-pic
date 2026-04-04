// utils/ui.ts
// UI 提示工具函数

/**
 * 显示成功提示
 * @param message 消息
 * @param duration 持续时间
 */
export const showSuccess = (message: string, duration: number = 2500): void => {
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
 * 显示提示信息（无图标）
 * @param message 消息
 * @param duration 持续时间
 */
export const showInfo = (message: string, duration: number = 2000): void => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration
  });
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
 * 显示警告提示
 * @param message 消息
 * @param duration 持续时间
 */
export const showWarning = (message: string, duration: number = 2000): void => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration
  });
};
