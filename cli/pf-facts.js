#!/usr/bin/env node
const program = require('commander')

const {addFact, listFacts, fetchFact, delFact, updateFact} = require('../core/facts')
const {formatLine} = require('./helpers/line')
const autocompleteFacts = require('./helpers/autocomplete-facts')
const editFile = require('./helpers/edit')

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
  .action((line, cmd) => {
    addFact(line, cmd.date)
      .then(() => console.log(`added '${line}'.`))
      .catch(e => console.error(e))
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
      .then(() => console.log(`removed '${factId}'.`))
      .catch(e => console.error(e))
  })

program
  .parse(process.argv)
