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

  let platformName = ''
  if (platformType === 'other') {
    platformName = document.getElementById('customPlatform').value.trim()
  }



  // ---- 校验逻辑 ----
  if (isSolated) {
    if (!platformType) {
      alert('请选择平台类型')
      document.getElementById('platformType').focus()
      return
    }
    if (platformType === 'other' && !platformName) {
      alert('请输入自定义平台名称')
      document.getElementById('customPlatform').focus()
      return
    }
    if (!platformAccountName) {
      alert('请输入平台账号名称')
      document.getElementById('platformAccountName').focus()
      return
    }
  }
  // ---- 校验结束 ----



  ipcRenderer.send('update-isolated-session-config', {
    tabId: window.tabId,
    config: {
      ua, proxy, isSolated, platformType, platformName, platformAccountName
    }
  })
  window.close()
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('platformType').focus()
  document.getElementById('platformType').addEventListener('change', function () {
    if (this.value === 'other') {
      document.getElementById('customPlatformGroup').style.display = 'block'
    } else {
      document.getElementById('customPlatformGroup').style.display = 'none'
      document.getElementById('customPlatform').value = ''
    }
  })
})

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
      platformName: '',
      platformAccountName: ''
    }
    window.tabId = data.tab.id
    document.getElementById('ua').value = solatedSession.ua
    document.getElementById('proxy').value = solatedSession.proxy
    document.getElementById('isSolated').checked = !!solatedSession.isSolated
    document.getElementById('platformAccountName').value = solatedSession.platformAccountName

    // 回显类型和名称
    const platformTypeSelect = document.getElementById('platformType')
    platformTypeSelect.value = solatedSession.platformType || ''
    if (solatedSession.platformType === 'other') {
      document.getElementById('customPlatformGroup').style.display = 'block'
      document.getElementById('customPlatform').value = solatedSession.platformName || ''
    } else {
      document.getElementById('customPlatformGroup').style.display = 'none'
      document.getElementById('customPlatform').value = ''
    }
  }
})
