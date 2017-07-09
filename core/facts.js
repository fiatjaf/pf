const db = require('./db')

module.exports.listFacts = listFacts
async function listFacts () {
  let res = await db.allDocs({
    startkey: 'f:',
    endkey: 'f:~',
    include_docs: true
  })
  return res.rows.map(r => r.doc)
}

module.exports.addFact = addFact
async function addFact (line, time) {
  time = time || new Date()
  if (isNaN(time.getDate())) {
    throw new Error('date is invalid.')
  }

  return db.put({
    _id: `f:${parseInt(time.getTime() / 1000)}`,
    line
  })
}

module.exports.fetchFact = fetchFact
async function fetchFact (id) { return db.get(id) }

module.exports.updateFact = updateFact
async function updateFact (fact) { return db.put(fact) }

module.exports.delFact = delFact
async function delFact (fact) { return db.remove(fact) }
