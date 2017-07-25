#!/usr/bin/env node
const program = require('commander')

const compute = require('../core/compute')

program
  .parse(process.argv)

async function main () {
  let res = await compute.from({})
  console.log(JSON.stringify(res, null, 2))
}

main()
