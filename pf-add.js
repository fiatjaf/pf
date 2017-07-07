#!/usr/bin/env node
const program = require('commander')
const {addFact} = require('./lib/facts')

program
  .usage('[options] <fact>')
  .option('-d, --date <date>',
    'add this fact with the given date, instead of now.',
    d => new Date(d))
  .parse(process.argv)

let fact = program.args[0]
addFact(fact, program.date)
  .then(() => console.log('added'))
  .catch(e => console.error(e))
