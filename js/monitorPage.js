const browserUI = require('./browserUI')
var settings = require('util/settings/settings.js')

const MonitorPage = {
  getAllTabs: function (channel, event, data) {
    ret = []
    tabs.forEach(tab => {
      ret.push({
        id: tab.id,
        title: tab.title,
        url: tab.url
      })
    })
    if (data && data.outChannel) {
      ipc.send(data.outChannel, ret)
    }
  },
  setTabSelected: function (channel, event, data) {
    browserUI.switchToTab(data.id)
  },
  getTabSelected: function (channel, event, data) {
    console.log('js', 'get-tab-selected', tabs.get(tabs.getSelected()))
    if (data && data.outChannel) {
      ipc.send(data.outChannel, tabs.get(tabs.getSelected()))
    }
  },
  getSettingConfig: function (channel, event, data) {
    if (data && data.outChannel) {
      let ret = settings.get(data.key)
      if (!ret) {
        ret = data.value
      }
      ipc.send(data.outChannel, ret)
    }
  },
  setSettingConfig: function (channel, event, data) {
    if (data && data.outChannel) {
      settings.set(data.key, data.value)
      ipc.send(data.outChannel, true)
    }
  },
  initialize: function () {
    ipc.on('get-all-tabs', MonitorPage.getAllTabs.bind(null, 'get-all-tabs'))

    // 选择tab
    ipc.on('set-tab-selected', MonitorPage.setTabSelected.bind(null, 'set-tab-selected'))
    ipc.on('get-tab-selected', MonitorPage.getTabSelected.bind(null, 'get-tab-selected'))

    ipc.on('get-setting-config', MonitorPage.getSettingConfig.bind(null, 'get-setting-config'))
    ipc.on('set-setting-config', MonitorPage.setSettingConfig.bind(null, 'set-setting-config'))

  }
}

module.exports = MonitorPage