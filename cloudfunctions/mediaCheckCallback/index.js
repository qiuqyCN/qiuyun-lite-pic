// cloudfunctions/mediaCheckCallback/index.js
// 接收微信 mediaCheckAsync 异步检测结果推送
// 需要在小程序后台配置消息推送 URL 为此云函数的 HTTP 触发地址

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const COLLECTION = 'security_tasks'

exports.main = async (event) => {
  // 微信推送的数据结构:
  // {
  //   Event: "wxa_media_check",
  //   trace_id: "xxx",
  //   errcode: 0,
  //   result: { suggest: "pass"/"risky", label: 100/20001/... },
  //   detail: [...]
  // }

  console.log('[mediaCheckCallback] 收到推送:', JSON.stringify(event))

  const { trace_id, errcode, result, detail } = event

  if (!trace_id) {
    return { ok: false, reason: '无 trace_id' }
  }

  try {
    if (errcode !== 0) {
      console.warn('[mediaCheckCallback] 检测出错:', errcode)
      await db.collection(COLLECTION).where({ trace_id }).update({
        data: { status: 'error', errCode: errcode, update_time: Date.now() }
      })
      return { ok: true }
    }

    const suggest = result?.suggest
    const pass = suggest === 'pass'

    await db.collection(COLLECTION).where({ trace_id }).update({
      data: {
        status: pass ? 'pass' : 'risky',
        label: result?.label,
        suggest,
        detail,
        update_time: Date.now(),
      }
    })

    console.log('[mediaCheckCallback] 更新完成:', trace_id, '->', suggest)
    return { ok: true }

  } catch (err) {
    console.error('[mediaCheckCallback] 更新失败:', err)
    return { ok: false, reason: err.message }
  }
}
