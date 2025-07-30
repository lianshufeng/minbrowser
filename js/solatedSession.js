const solatedSession = {
  loadTaskConfig: function (event, data) {
    console.log('loadTaskConfig',  data)
    let tab = tabs.get(data.tabId)
    console.log(tab)

  },
  initialize: function () {
    ipc.on('load-task-config', solatedSession.loadTaskConfig)
  }
}

module.exports = solatedSession