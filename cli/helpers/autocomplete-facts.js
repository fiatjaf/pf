const Sifter = require('sifter')
const Autocomplete = require('prompt-autocompletion')

const {listFacts} = require('pf-core/facts')

const {formatLine} = require('./format')

module.exports = async function factsAutocompleter (message) {
  let facts = await listFacts()
  if (!facts) {
    console.log('Your database has 0 facts.')
    return
  }

  let sifter = new Sifter(facts)
  let autocomplete = new Autocomplete({
    type: 'autocomplete',
    name: 'fact',
    message: message,
    source: async (_, input) => {
      input = input || ''
      let r = sifter.search(input, {fields: ['line'], limit: 23, sort_empty: '_id desc'})
      return r.items
        .map(item => facts[item.id])
        .map(doc => ({value: doc._id, name: formatLine(doc)}))
    }
  })

  return autocomplete.run()
}
