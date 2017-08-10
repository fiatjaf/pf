#!/usr/bin/env node
const program = require('commander')
const debug = require('debug')('pf-cli:pf-compute')

const compute = require('pf-core/compute')
const cached = require('./helpers/cached')

program
  .option('-r, --reset', 'compute from scratch')
  .description(`by default, this will look for a temporary file where the supposedly last updated version of the computed state has been stored and compute from that. If it is not found, then it will compute from scratch. You can force this behavior by passing -r.`)
  .parse(process.argv)

async function main (cmd) {
  var initial = {}
  var lastFact

  if (cmd.reset) {
    debug('will reset.')
  } else {
    debug('will read from cache.')

    let current = cached.read()
    initial = current.state
    lastFact = current.lastFact

    debug(`state read: %j`, initial)
    debug(`last fact read: ${lastFact}`)
  }

  if (!initial) {
    initial = {}
    lastFact = undefined
  }

  let {state, last} = await compute.from(initial, lastFact)

  console.log(JSON.stringify(state))
  cached.write(state, last)
}

main(program)
