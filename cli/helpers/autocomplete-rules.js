const Sifter = require('sifter')
const Autocomplete = require('prompt-autocompletion')

const {listRules} = require('../../core/rules')

const {formatLine} = require('./line')

module.exports = async function rulesAutocompleter (message) {
  let rules = await listRules()
  if (!rules) {
    console.log('Your database has 0 rules.')
    return
  }

  let sifter = new Sifter(rules)
  let autocomplete = new Autocomplete({
    type: 'autocomplete',
    name: 'rule',
    message: message,
    source: async (_, input) => {
      input = input || ''
      let r = sifter.search(input, {fields: ['line'], limit: 23, sort_empty: '_id desc'})
      return r.items
        .map(item => rules[item.id])
        .map(doc => ({value: doc._id, name: formatLine(doc)}))
    }
  })

  return autocomplete.run()
}
