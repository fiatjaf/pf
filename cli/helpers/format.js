const {bold, cyan} = require('chalk')

const {formatId} = require('pf-core/helpers/date')

module.exports.formatLine = fact => {
  let lines = fact.line.split('\n')
  let first = lines[0]
  let extra = lines.length - 1
  return `${cyan(formatId(fact._id))} ${bold('::')} ${first}${extra ? ` (+${extra} lines)` : ''}`
}

module.exports.formatRule = rule => `${cyan(rule._id)} ${bold('::')} ${rule.pattern}`
