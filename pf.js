#!/usr/bin/env node
const program = require('commander')

program
  .version('0.1.0')
  .command('list', 'list facts')
  .command('add <fact>', 'add a fact')
  .command('compute', 'compute everything from the last checkpoint')
  .command('checkpoint', 'save a checkpoint with the current state')
  .parse(process.argv)
