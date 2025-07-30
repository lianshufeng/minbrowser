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
  const isCookies = document.getElementById('isCookies').checked
  const platformType = document.getElementById('platformType').value
  const platformAccountName = document.getElementById('platformAccountName').value.trim()
  ipcRenderer.send('set-isolated-session-config', {
    ua, proxy, isCookies, platformType, platformAccountName
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
  if (data && data.config) {
    document.getElementById('ua').value = data.config.ua || ''
    document.getElementById('proxy').value = data.config.proxy || ''
    document.getElementById('isCookies').checked = !!data.config.isCookies
    document.getElementById('platformType').value = data.config.platformType || ''
    document.getElementById('platformAccountName').value = data.config.platformAccountName || ''
  }
})