const browserUI = require('./browserUI')
const MonitorPage = {
  getAllTabs: function (channel, event, data) {
    ret = []
    tabs.forEach(tab => {
      ret.push({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        imageUrl: tab.previewImage
      })
    })
    if (data && data.outChannel) {
      ipc.send(data.outChannel, ret)
    }
  },
  setTabSelected: function (channel, event, data) {
    browserUI.switchToTab(data.id)
  },
  initialize: function () {
    ipc.on('get-all-tabs', MonitorPage.getAllTabs.bind(null, 'get-all-tabs'))

    // 选择tab
    ipc.on('set-tab-selected', MonitorPage.setTabSelected.bind(null, 'set-tab-selected'))
  }
}

module.exports = MonitorPage