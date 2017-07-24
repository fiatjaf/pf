const editor = require('editor')
const tempfile = require('tempfile')
const fs = require('fs')

module.exports = async function edit (contents, ext = '.txt') {
  let filepath = tempfile(ext)
  fs.writeFileSync(filepath, contents, {encoding: 'utf8'})

  return new Promise((resolve, reject) => editor(filepath, (code, sig) => {
    if (code !== 0) return reject(sig)

    fs.readFile(filepath, {encoding: 'utf8'}, (err, editedContents) => {
      if (err) return reject(err)
      resolve(editedContents)
    })
  }))
}
