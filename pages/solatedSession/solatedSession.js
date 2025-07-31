// document.getElementById('ok').onclick = function () {
//   const ua = document.getElementById('ua').value.trim()
//   const proxy = document.getElementById('proxy').value.trim()
//   const isCookies = document.getElementById('isCookies').checked
//   const platformType = document.getElementById('platformType').value
//   const platformAccountName = document.getElementById('platformAccountName').value.trim()
//   // ipcRenderer.send('set-isolated-session-config', {
//   //   ua, proxy, isCookies, platformType, platformAccountName
//   // })
//   window.close()
// }
// ipcRenderer.on('init-config', (event, data) => {
//   if (data && data.config) {
//     document.getElementById('ua').value = data.config.ua || ''
//     document.getElementById('proxy').value = data.config.proxy || ''
//     document.getElementById('isCookies').checked = !!data.config.isCookies
//     document.getElementById('platformType').value = data.config.platformType || ''
//     document.getElementById('platformAccountName').value = data.config.platformAccountName || ''
//   }
// })
// window.onload = () => {
//   document.getElementById('platformType').focus()
// }

const { ipcRenderer } = require('electron')

function cancel () {
  window.close()
}

function response () {
  const ua = document.getElementById('ua').value.trim()
  const proxy = document.getElementById('proxy').value.trim()
  const isSolated = document.getElementById('isSolated').checked
  const platformType = document.getElementById('platformType').value
  const platformAccountName = document.getElementById('platformAccountName').value.trim()
  ipcRenderer.send('update-isolated-session-config', {
    tabId: window.tabId,
    config: {
      ua, proxy, isSolated, platformType, platformAccountName
    }
  })
  window.close()
}

document.addEventListener('DOMContentLoaded', function () {
  // 平台类型
  document.getElementById('platformType').focus()

})

// 页面加载
window.addEventListener('load', function () {
  document.getElementById('ok').addEventListener('click', response)
  document.getElementById('cancel').addEventListener('click', cancel)
})

ipcRenderer.on('init-config', (event, data) => {
  if (data && data.tab) {
    document.title = '[' + data.tab.title + ']\t 设置隔离会话'
    let solatedSession = data.tab.solatedSession || {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      proxy: '',
      isSolated: false,
      platformType: '',
      platformAccountName: ''
    }
    window.tabId = data.tab.id
    document.getElementById('ua').value = solatedSession.ua
    document.getElementById('proxy').value = solatedSession.proxy
    document.getElementById('isSolated').checked = !!solatedSession.isSolated
    document.getElementById('platformType').value = solatedSession.platformType
    document.getElementById('platformAccountName').value = solatedSession.platformAccountName
  }
})