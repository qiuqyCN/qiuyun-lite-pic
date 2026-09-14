// utils/security.ts
// 内容安全检测工具 v2.0
// - 图片: mediaCheckAsync (异步, 前端轮询)
// - 文本: msgSecCheck (同步)

const POLL_INTERVAL = 1200   // 轮询间隔 1 秒
const POLL_MAX = 25          // 最多轮询 10 次 = 10秒

/**
 * 图片安全检测（异步轮询）
 */
export async function checkImage(filePath: string): Promise<{ pass: boolean; reason?: string }> {
  try {
    let fileID = filePath

    // 本地文件先上传到云存储（保留原始扩展名）
    if (!filePath.startsWith('cloud://')) {
      console.log('[Security] 上传本地图片:', filePath)
      const extMatch = filePath.match(/\.(png|jpe?g|gif|bmp|webp)$/i)
      const ext = extMatch ? extMatch[1].toLowerCase() : 'png'
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `security-check/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
        filePath,
      })
      fileID = uploadRes.fileID
    }

    // 提交异步检测任务
    console.log('[Security] 提交图片检测:', fileID)
    const submitRes = await wx.cloud.callFunction({
      name: 'contentCheck',
      data: { type: 'img', content: fileID },
    })

    console.log('[Security] contentCheck 完整返回:', JSON.stringify(submitRes.result))
    const traceId = submitRes.result?.trace_id || submitRes.result?.traceId
    console.log('[Security] trace_id:', traceId)

    if (!traceId) {
      console.error('[Security] 未获取到 trace_id, result:', submitRes.result)
      return { pass: true } // 异常放行
    }

    console.log('[Security] 轮询 trace_id:', traceId)

    // 轮询等待结果
    for (let i = 0; i < POLL_MAX; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? POLL_INTERVAL : POLL_INTERVAL - 100))

      const pollRes = await wx.cloud.callFunction({
        name: 'checkResult',
        data: { trace_id: traceId },
      })

      const result = pollRes.result as {
        status: string
        pass?: boolean
        reason?: string
        labelName?: string
      }

      console.log(`[Security] 轮询 ${i + 1}/${POLL_MAX}:`, result?.status)

      if (result?.status === 'done') {
        // 清理临时文件
        if (!filePath.startsWith('cloud://')) {
          wx.cloud.deleteFile({ fileList: [fileID] }).catch(() => {})
        }
        console.log('[Security] 图片检测结果:', result)
        
        if (!result.pass) {
          const detail = result.labelName ? `（${result.labelName}）` : ''
          wx.showModal({
            title: '安全提醒',
            content: `${result.reason || '图片内容违规'}${detail}，请更换后重试`,
            showCancel: false,
            confirmText: '我知道了',
          })
        }
        return { pass: result.pass ?? true, reason: result.reason }
      }
    }

    // 超时，放行
    console.warn('[Security] 轮询超时，放行')
    return { pass: true }

  } catch (err) {
    console.error('[Security] 图片检测异常:', err)
    return { pass: true }
  }
}

/**
 * 文本安全检测（同步 v2.0）
 */
export async function checkText(text: string): Promise<{ pass: boolean; reason?: string }> {
  if (!text || !text.trim()) return { pass: true }

  try {
    console.log('[Security] 文本检测:', text)
    const res = await wx.cloud.callFunction({
      name: 'contentCheck',
      data: { type: 'text', content: text },
    })

    console.log('[Security] 文本检测返回:', JSON.stringify(res.result))

    const result = res.result as { pass: boolean; reason?: string; labelName?: string }
    if (!result.pass) {
      const detail = result.labelName ? `（${result.labelName}）` : ''
      wx.showModal({
        title: '安全提醒',
        content: `${result.reason || '文本内容不符合规范'}${detail}，请修改后重试`,
        showCancel: false,
        confirmText: '我知道了',
      })
    }
    return { pass: result.pass, reason: result.reason }
  } catch (err) {
    console.error('[Security] 文本检测异常:', err)
    return { pass: true }
  }
}
