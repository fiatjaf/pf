const P = require('parsimmon')

const unicodeLetter = require('./helpers/unicode-letter')

const lt = P.string('<')
const gt = P.string('>')
const lsquare = P.string('[')
const rsquare = P.string(']')
const lbracket = P.string('(')
const rbracket = P.string(')')
const ellipsis = P.alt(P.string('…'), P.string('...'))
const colon = P.string(':')
const vertical = P.string('|')
const word = P.regexp(new RegExp(`${unicodeLetter}+`))

const directive = P.alt(
  P.string('words'),
  P.string('word'),
  P.string('numberword'),
  P.string('money'),
  P.string('date'),
  P.string('number')
)

const parameter = P.seq(
  lt,
  P.seq(word, colon).atMost(1).map(([wc]) => wc && wc[0]),
  directive,
  ellipsis.atMost(1).map(([elp]) => Boolean(elp)),
  gt
).map(([_, name, directive, multiple]) => ({
  kind: 'parameter',
  name: name || directive,
  type: directive,
  multiple
}))

const optional = P.seq(
  lsquare,
  P.lazy(() => main).sepBy1(vertical),
  rsquare
).map(([_, alternatives]) => ({
  kind: 'optional',
  alternatives
}))

const alternatives = P.seq(
  lbracket,
  P.lazy(() => main).sepBy1(vertical),
  rbracket
).map(([_, alternatives]) => ({
  kind: 'alternatives',
  alternatives
}))

const literal = P.noneOf('[<()>]| ')
  .atLeast(1)
  .map(results => ({kind: 'literal', string: results.join('')}))

var main = P.alt(
  P.whitespace.result({kind: 'whitespace'}),
  parameter,
  optional,
  alternatives,
  literal
).atLeast(1)

module.exports = {
  parse (pattern) {
    return main.parse(pattern.trim())
  },
  tryParse (pattern) {
    return main.tryParse(pattern.trim())
  }
}
