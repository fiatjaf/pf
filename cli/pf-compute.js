#!/usr/bin/env node
const program = require('commander')

program
  .option('-n, --lines <n>', 'last <n> facts')
  .parse(process.argv)

console.log(program)
