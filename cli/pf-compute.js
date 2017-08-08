#!/usr/bin/env node
const program = require('commander')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')

const compute = require('../core/compute')

program
  .option('-s, --scratch', 'compute from scratch')
  .description(`by default, this will look for a temporary file where the supposedly last updated version of the computed state has been stored and compute from that. If it is not found, then it will compute from scratch. You can force this behavior by passing -s.`)
  .parse(process.argv)

async function main (cmd) {
  var initial = {}
  var lastFact

  let tempPath = path.join('/tmp', process.cwd())
  let tempFile = path.join(tempPath, 'state.json')
  if (!cmd.scratch) {
    try {
      let d = fs.readFileSync(tempFile, 'utf-8')
      let current = JSON.parse(d)
      initial = current.state
      lastFact = current.last
    } catch (e) {}
  }

  let {state, last} = await compute.from(initial, lastFact)
  console.log(JSON.stringify(state, null, 2))

  mkdirp.sync(tempPath)
  fs.writeFileSync(tempFile, JSON.stringify({state, last}), {encoding: 'utf-8'})
}

main(program)
