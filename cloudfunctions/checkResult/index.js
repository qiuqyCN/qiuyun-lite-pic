// cloudfunctions/checkResult/index.js
// 轮询查询图片安全检测结果

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const COLLECTION = 'security_tasks'

exports.main = async (event) => {
  const { trace_id } = event

  if (!trace_id) {
    return { status: 'error', reason: '参数缺失' }
  }

  try {
    const res = await db.collection(COLLECTION)
      .where({ trace_id })
      .limit(1)
      .get()

    if (res.data.length === 0) {
      return { status: 'pending' }
    }

    const task = res.data[0]
    console.log('[checkResult] trace_id:', trace_id, 'status:', task.status)

    if (task.status === 'pending') {
      return { status: 'pending' }
    }

    if (task.status === 'pass') {
      return { status: 'done', pass: true }
    }

    if (task.status === 'risky') {
      const labelMap = {
        100: '正常', 20001: '时政', 20002: '色情', 20006: '违法犯罪', 21000: '其他'
      }
      return {
        status: 'done',
        pass: false,
        reason: '图片内容违规',
        label: task.label,
        labelName: labelMap[task.label] || '未知',
      }
    }

    return { status: task.status }

  } catch (err) {
    console.error('[checkResult] 查询失败:', err)
    return { status: 'pending' } // 异常时继续等待
  }
}
