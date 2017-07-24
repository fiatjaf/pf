const cuid = require('cuid')

const db = require('./db')

module.exports.addRule = addRule
async function addRule (kind, pattern, code) {
  return db.put({
    _id: `r:${cuid.slug()}`,
    kind,
    pattern,
    code
  })
}

module.exports.listRules = listRules
async function listRules () {
  try {
    let res = await db.allDocs({
      startkey: 'r:',
      endkey: 'r:~',
      include_docs: true
    })
    return res.rows.map(r => r.doc)
  } catch (e) {
    console.log(e)
  }
}

module.exports.fetchRule = fetchRule
async function fetchRule (id) { return db.get(id) }

module.exports.updateRule = updateRule
async function updateRule (rule) { return db.put(rule) }

module.exports.delRule = delRule
async function delRule (rule) { return db.remove(rule) }
