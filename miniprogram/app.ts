// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 云开发初始化
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d6gk3f5dj5b1d6f77',
        traceUser: true,
      })
    }

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
      },
    })
  },
})