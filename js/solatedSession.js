const webviews = require('./webviews')
const SolatedSession = {

  updateIsolatedSessionConfig: function (event, data) {
    tabs.update(data.tabId, {
      'solatedSession': data.config
    })
    // todo 重置webview
    webviews.destroy(data.tabId)
    webviews.add(data.tabId)
    if (data.tabId === tabs.getSelected()) {
      webviews.setSelected(data.tabId)
    }
  },
  loadTabConfig: function (channel, event, data) {
    // console.log(channel, event, data)
    // 按 - 拆分，把第一个（前缀）去掉，拼回去
    const outChannel = channel.split('-').slice(1).join('-')
    ipc.send(outChannel, tabs.get(data.tabId))
  },
  initialize: function () {

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