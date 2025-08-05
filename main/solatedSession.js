let win = null

function showSettingWindow (tabId, tabName, config = {}) {
  if (win) {
    win.focus()
    return
  }
  win = new BrowserWindow({
    width: 480,
    height: 710,
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

  // 向窗口发送参数（可选）
  win.webContents.once('did-finish-load', () => {

    // 从渲染进程总中加载tab配置
    sendIPCToWindow(windows.getCurrent(), 'load-tab-config-isolated-session', { tabId: tabId, config: config })

    // 载入tab的配置并发给页面
    ipc.once('tab-config-isolated-session', (event, data) => {
      win.webContents.send('init-config', { tabId: tabId, tab: data })
    })

  })

  // 订阅修改
  ipc.on('update-isolated-session-config', (event, data) => {
    sendIPCToWindow(windows.getCurrent(), 'update-isolated-session-config', data)
  })

  // win.webContents.openDevTools({ mode: 'detach' })
}

ipc.on('open-isolated-session-setting', function (e, tabId) {
  showSettingWindow(tabId)
})

