// cloudfunctions/contentCheck/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 内容安全检测云函数
 * @param {Object} event
 * @param {'img'|'text'} event.type - 检测类型
 * @param {string} event.content - 图片 fileID 或 文本内容
 */
exports.main = async (event) => {
  const { type, content } = event

  if (!type || !content) {
    return { pass: false, reason: '参数缺失' }
  }

  try {
    if (type === 'img') {
      // 图片安全检测
      await cloud.openapi.security.imgSecCheck({
        media: {
          contentType: 'image',
          value: content,
        },
      })
      return { pass: true }
    } else if (type === 'text') {
      // 文本安全检测
      await cloud.openapi.security.msgSecCheck({
        content,
      })
      return { pass: true }
    } else {
      return { pass: false, reason: '未知类型: ' + type }
    }
  } catch (err) {
    console.error('内容安全检测失败:', err)
    // 87014 = 内容违规
    if (err.errCode === 87014) {
      return { pass: false, reason: '内容违规' }
    }
    // 其他错误默认放行（如检测服务不可用）
    return { pass: true }
  }
}
