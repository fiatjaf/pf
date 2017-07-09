const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

const pad = v => require('left-pad')(v, 2, '0')

const today = new Date()

module.exports.formatId = function (_id) {
  let timestamp = parseInt(_id.split(':')[1])
  if (timestamp < 100) {
    return `time ${timestamp}`
  }
  return module.exports.formatTimestamp(timestamp)
}

module.exports.formatTimestamp = function (timestamp) {
  let date = new Date(timestamp * 1000)

  if (today.getFullYear() === date.getFullYear()) {
    if (today.getMonth() === date.getMonth()) {
      if (today.getDate() === date.getDate()) {
        // today
        return `today, ${date.getHours()}:${pad(date.getMinutes())}`
      } else {
        // a different day in the same month
        return `${months[date.getMonth()]} ${pad(date.getDate())}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
      }
    } else {
      // a different month in the same year
      return `${months[date.getMonth()]} ${pad(date.getDate())}`
    }
  } else {
    // a different year
    return `${months[date.getMonth()]} ${pad(date.getDate())} ${date.getFullYear()}`
  }
}
