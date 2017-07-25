const {listRules} = require('./rules')
const {listFacts} = require('./facts')
const patternParser = require('./parser-parser')
const {makeLineParser} = require('./parser')

module.exports.from = async function (state) {
  let rules = await listRules()
  let facts = await listFacts()

  // compile rules
  var reducers = []
  for (let i = 0; i < rules.length; i++) {
    let rule = rules[i]

    let {
      value: directives,
      status: ok,
      expected,
      index
    } = patternParser.parse(rule.pattern)
    if (!ok) {
      console.log(`error parsing pattern '${rule.pattern}:
  expected '${expected.join(', ')}' at index ${index.offset}
  but instead got '${rule.pattern[index.offset]}'`)
      continue
    }
    let lineParser = makeLineParser(directives)

    var fn
    switch (rule.kind) {
      case 'js':
        fn = tryEvalRuleCode(rule.code)
        break
      default:
        fn = () => {}
    }

    reducers.push({
      lineParser,
      fn
    })
  }

  // process all the facts
  for (let i = 0; i < facts.length; i++) {
    let fact = facts[i]
    let timestamp = parseInt(fact._id.split(':')[1])

    for (let j = 0; j < reducers.length; j++) {
      let {lineParser, fn} = reducers[j]
      let {status: succeeded, value: params} = lineParser.parse(fact.line)
      if (succeeded) {
        tryRun(fn, [state, params, timestamp])
      }
    }
  }

  return state
}

function tryEvalRuleCode (code) {
  var module = {exports: () => {}}
  try {
    eval(code)
  } catch (e) {}
  return module.exports
}

function tryRun (fn, args) {
  try {
    fn.apply(null, args)
  } catch (e) {
    console.log(e)
  }
}
