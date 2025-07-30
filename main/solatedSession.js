let win = null

function showSettingWindow (tabId, tabName, config = {}) {
  if (win) {
    win.focus()
    return
  }
  win = new BrowserWindow({
    width: 480,
    height: 640,
    minWidth: 480,
    minHeight: 640,
    maxWidth: 600,
    maxHeight: 800,
    parent: windows.getCurrent(), // 可选
    show: false,
    modal: true,
    alwaysOnTop: true,
    title: '设置独立会话',
    autoHideMenuBar: true,
    frame: true, // 必须为 true，才有关闭按钮
    webPreferences: {
      nodeIntegration: false,
      sandbox: true,
      contextIsolation: true,
      preload: __dirname + '/pages/solatedSession/solatedSession.js'
    }
  })

  // win.loadFile('setting-window.html')
  win.loadURL('min://app/pages/solatedSession/index.html')

  win.once('ready-to-show', () => win.show())

  // 关闭时清空引用
  win.on('closed', () => win = null)


  sendIPCToWindow(windows.getCurrent(), 'load-task-config',{ tabId, config })

  // 向窗口发送参数（可选）
  win.webContents.once('did-finish-load', () => {
    config = {
      tabName: tabName,
      tabId: tabId
    }
    win.webContents.send('init-config', { tabId, config })
  })

  win.webContents.openDevTools({ mode: 'detach' })
}

ipc.on('open-isolated-session-setting', function (e, tabId, tabName) {
  showSettingWindow(tabId, tabName)
})

ipc.on('set-isolated-session-config', function (e, ua, proxy, isCookies, platformType, platformAccountName) {
  console.log('set-isolated-session-config', ua, proxy, isCookies, platformType, platformAccountName)
})

// ipc.on('isolated-session-config', function (e, config) {
//   console.log('isolated-session-config', config)
// })