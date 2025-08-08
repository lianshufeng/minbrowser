const browserUI = require('./browserUI')
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
  initialize: function () {
    ipc.on('get-all-tabs', MonitorPage.getAllTabs.bind(null, 'get-all-tabs'))

    // 选择tab
    ipc.on('set-tab-selected', MonitorPage.setTabSelected.bind(null, 'set-tab-selected'))

    ipc.on('get-tab-selected', MonitorPage.getTabSelected.bind(null, 'get-tab-selected'))

  }
}

module.exports = MonitorPage