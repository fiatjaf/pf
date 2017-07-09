const editor = require('editor')
const tmp = require('tmp-file')
const fs = require('fs')

module.exports = async function edit (contents) {
  let file = await tmp(contents)
  return new Promise((resolve, reject) => editor(file.path, (code, sig) => {
    if (code !== 0) return reject(sig)

    fs.readFile(file.path, {encoding: 'utf8'}, (err, editedContents) => {
      if (err) return reject(err)
      resolve(editedContents)
    })
  }))
}
