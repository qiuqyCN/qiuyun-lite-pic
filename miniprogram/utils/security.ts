// utils/security.ts
// 内容安全检测工具

/**
 * 图片安全检测
 * @param filePath 图片临时文件路径或 fileID
 * @returns 是否安全
 */
export async function checkImage(filePath: string): Promise<boolean> {
  try {
    // 本地临时文件需要先上传到云存储
    let fileID = filePath
    if (filePath.startsWith('http') || filePath.startsWith('wxfile')) {
      // 已是远程URL或wxfile协议，直接检测
      const res = await wx.cloud.callFunction({
        name: 'contentCheck',
        data: { type: 'img', content: filePath },
      })
      return res.result?.pass ?? true
    }

    // 本地临时文件需要先上传到云存储才能检测
    const uploadRes = await wx.cloud.uploadFile({
      cloudPath: `security-check/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.tmp`,
      filePath,
    })
    fileID = uploadRes.fileID

    const res = await wx.cloud.callFunction({
      name: 'contentCheck',
      data: { type: 'img', content: fileID },
    })

    // 检测完删除临时文件
    wx.cloud.deleteFile({ fileList: [fileID] }).catch(() => {})

    return res.result?.pass ?? true
  } catch (err) {
    console.error('图片安全检测失败:', err)
    // 检测失败默认放行，避免影响正常使用
    return true
  }
}

/**
 * 文本安全检测
 * @param text 待检测文本
 * @returns 是否安全
 */
export async function checkText(text: string): Promise<boolean> {
  if (!text || !text.trim()) return true

  try {
    const res = await wx.cloud.callFunction({
      name: 'contentCheck',
      data: { type: 'text', content: text },
    })
    return res.result?.pass ?? true
  } catch (err) {
    console.error('文本安全检测失败:', err)
    return true
  }
}
