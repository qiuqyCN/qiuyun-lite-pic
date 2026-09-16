// utils/checking.ts
// 安全检测期间的 loading + Banner 广告弹窗控制

/** 显示检测弹窗（含 Banner 广告） */
export function showChecking() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (page && typeof page.setData === 'function') {
    page.setData({ checkingVisible: true })
  }
}

/** 隐藏检测弹窗 */
export function hideChecking() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (page && typeof page.setData === 'function') {
    page.setData({ checkingVisible: false })
  }
}
