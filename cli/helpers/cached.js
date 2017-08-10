const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const _path = path.join('/tmp', process.cwd())
const _file = path.join(_path, 'cached.json')

module.exports.path = _path
module.exports.file = _file

module.exports.read = function () {
  try {
    let d = fs.readFileSync(_file, 'utf-8')
    return JSON.parse(d)
  } catch (e) {
    return {state: {}, lastFact: undefined}
  }
}

module.exports.reset = function () {
  mkdirp.sync(_path)
  return fs.writeFileSync(_file, '{}', {encoding: 'utf-8'})
}

module.exports.write = function (state, lastFact) {
  mkdirp.sync(_path)
  return fs.writeFileSync(_file, JSON.stringify({
    state,
    lastFact
  }), {encoding: 'utf-8'})
}
