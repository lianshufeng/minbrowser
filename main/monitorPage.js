function openMonitorPage () {
  const win = new BrowserWindow({
    width: 1366,
    height: 768,
    minHeight: 640,
    minWidth: 480,
    maxHeight: 1080,
    maxWidth: 1920,
    // parent: windows.getCurrent(), // 可选
    show: true,
    modal: false,
    alwaysOnTop: false,
    title: '监控页面',
    autoHideMenuBar: true,
    frame: true, // 必须为 true，才有关闭按钮
    webPreferences: {
      nodeIntegration: false,
      sandbox: true,
      contextIsolation: true,
      preload: __dirname + '/pages/monitorPage/monitorPage.js'
    }
  })

  const winHandle = new Date().getTime()

  // 转发请求
  const forward_channels = ['get-all-tabs', 'get-tab-selected', 'get-setting-config', 'set-setting-config']
  forward_channels.forEach((name) => {
    // 拼接方法，防止窗口卸载后也收到消息
    const methodName = name + '-' + winHandle
    ipc.on(methodName, (event, data) => {
      if (data && data.outChannel) {
        const outChannel = data.outChannel
        ipc.once(outChannel, (event, data) => {
          win.webContents.send(outChannel, data)
        })
      }
      // 调用js渲染进程
      sendIPCToWindow(windows.getCurrent(), name, data)
    })
  })

  win.loadURL('min://app/pages/monitorPage/index.html')
  // win.once('ready-to-show', () => win.show())
  // win.on('closed', () => win = null)
  // 向窗口发送参数（可选）
  win.webContents.once('did-finish-load', () => {

    // 发送当前窗口创建的id
    win.webContents.send('init-monitor-page-config', { winHandle: winHandle })

  })

  // 打开调试页面
  win.webContents.openDevTools({ mode: 'detach' })
}

// 选择tab
ipc.on('set-tab-selected', (event, data) => {
  sendIPCToWindow(windows.getCurrent(), 'set-tab-selected', data)
})

ipc.on('tab-view-capture', (event, data) => {
  const view = getView(data.id)
  try {
    if (view && view.webContents) {
      view.webContents.capturePage().then(function (img) {
        var size = img.getSize()
        if (size.width === 0 && size.height === 0) {
          return
        }
        img = img.resize({ width: data.width, height: data.height })
        if (data.outChannel) {
          event.sender.send(data.outChannel, { id: data.id, url: img.toDataURL() })
        }
      })
    }
  } catch (err) {
    console.error(err)
  }
})

ipc.on('refresh-tab-view', (event, data) => {
  const view = getView(data.id)
  if (view && view.webContents) {
    view.webContents.reload()
  }
})

function getTabConfig (tabId) {
  return new Promise((resolve, reject) => {
    const outChannel = 'get-tab-config-' + new Date().getTime()
    ipc.once(outChannel, (event, data) => {
      resolve(data)
    })
    sendIPCToWindow(windows.getCurrent(), 'get-tab-config', {
      tabId: tabId,
      outChannel: outChannel
    })
  })
}

// 推送页面的会话
ipc.on('post-page-session', async (event, data) => {
  // sendIPCToWindow(windows.getCurrent(), 'post-page-session', data)

  for (let tabId in viewMap) {

    // 取出配置
    const tabConfig = await getTabConfig(tabId)
    if (!tabConfig) {
      continue
    }
    const solatedSession = tabConfig.solatedSession
    if (!solatedSession || solatedSession.isSolated !== true) { // 仅支持独立会话的tab
      continue
    }
    const platformName = (solatedSession.platformType === 'other') ? solatedSession.platformName : solatedSession.platformType
    const platformAccountName = solatedSession.platformAccountName

    // 视图
    const view = viewMap[tabId]
    if (!view) {
      continue
    }

    const viewSession = view.webContents.session
    const cookies = await viewSession.cookies.get({})

    const platformCookies = cookies.filter(cookie => {
      // 只匹配以 .douyin.com 结尾的域名
      return cookie.domain.endsWith(solatedSession.platformType === 'other' ? '' : platformName)
    }).map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

    // 生成 cookies header 字符串
    // const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
    // console.log(platformName, platformAccountName, tabId, cookieHeader)
    //todo 将cookies同步出去
    console.log(platformName, platformAccountName, tabId, platformCookies)
  }

})