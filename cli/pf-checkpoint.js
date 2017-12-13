#!/usr/bin/env node
var program = require('commander')

const {addCheckpoint, listCheckpoints, fetchCheckpoint,
       delCheckpoint, updateCheckpoint} = require('pf-core/checkpoints')

const {formatCheckpoint} = require('./helpers/format')

program
  .command('list')
  .description('list checkpoints')
  .option('-n <n>', 'last <n> checkpoints, defaults to 23.', parseInt)
  .action(async cmd => {
    let n = cmd.n || 23
    let facts = await listCheckpoints()
    facts
      .slice(-n)
      .forEach(fact => console.log(formatCheckpoint(fact)))
  })

program
  .parse(process.argv)
