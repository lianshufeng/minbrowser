const http = require('http')
const https = require('https')

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
  // win.webContents.openDevTools({ mode: 'detach' })
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

function postJson (url, data) {
  return new Promise((resolve, reject) => {
    // 解析 URL
    const urlObj = new URL(url)

    // 根据协议选择 http 或 https
    const requestModule = urlObj.protocol === 'https:' ? https : http

    // 获取端口号，如果 URL 中没有端口，则使用默认端口
    const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80)

    // 配置请求参数
    const options = {
      hostname: urlObj.hostname,
      port: port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data)),
      },
    }

    // 创建请求
    const req = requestModule.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          // 成功时返回解析后的响应数据
          resolve(responseData)
        } catch (error) {
          // 解析错误时抛出错误
          reject(new Error('Error parsing response: ' + error.message))
        }
      })
    })

    req.on('error', (error) => {
      // 请求出错时抛出错误
      reject(new Error('Request error: ' + error.message))
    })

    // 发送 JSON 数据
    req.write(JSON.stringify(data))

    // 结束请求
    req.end()
  })
}

// 推送页面的会话
ipc.on('post-page-session', async (event, data) => {
  // sendIPCToWindow(windows.getCurrent(), 'post-page-session', data)

  const items = []
  const url = data.url.trim()
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

    const domain_cookies_map = {
      douyin: ['.douyin.com'],
      kuaishou: ['.kuaishou.com'],
      xiaohongshu: ['.xiaohongshu.com'],
      bilibili: ['.bilibili.com']
    }

    const platformCookies = cookies
      .filter(cookie => {
        const validDomains = domain_cookies_map[platformName] || [] // 获取对应平台的有效域名数组，如果没有则使用空数组
        return validDomains.length === 0 || validDomains.some(domain => cookie.domain.endsWith(domain))
      })
      .map(cookie => {
        // 去除 cookie 的 name 和 value 中的换行符、回车符以及多余的空白字符
        const name = cookie.name.trim() // 去除换行符、回车符和多余空格
        const value = cookie.value.trim() // 去除换行符、回车符和多余空格
        return `${name}=${value}`
      })
      .join('; ')

    items.push({
      tabId: tabId,
      platformName: platformName,
      platformAccountName: platformAccountName,
      cookies: platformCookies
    })
  }

  try {
    const ret = await postJson(url, {
      items: items
    })
    console.log('Response:', ret)
  } catch (e) {
    console.error(e)
  }

})