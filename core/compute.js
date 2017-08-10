const debug = require('debug')('pf-core:compute')

const {listRules} = require('./rules')
const {listFacts} = require('./facts')
const patternParser = require('./parser-parser')
const {makeLineParser} = require('./parser')

const compute = {
  from,
  next,
  reducers
}

async function from (state, lastFact = 'f:0') {
  let nextTimestamp = parseInt(lastFact.split(':')[1]) + 1

  let facts = await listFacts('f:' + nextTimestamp)

  let reducers = await compute.reducers()
  debug(`starting computation with state ${JSON.stringify(state)}, ${reducers.length} reducers and ${facts.length} facts.`)

  // process all the facts
  var fact
  for (let i = 0; i < facts.length; i++) {
    fact = facts[i]
    debug(`computing fact ${fact.line}`)
    await compute.next(state, reducers, fact)
  }

  return {
    state,
    last: fact ? fact._id : lastFact
  }
}

async function next (state, reducers, fact) {
  var matched = []
  var errors = []
  var diff = null

  let timestamp = parseInt(fact._id.split(':')[1])

  for (let j = 0; j < reducers.length; j++) {
    let {rule, lineParser, fn} = reducers[j]
    let {status: succeeded, value: params} = lineParser.parse(fact.line)
    if (succeeded) {
      matched.push(rule)
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

async function reducers () {
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
      rule,
      lineParser,
      fn
    })
  }

  return reducers
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

module.exports = compute
