// cloudfunctions/contentCheck/index.js
// 内容安全检测云函数
// - 文本: security.msgSecCheck v2.0 (同步)
// - 图片: security.mediaCheckAsync v2.0 (异步)

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const COLLECTION = 'security_tasks'

exports.main = async (event) => {
  const { type, content } = event

  if (!type || !content) {
    return { pass: false, reason: '参数缺失' }
  }

  const { OPENID } = cloud.getWXContext()
  console.log('[contentCheck] ===== 开始检测 =====')
  console.log('[contentCheck] openid:', OPENID, 'type:', type)

  try {
    if (type === 'img') {
      // ===== 图片安全检测 v2.0 (异步) =====
      // 1. 把云存储 fileID 转成临时可访问 URL
      const urlRes = await cloud.getTempFileURL({ fileList: [content] })
      const mediaUrl = urlRes.fileList[0].tempFileURL
      console.log('[contentCheck] media_url:', mediaUrl)

      // 2. 提交异步检测任务
      const result = await cloud.openapi.security.mediaCheckAsync({
        media_url: mediaUrl,
        media_type: 2,    // 2 = 图片
        version: 2,
        scene: 2,         // 评论场景
        openid: OPENID,
      })

      console.log('[contentCheck] mediaCheckAsync 完整返回:', JSON.stringify(result))

      // wx-server-sdk 的 openapi 调用返回值结构可能是:
      // - { trace_id: "xxx" } (直接返回业务数据)
      // - { errCode: 0, errMsg: "ok", trace_id: "xxx" } (包含 errCode)
      // 兼容所有可能
      const traceId =
        result.trace_id ||
        result.traceId ||
        (result.result && (result.result.trace_id || result.result.traceId)) ||
        null

      console.log('[contentCheck] 解析 trace_id:', traceId)

      if (!traceId) {
        console.error('[contentCheck] mediaCheckAsync 未返回 trace_id! result keys:', Object.keys(result))
        // 异常放行，不阻塞用户
        return { pass: true, _debug_result: result }
      }

      // 3. 在数据库创建任务记录，等待回调或轮询
      await db.collection(COLLECTION).add({
        data: {
          trace_id: traceId,
          fileID: content,
          media_url: mediaUrl,
          status: 'pending',
          create_time: Date.now(),
        },
      })
      console.log('[contentCheck] 数据库记录已创建, trace_id:', traceId)

      // 4. 立即返回 trace_id
      return {
        async: true,
        trace_id: traceId,
      }

    } else if (type === 'text') {
      // ===== 文本安全检测 v2.0 (同步) =====
      console.log('[contentCheck] 文本检测:', content)

      const result = await cloud.openapi.security.msgSecCheck({
        content,
        version: 2,
        scene: 2,
        openid: OPENID,
      })

      console.log('[contentCheck] msgSecCheck完整返回:', JSON.stringify(result))

      const suggest = result.result?.suggest
      const pass = suggest === 'pass'

      if (!pass) {
        const labelMap = {
          10001: '广告', 20001: '时政', 20002: '色情', 20003: '辱骂',
          20006: '违法犯罪', 20008: '欺诈', 20012: '低俗', 20013: '版权', 21000: '其他'
        }
        return {
          pass: false,
          reason: suggest === 'risky' ? '内容违规' : '内容需审核',
          labelName: labelMap[result.result?.label] || '未知',
        }
      }

      return { pass: true }

    } else {
      return { pass: false, reason: '未知类型: ' + type }
    }

  } catch (err) {
    console.error('[contentCheck] 检测异常:', err)

    if (err.errCode === 61010) {
      return { pass: false, reason: '请先在小程序中操作后重试' }
    }

    if (err.errCode === 40003) {
      return { pass: false, reason: '用户身份验证失败' }
    }

    return { pass: true }
  }
}
