#!/usr/bin/env node
const program = require('commander')

const {addRule, listRules, fetchRule, delRule, updateRule} = require('pf-core/rules')
const autocompleteRules = require('./helpers/autocomplete-rules')
const editFile = require('./helpers/edit')
const {formatRule} = require('./helpers/format')
const cached = require('./helpers/cached')

program
  .command('list')
  .description('list rules')
  .option('-n, --lines <n>', 'last <n> rules, defaults to 23.', parseInt)
  .action(async cmd => {
    let nlines = cmd.lines || 23
    let rules = await listRules()
    rules
      .slice(-nlines)
      .forEach(rule => console.log(formatRule(rule)))
  })

program
  .command('add [kind]')
  .description('create a new rule')
  .option('--kind <lang>', "language in which the rule will be written. defaults to 'js'")
  .action(async (_, cmd) => {
    let kind = cmd.kind || 'js'
    var pattern

    if (kind === 'js') {
      let newcontents = await editFile(`/*
 * pattern: <name:word> has paid <money>
 */

module.exports = function (state, params, timestamp) {
  state.paid = state.paid || {}
  state.paid[params.name] = state.paid[name] || []
  state.paid[params.name].push({when: timestamp, amount: currency})
}`, '.js')
      if (newcontents.trim() === '') {
        console.log('aborting.')
        return
      }

      try {
        pattern = newcontents.match(/pattern\s*:(.+)/)[1].trim()
      } catch (e) {
        console.log(newcontents)
        console.error('missing pattern.')
        return
      }

      console.log(kind, pattern, newcontents)
      addRule(kind, pattern, newcontents)
        .then(cached.reset)
        .then(() => console.log('rule added.'))
        .catch(e => console.error(e))
      return
    }

    console.log(`kind ${kind} not supported yet.`)
  })

program
  .command('show [rule_id]')
  .description('see a rule')
  .action(async ruleId => {
    ruleId = ruleId || await autocompleteRules('Select a rule to edit:')

    let rule = await fetchRule(ruleId)
    console.log(`id: ${rule._id}
rev: ${rule._rev}
pattern: ${rule.pattern}
kind: ${rule.kind}

${rule.code}
    `)
  })

program
  .command('edit [rule_id]')
  .description('edit a rule')
  .action(async ruleId => {
    ruleId = ruleId || await autocompleteRules('Select a rule to edit:')

    let rule = await fetchRule(ruleId)
    let newcontents = await editFile(rule.code, '.js')
    var pattern

    try {
      pattern = newcontents.match(/pattern\s*:(.+)/)[1].trim()
    } catch (e) {
      console.log(newcontents)
      console.error('missing pattern. ignoring update.')
      return
    }

    if (rule.pattern === pattern && rule.code === newcontents) {
      console.log('nothing has changed.')
      return
    }

    rule.pattern = pattern
    rule.code = newcontents

    updateRule(rule)
      .then(cached.reset)
      .then(() => console.log(`updated ${ruleId}.`))
      .catch(e => console.error(e))
  })

program
  .command('del [rule_id]')
  .description('remove a rule')
  .action(async () => {
    var ruleId
    if (program.args.length === 0) {
      ruleId = await autocompleteRules('Select a rule to delete:')
    } else {
      ruleId = program.args[0]
    }

    fetchRule(ruleId).then(delRule)
      .then(cached.reset)
      .then(() => console.log(`removed '${ruleId}'.`))
      .catch(e => console.error(e))
  })

program
  .parse(process.argv)
