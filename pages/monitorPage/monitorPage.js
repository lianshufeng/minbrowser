// tabs-snapshot.js
const { ipcRenderer } = require('electron')

// const { settings } = require('../../js/util/settings/settingsContent.js')

let refreshTimer = null
let snapshotTimer = null
let monitorPageConfig = null

function getSettingConfig (winHandle, key, defaultValue) {
  return new Promise((resolve, reject) => {
    const command = 'get-setting-config'
    // 请求主进程拿到所有tab的信息
    const outChannel = command + '-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      resolve(data)
    })
    ipcRenderer.send(command + '-' + winHandle, {
      outChannel: outChannel,
      key: key,
      value: defaultValue
    })
  })
}

function getAllTabsSnapshots (winHandle) {
  return new Promise((resolve, reject) => {
    // 请求主进程拿到所有tab的信息
    const outChannel = 'get-all-tabs-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      resolve(data)
    })
    ipcRenderer.send('get-all-tabs-' + winHandle, {
      outChannel: outChannel
    })
  })
}

function renderSnapshotsGrid (snapshots) {
  const grid = document.querySelector('.grid-container')
  if (!grid) return

  // 用字符串缓存上一次的数据
  const currStr = JSON.stringify(snapshots)
  if (grid._lastSnapshotsStr === currStr) return
  grid._lastSnapshotsStr = currStr

  // 有变化才清空并渲染
  grid.innerHTML = ''
  snapshots.forEach(tab => {
    const div = document.createElement('div')
    div.className = 'tab-item'
    // 判断 imageUrl 是否为空
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
      if (snapshotTimer) {
        clearInterval(snapshotTimer)
      }
      document.getElementById('snapshot-enable').checked = false
    }
    grid.appendChild(div)
  })
}

async function snapshotsTabs (data) {
  try {
    // 取出所有的tab
    const snapshot = await getAllTabsSnapshots(data.winHandle)
    // 渲染所有的tab
    renderSnapshotsGrid(snapshot)
    // 刷新tab的视图
    // refreshTabView(snapshot)
  } catch (err) {

  } finally {
    setTimeout(async () => {
      await snapshotsTabs(data)
    }, 3000)
  }
}

async function getCurrentTab (winHandle) {
  // outChannel
  return new Promise((resolve, reject) => {
    const outChannel = 'get-tab-selected-' + new Date().getTime()
    ipcRenderer.once(outChannel, (event, data) => {
      return resolve(data)
    })
    ipcRenderer.send('get-tab-selected-' + winHandle, { outChannel: outChannel })
  })
}

// 执行逻辑可自定义
async function refreshAction (data) {
  console.log('刷新！', data)
  const snapshot = await getAllTabsSnapshots(data.winHandle)
  snapshot.forEach(tab => {
    ipcRenderer.send('refresh-tab-view', { id: tab.id })
  })
}

async function snapshotAction (data) {
  const snapshot = await getAllTabsSnapshots(data.winHandle)
  const currentTab = await getCurrentTab(data.winHandle)
  const index = snapshot.findIndex(tab => tab.id === currentTab.id)
  if (index > -1) {
    let nextIndex = index + 1
    if (nextIndex >= snapshot.length) {
      nextIndex = 0
    }
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

ipcRenderer.once('init-monitor-page-config', async (event, data) => {

  // 加载快照并渲染九宫格
  setTimeout(async () => {
    await snapshotsTabs(data)
  }, 3000)

  // 加载默认配置
  monitorPageConfig = await getSettingConfig(data.winHandle, 'monitorPageConfig', {
    syncSessionUrl: 'https://example.com/session-sync',
    syncSessionEnable: false
  })

  document.getElementById('refresh-enable').addEventListener('change', (e) => {
    clearInterval(refreshTimer)
    if (e.target.checked) {
      const interval = Number(document.getElementById('refresh-interval').value) * 1000
      refreshTimer = setInterval(async () => {
        await refreshAction(data)
      }, interval)
    }
  })

  document.getElementById('snapshot-enable').addEventListener('change', (e) => {
    clearInterval(snapshotTimer)
    if (e.target.checked) {
      const interval = Number(document.getElementById('snapshot-interval').value) * 1000
      snapshotTimer = setInterval(async () => {
        await snapshotAction(data)
      }, interval)
    }
  })

  // 当间隔修改时自动重启对应定时器（如开着）
  document.getElementById('refresh-interval').addEventListener('change', () => {
    if (document.getElementById('refresh-enable').checked) {
      clearInterval(refreshTimer)
      const interval = Number(document.getElementById('refresh-interval').value) * 1000
      refreshTimer = setInterval(async () => {
        await refreshAction(data)
      }, interval)
    }
  })

  document.getElementById('snapshot-interval').addEventListener('change', () => {
    if (document.getElementById('snapshot-enable').checked) {
      clearInterval(snapshotTimer)
      const interval = Number(document.getElementById('snapshot-interval').value) * 1000
      snapshotTimer = setInterval(async () => {
        await snapshotAction(data)
      }, interval)
    }
  })

  // doto 需要找到如何初始化

})