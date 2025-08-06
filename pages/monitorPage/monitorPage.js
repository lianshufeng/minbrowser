// tabs-snapshot.js
const { ipcRenderer } = require('electron')

function getAllTabsSnapshots (callback) {
  // 请求主进程拿到所有tab的信息
  const outChannel = 'get-all-tabs-' + new Date().getTime()
  ipcRenderer.once(outChannel, (data) => {
    console.log('get-all-tabs', data)
  })
  ipcRenderer.send('get-all-tabs', {
    outChannel: outChannel
  })
}

// function renderSnapshotsGrid (snapshots) {
//   const grid = document.querySelector('.grid-container')
//   if (!grid) return
//   grid.innerHTML = '' // 清空旧内容
//   snapshots.forEach((tab, idx) => {
//     const div = document.createElement('div')
//     div.className = 'tab-item'
//     div.innerHTML = `
//       <img class="tab-snapshot" src="${tab.imageUrl}" alt="${tab.title}">
//       <div class="tab-info">
//         <div class="tab-title">${tab.title}</div>
//         <div class="tab-url">${tab.url}</div>
//       </div>
//     `
//     // 绑定切换tab事件
//     div.onclick = () => {
//       ipcRenderer.invoke('activate-tab', tab.url)
//     }
//     grid.appendChild(div)
//   })
// }

window.addEventListener('DOMContentLoaded', async () => {
  // 加载快照并渲染九宫格
  const snapshots = getAllTabsSnapshots()
  // renderSnapshotsGrid(snapshots)
})
