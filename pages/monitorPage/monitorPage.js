const { ipcRenderer } = require('electron')

const MonitorPageConfigName = 'monitorPageConfig'
let refreshTimer = null
let snapshotTimer = null
let syncSessionTimer = null  // 添加同步会话定时器
let monitorPageConfig = null

// 初始化配置加载
function loadSettingConfig (winHandle, defaultValue) {
  return new Promise((resolve, reject) => {
    const command = 'get-setting-config'
    const outChannel = command + '-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      resolve(data)
    })
    ipcRenderer.send(command + '-' + winHandle, {
      outChannel: outChannel,
      key: MonitorPageConfigName,
      value: defaultValue
    })
  })
}

// 保存设置到配置
function setSettingConfig (winHandle, key, value) {
  return new Promise((resolve, reject) => {
    if (!monitorPageConfig) {
      return
    }
    monitorPageConfig[key] = value

    const command = 'set-setting-config'
    const outChannel = command + '-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      resolve(data)
    })
    ipcRenderer.send(command + '-' + winHandle, {
      outChannel: outChannel,
      key: MonitorPageConfigName,
      value: monitorPageConfig
    })
  })
}

async function syncSessionAction (data) {
  console.log('syncSessionAction', data)
}

// 获取所有tab的快照
function getAllTabsSnapshots (winHandle) {
  return new Promise((resolve, reject) => {
    const outChannel = 'get-all-tabs-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      resolve(data)
    })
    ipcRenderer.send('get-all-tabs-' + winHandle, {
      outChannel: outChannel
    })
  })
}

// 渲染所有tabs的快照
function renderSnapshotsGrid (snapshots) {
  const grid = document.querySelector('.grid-container')
  if (!grid) return

  const currStr = JSON.stringify(snapshots)
  if (grid._lastSnapshotsStr === currStr) return
  grid._lastSnapshotsStr = currStr

  grid.innerHTML = ''
  snapshots.forEach(tab => {
    const div = document.createElement('div')
    div.className = 'tab-item'
    const imgUrl = tab.imageUrl ? tab.imageUrl : './load.png'
    div.innerHTML = `
      <img id="tab-snapshot-img-${tab.id}" class="tab-snapshot" src="${imgUrl}" alt="${tab.title}">
      <div class="tab-info">
        <div class="tab-title">${tab.title}</div>
        <div class="tab-url">${tab.url}</div>
      </div>
    `
    div.onclick = () => {
      ipcRenderer.send('set-tab-selected', { id: tab.id })
      if (snapshotTimer) clearInterval(snapshotTimer)
      document.getElementById('snapshot-enable').checked = false
    }
    grid.appendChild(div)
  })
}

// 快照轮询操作
async function snapshotsTabs (data) {
  try {
    const snapshot = await getAllTabsSnapshots(data.winHandle)
    renderSnapshotsGrid(snapshot)
  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(async () => {
      await snapshotsTabs(data)
    }, monitorPageConfig.snapshotInterval * 1000) // 根据配置的间隔时间刷新
  }
}

// 刷新操作
async function refreshAction (data) {
  console.log('刷新所有tabs！', data)
  const snapshot = await getAllTabsSnapshots(data.winHandle)
  snapshot.forEach(tab => {
    ipcRenderer.send('refresh-tab-view', { id: tab.id })
  })
}

// 快照保存操作
async function snapshotAction (data) {
  const snapshot = await getAllTabsSnapshots(data.winHandle)
  const currentTab = await getCurrentTab(data.winHandle)
  const index = snapshot.findIndex(tab => tab.id === currentTab.id)
  if (index > -1) {
    let nextIndex = index + 1
    if (nextIndex >= snapshot.length) nextIndex = 0
    const tab = snapshot[nextIndex]
    await ipcRenderer.send('set-tab-selected', { id: tab.id })

    const outChannel = 'tab-view-capture-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      document.getElementById('tab-snapshot-img-' + tab.id).setAttribute('src', data.url)
    })

    await ipcRenderer.send('tab-view-capture', {
      id: tab.id, width: 320, height: 240, outChannel: outChannel
    })
  }
}

// 获取当前选中的tab
async function getCurrentTab (winHandle) {
  return new Promise((resolve, reject) => {
    const outChannel = 'get-tab-selected-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      resolve(data)
    })
    ipcRenderer.send('get-tab-selected-' + winHandle, { outChannel: outChannel })
  })
}

// 初始化时加载和设置配置
ipcRenderer.once('init-monitor-page-config', async (event, data) => {
  // 加载配置
  monitorPageConfig = await loadSettingConfig(data.winHandle, {
    syncSessionUrl: 'https://example.com/session-sync',
    syncSessionEnable: false,
    syncSessionInterval: 600, // 默认10分钟同步
    refreshInterval: 120, // 默认刷新120秒
    snapshotInterval: 3, // 默认快照间隔3秒
    refreshEnable: false,
    snapshotEnable: false
  })

  // 设置界面元素
  const settings = {
    'refresh-interval': monitorPageConfig.refreshInterval,
    'snapshot-interval': monitorPageConfig.snapshotInterval,
    'refresh-enable': monitorPageConfig.refreshEnable,
    'snapshot-enable': monitorPageConfig.snapshotEnable,
    'sync-session-url': monitorPageConfig.syncSessionUrl,
    'sync-session-enable': monitorPageConfig.syncSessionEnable,
    'sync-session-interval': monitorPageConfig.syncSessionInterval
  }

  // 加载所有的配置到html上
  for (const [key, value] of Object.entries(settings)) {
    const element = document.getElementById(key)
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value
      } else {
        element.value = value
      }
    }
  }

  // 同步会话开关事件
  document.getElementById('sync-session-enable').addEventListener('change', (e) => {
    const isEnabled = e.target.checked
    setSettingConfig(data.winHandle, 'syncSessionEnable', isEnabled)

    if (isEnabled) {
      const url = document.getElementById('sync-session-url').value
      const interval = Number(document.getElementById('sync-session-interval').value)
      setSettingConfig(data.winHandle, 'syncSessionUrl', url)
      setSettingConfig(data.winHandle, 'syncSessionInterval', interval)

      const syncInterval = interval * 1000
      clearInterval(syncSessionTimer)
      syncSessionTimer = setInterval(async () => {
        await syncSessionAction(data)
      }, syncInterval)
    } else {
      clearInterval(syncSessionTimer)
    }
  })

  document.getElementById('sync-session-url').addEventListener('change', (e) => {
    const url = e.target.value
    setSettingConfig(data.winHandle, 'syncSessionUrl', url)
  })

  document.getElementById('sync-session-interval').addEventListener('change', (e) => {
    const interval = Number(e.target.value)
    setSettingConfig(data.winHandle, 'syncSessionInterval', interval)

    if (document.getElementById('sync-session-enable').checked) {
      const syncInterval = interval * 1000
      clearInterval(syncSessionTimer)
      syncSessionTimer = setInterval(async () => {
        await syncSessionAction(data)
      }, syncInterval)
    }
  })

  // 快照定时器事件
  document.getElementById('snapshot-enable').addEventListener('change', (e) => {
    clearInterval(snapshotTimer)
    if (e.target.checked) {
      const interval = Number(document.getElementById('snapshot-interval').value) * 1000
      snapshotTimer = setInterval(async () => {
        await snapshotAction(data)
      }, interval)
    }
    setSettingConfig(data.winHandle, 'snapshotEnable', e.target.checked)
  })

  // 快照间隔变化时自动重启定时器（如开着）
  document.getElementById('snapshot-interval').addEventListener('change', () => {
    if (document.getElementById('snapshot-enable').checked) {
      clearInterval(snapshotTimer)
      const interval = Number(document.getElementById('snapshot-interval').value) * 1000
      snapshotTimer = setInterval(async () => {
        await snapshotAction(data)
      }, interval)
    }
    setSettingConfig(data.winHandle, 'snapshotInterval', document.getElementById('snapshot-interval').value)
  })

  // 页面刷新定时器
  document.getElementById('refresh-enable').addEventListener('change', (e) => {
    clearInterval(refreshTimer)
    if (e.target.checked) {
      const interval = Number(document.getElementById('refresh-interval').value) * 1000
      refreshTimer = setInterval(async () => {
        await refreshAction(data)
      }, interval)
    }
    setSettingConfig(data.winHandle, 'refreshEnable', e.target.checked)
  })

  // 页面刷新自动重启定时器（如开着）
  document.getElementById('refresh-interval').addEventListener('change', () => {
    if (document.getElementById('refresh-enable').checked) {
      clearInterval(refreshTimer)
      const interval = Number(document.getElementById('refresh-interval').value) * 1000
      refreshTimer = setInterval(async () => {
        await refreshAction(data)
      }, interval)
    }
    setSettingConfig(data.winHandle, 'refreshInterval', document.getElementById('refresh-interval').value)
  })

  // 触发change事件
  for (const [key] of Object.entries(settings)) {
    const element = document.getElementById(key)
    if (element) {
      if (element.type === 'checkbox') {
        element.dispatchEvent(new Event('change')) // 触发change事件
      }
    }
  }

  // 加载快照并渲染
  setTimeout(async () => {
    await snapshotsTabs(data)
  }, 3000)
})
