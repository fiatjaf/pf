#!/usr/bin/env node
const program = require('commander')
const {readFacts} = require('./lib/facts')

program
  .option('-n, --lines <n>', 'last <n> facts, defaults to 23.', parseInt)
  .parse(process.argv)

// program.lines = program.lines || 23
readFacts()
  .then(facts => facts
    .slice(-program.lines)
    .forEach(fact => console.log(fact))
  )
  .catch(e => console.error(e))
