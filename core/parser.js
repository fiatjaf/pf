const P = require('parsimmon')
const xtend = require('xtend')

const unicodeLetter = require('./helpers/unicode-letter')

module.exports.makeLineParser = makeLineParser

function makeLineParser (directives) {
  return P.seq.apply(P, directives.map((directive, i) =>
    parserFromDirective(directive, i, directives)
  ))
  .map(args => args
    .filter(x => typeof x === 'object' && !Array.isArray(x))
    .reduce((acc, elem) => xtend(acc, elem), {})
  )
}

function parserFromDirective (directive, i, directives) {
  switch (directive.kind) {
    case 'whitespace':
      return P.optWhitespace
    case 'literal':
      return P.string(directive.string)
    case 'alternatives':
      return P.alt.apply(P, directive.alternatives.map(makeLineParser))
    case 'optional':
      return P.alt.apply(P, directive.alternatives.map(makeLineParser))
        .or(P.optWhitespace)
    case 'parameter':
      return P.lazy(() => {
        if (directive.type === 'words') {
          let following = directives.slice(i + 1)
          return wordsUntil(P.seq.apply(P, following.map(parserFromDirective)), [])
        }

        let typeParser = types[directive.type]
        if (directive.multiple) {
          typeParser = P.sepBy1(
            typeParser,
            P.seq(
              P.optWhitespace,
              P.string(directive.separator || ','),
              P.optWhitespace
            )
          )
        }
        return typeParser
      })
        .map(v => ({[directive.name]: v}))
  }
}

const word = P.regexp(new RegExp(`${unicodeLetter}+`))
  .desc('_a word_')

const wordsUntil = (nextParser, words) =>
  word.skip(P.optWhitespace)
    .chain(w => {
      let nwords = words.concat(w)
      return P.lookahead(nextParser)
        .map(() => nwords.join(' '))
        .or(P.lazy(() => wordsUntil(nextParser, nwords)))
    })

const numberword = P.regexp(new RegExp(`(?:\\d|${unicodeLetter})+`))
  .desc('_a word mingled with numbers_')

const day = P.regexp(/(?:[0-2]\d|3[0-1]|\d)/)
  .desc('_a day (like 7, 18 or 31) _')
  .map(x => {
    let today = new Date()
    today.setDate(parseInt(x))
    return today.toISOString().split('T')[0]
  })

const date = P.alt(
  P.regexp(/\d{1,2}\/\d{1,2}\/\d{4}/).map(x => x.split('/').reverse().join('-')),
  P.regexp(/\d{1,2}\/\d{1,2}/).map(x => {
    let today = new Date()
    let [day, month] = x.split('/')
    today.setDate(parseInt(day))
    today.setMonth(parseInt(month) - 1)
    return today.toISOString().split('T')[0]
  }),
  day
)
  .desc('_date_')

const decimal = P.regexp(/\d+(?:[,.]\d{2})?/)
  .desc('_number optionally with decimals_')
  .map(x => parseFloat(x.replace(',', '.')))

const integer = P.regexp(/\d+/)
  .desc('_number without decimals_')
  .map(x => parseInt(x))

const money = P.seq(
  P.regexp(/(\$|\$ )?/),
  decimal
)
  .map(([_, n]) => n)

const types = {
  word,
  day,
  date,
  money,
  number: integer,
  integer,
  decimal,
  numberword
}
