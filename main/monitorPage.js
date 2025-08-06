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

  win.loadURL('min://app/pages/monitorPage/index.html')
  // win.once('ready-to-show', () => win.show())
  // win.on('closed', () => win = null)
  // 向窗口发送参数（可选）
  win.webContents.once('did-finish-load', () => {

  })

  // 打开调试页面
  win.webContents.openDevTools({ mode: 'detach' })
}

// 转发请求
['get-all-tabs'].forEach((name) => {
  ipc.on(name, (event, data) => {
    sendIPCToWindow(windows.getCurrent(), name, data)
  })
})