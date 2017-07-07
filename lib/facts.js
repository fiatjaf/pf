/* eslint-ignore */

const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'facts.txt')

module.exports.readFacts = readFacts
async function readFacts () {
  try {
    return fs
      .readFileSync(file, 'utf-8')
      .split('\n')
  } catch (e) {
    return []
  }
}

module.exports.addFact = addFact
async function addFact (fact, time) {
  time = time || new Date()
  if (isNaN(time.getDate())) {
    throw new Error('date is invalid.')
  }

  fs.appendFileSync(file, `${time.toISOString()} :: ${fact}`, 'utf-8')
  return
}
