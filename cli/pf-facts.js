#!/usr/bin/env node
const program = require('commander')
const formatterConsole = require('jsondiffpatch/src/formatters/console')
const {yellow, bgYellow, gray, red, green, blue} = require('chalk')

const {addFact, listFacts, fetchFact, delFact, updateFact} = require('pf-core/facts')
const compute = require('pf-core/compute')

const {formatLine, formatRule} = require('./helpers/format')
const autocompleteFacts = require('./helpers/autocomplete-facts')
const editFile = require('./helpers/edit')
const cached = require('./helpers/cached')

program
  .command('list')
  .description('list facts')
  .option('-n, --lines <n>', 'last <n> facts, defaults to 23.', parseInt)
  .action(async cmd => {
    let nlines = cmd.lines || 23
    let facts = await listFacts()
    facts
      .slice(-nlines)
      .forEach(fact => console.log(formatLine(fact)))
  })

program
  .command('add <line>')
  .description('add a new fact')
  .option('-d, --date <date>',
    'add this fact with the given date, instead of now.', d => new Date(d))
  .action(async (line, cmd) => {
    // compute everything till this point so we can compute this fact
    let prev = cached.read()
    let res = await compute.from(prev.state, prev.lastFact)

    // now add this fact
    let fact = await addFact(line, cmd.date)
    console.log(` ${yellow('#')} added '${bgYellow.black(line)}'.`)

    // then compute this fact
    let reducers = await compute.reducers()
    let {state, matched, errors, diff} = await compute.next(res.state, reducers, fact)

    // write to cache
    cached.write(state, fact._id)

    // print all the info
    matched.forEach(rule =>
      console.log(` ${green('>')} matched rule ${formatRule(rule)}`)
    )

    errors.forEach(err =>
      console.log(` ${red('>')} error: ${err}`)
    )

    let f = formatterConsole.format(diff).split('\n').map(l => '  ' + l).join('\n')
    console.log(` ${blue('>')} diff: ${gray(f)}`)
  })

program
  .command('edit [fact_id]')
  .description('edit a fact')
  .action(async factId => {
    factId = factId || await autocompleteFacts('Select a fact to edit:')

    let fact = await fetchFact(factId)
    let newcontents = await editFile(`${fact.line}

# replace the line(s) above with the new, updated version of the fact.
# a fact can span through multiple lines.
# lines starting with a hash will be ignored.
# if there are no valid lines, this update will be ignored.
    `)

    let newline = newcontents
      .split('\n')
      .map(line => line.trim())
      .filter(line => line[0] && line[0] !== '#')
      .join('\n')

    if (!newline || newline === fact.line) {
      console.log('ignoring update.')
      return
    }

    fact.line = newline
    updateFact(fact)
      .then(cached.reset)
      .then(() => console.log(`updated ${factId}.`))
      .catch(e => console.error(e))
  })

program
  .command('del [fact_id]')
  .description('remove a fact')
  .action(async () => {
    var factId
    if (program.args.length === 0) {
      factId = await autocompleteFacts('Select a fact to delete:')
    } else {
      factId = program.args[0]
    }

    fetchFact(factId).then(delFact)
      .then(cached.reset)
      .then(() => console.log(`removed '${factId}'.`))
      .catch(e => console.error(e))
  })

program
  .parse(process.argv)
