#!/usr/bin/env node
const program = require('commander')

program
  .version('0.1.0')
  .command('facts', 'create, view, update and delete facts')
  .command('rules', 'create, view, update and delete rules')
  .command('compute', 'compute everything from the last checkpoint')
  .command('checkpoint', 'save a checkpoint with the current state')
  .parse(process.argv)
