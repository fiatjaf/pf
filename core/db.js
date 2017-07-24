const path = require('path')
const PouchDB = require('pouchdb-node')

const file = path.join(process.cwd(), '_database')

module.exports = new PouchDB(file)
