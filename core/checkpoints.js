const debug = require('debug')('pf-core:checkpoints')

const db = require('./db')
const compute = require('./compute')

module.exports.listCheckpoints = listCheckpoints
async function listCheckpoints () {
  let res = db.allDocs({
    startkey: 'chk:',
    endkey: 'chk:~',
    include_docs: true
  })
  return res.rows.map(r => r.doc)
}

module.exports.lastCheckpoint = lastCheckpoint
async function lastCheckpoint () {
  let res = db.allDocs({
    descending: true,
    startkey: 'chk:~',
    endkey: 'chk:',
    limit: 1,
    include_docs: true
  })

  if (res.rows.length) {
    return res.rows[0].doc
  }
}

module.exports.addCheckpoint = addCheckpoint
async function addCheckpoint (content, time) {
  var doc = {}

  if (content && time) {
    debug('content and time are given, save a checkpoint with them.')

    if (isNaN(time.getDate())) {
      throw new Error('date is invalid.')
    }

    doc.state = content
    doc._id = `chk:${parseInt(time.getTime() / 1000)}`
  } else {
    debug('content and time are not given, use the current state.')

    let {state, last} = compute.from({})
    doc.state = state
    doc._id = 'chk:' + last.split(':')[1]
  }

  let res = db.put(doc)
  doc._rev = res.rev
  return doc
}

module.exports.fetchCheckpoint = fetchCheckpoint
async function fetchCheckpoint (id) { return db.get(id) }

module.exports.updateCheckpoint = updateCheckpoint
async function updateCheckpoint (fact) { return db.put(fact) }

module.exports.delCheckpoint = delCheckpoint
async function delCheckpoint (fact) { return db.remove(fact) }
