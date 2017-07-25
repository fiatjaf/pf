const path = require('path')
const PouchDB = require('pouchdb-core')
  .plugin(require('pouchdb-adapter-leveldb'))
  .plugin(require('pouchdb-adapter-http'))
  .plugin(require('pouchdb-replication'))

const file = path.join(process.cwd(), '_database')

module.exports = new PouchDB(file)
