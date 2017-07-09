const {formatId} = require('../../core/helpers/date')

module.exports.formatLine = fact => {
  let lines = fact.line.split('\n')
  let first = lines[0]
  let extra = lines.length - 1
  return `${formatId(fact._id)} :: ${first}${extra ? ` (+${extra} lines)` : ''}`
}
