const MonitorPage = {
  getAllTabs: function (channel, event, data) {
    datas = [
      {
        id: 12345678,
        title: '百度一下',
        url: 'https://www.baidu.com'
      }
    ]
    ret = []
    tabs.forEach(tab => {
      ret.push({
        id: tab.id,
        title: tab.title,
        url: tab.url
        // previewImage: tab.previewImage
      })
    })
    if (data && data.outChannel) {
      ipc.send(data.outChannel, ret)
    }
  },
  initialize: function () {
    ipc.on('get-all-tabs', MonitorPage.getAllTabs.bind(null, 'get-all-tabs'))
  }
}

module.exports = MonitorPage