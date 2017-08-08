const {listRules} = require('./rules')
const {listFacts} = require('./facts')
const patternParser = require('./parser-parser')
const {makeLineParser} = require('./parser')

module.exports.from = async function (state, lastFact = 'f:0') {
  let nextTimestamp = parseInt(lastFact.split(':')[1]) + 1

  let facts = await listFacts('f:' + nextTimestamp)
  let rules = await listRules()

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
  but instead got '${rule.pattern[index.offset]}' (${rule.pattern.slice(index.offset - 2, index.offset + 2)})`)
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
      id: rule._id,
      pattern: rule.pattern,
      lineParser,
      fn
    })
  }

  // process all the facts
  var fact
  for (let i = 0; i < facts.length; i++) {
    fact = facts[i]
    module.exports.next(state, reducers, fact)
  }

  return {
    state,
    last: fact ? fact._id : lastFact
  }
}

module.exports.next = function (state, reducers, fact) {
  var matched = []
  var errors = []
  var diff = null

  let timestamp = parseInt(fact._id.split(':')[1])

  for (let j = 0; j < reducers.length; j++) {
    let {id, pattern, lineParser, fn} = reducers[j]
    let {status: succeeded, value: params} = lineParser.parse(fact.line)
    if (succeeded) {
      matched.push({id, pattern})
      let err = tryRun(fn, [state, params, timestamp])
      if (err) {
        errors.push(err)
      }
    }
  }

  return {
    state,
    matched,
    errors,
    diff
  }
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
    return e
  }
}
