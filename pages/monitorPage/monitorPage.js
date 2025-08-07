// tabs-snapshot.js
const { ipcRenderer } = require('electron')

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
      <img class="tab-snapshot" src="${imgUrl}" alt="${tab.title}">
      <div class="tab-info">
        <div class="tab-title">${tab.title}</div>
        <div class="tab-url">${tab.url}</div>
      </div>
    `
    div.onclick = () => {
      ipcRenderer.send('set-tab-selected', { id: tab.id })
    }
    grid.appendChild(div)
  })
}

/**
 * 刷新tab的视图缩略图
 * @param snapshot
 */
function refreshTabView (snapshot) {
  snapshot.forEach(tab => {
    ipcRenderer.send('getCapture', {
      id: tab.id,
      width: 320,
      height: 240
    })
  })
}

async function snapshotsPages (data) {
  try {
    // 取出所有的tab
    const snapshot = await getAllTabsSnapshots(data.winHandle)
    // 渲染所有的tab
    renderSnapshotsGrid(snapshot)
    // 刷新tab的视图
    refreshTabView(snapshot)
  } catch (err) {

  } finally {
    setTimeout(async () => {
      await snapshotsPages(data)
    }, 3000)
  }
}

// window.addEventListener('DOMContentLoaded', async () => {
//   // 加载快照并渲染九宫格
//   setTimeout(snapshotsPages, 3000)
// })

ipcRenderer.once('init-monitor-page-config', (event, data) => {

  // 加载快照并渲染九宫格
  setTimeout(async () => {
    await snapshotsPages(data)
  }, 3000)

})