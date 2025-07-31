const SolatedSession = {
  // loadTabConfigIsolatedSession: function (event, data) {
  //   ipc.send('tab-config-isolated-session', tabs.get(data.tabId))
  // },
  // loadTabConfigViewManager: function (event, data) {
  //   ipc.send('tab-config-view-manager', tabs.get(data.tabId))
  // },
  updateIsolatedSessionConfig: function (event, data) {
    tabs.update(data.tabId, {
      'solatedSession': data.config
    })
  },
  loadTabConfig: function (channel, event, data) {
    // console.log(channel, event, data)
    // 按 - 拆分，把第一个（前缀）去掉，拼回去
    const outChannel = channel.split('-').slice(1).join('-')
    ipc.send(outChannel, tabs.get(data.tabId))
  },
  initialize: function () {
    // ipc.on('load-tab-config-isolated-session', SolatedSession.loadTabConfigIsolatedSession)
    // ipc.on('load-tab-config-view-manager', SolatedSession.loadTabConfigViewManager)
    // 自动注册，然后将load去掉
    const TAB_CONFIG_CHANNELS = [
      'load-tab-config-isolated-session',
      'load-tab-config-view-manager'
    ]
    TAB_CONFIG_CHANNELS.forEach(channel => {
      ipc.on(channel, SolatedSession.loadTabConfig.bind(null, channel))
    })

    ipc.on('update-isolated-session-config', SolatedSession.updateIsolatedSessionConfig)
  }
}

module.exports = SolatedSession