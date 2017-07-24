const {createToken, Lexer, Parser} = window.chevrotain

const unicodeLetter = require('./helpers/unicode-letter')

module.exports.parseRule = parseRule

const WORD = createToken({
  name: 'WORD',
  label: 'word',
  pattern: new RegExp(unicodeLetter + '+')
})
const NUMBER = createToken({name: 'NUMBER', pattern: /\d+/, label: 'number'})
const WHITESPACE = createToken({name: 'WHITESPACE', pattern: /\s+/})
const ANYTHING = createToken({name: 'ANYTHING', pattern: /[^\s\[\]\(\):><\d\w]+/, label: 'anything'})
const LT = createToken({name: 'LT', pattern: /</, label: '<'})
const GT = createToken({name: 'GT', pattern: />/, label: '>'})
const LSQUARE = createToken({name: 'LSQUARE', pattern: /\[/, label: '['})
const RSQUARE = createToken({name: 'RSQUARE', pattern: /]/, label: ']'})
const LBRACKET = createToken({name: 'LBRACKET', pattern: /\(/, label: '('})
const RBRACKET = createToken({name: 'RBRACKET', pattern: /\)/, label: ')'})
const ELLIPSIS = createToken({name: 'ELLIPSIS', pattern: /…|\.\.\./, label: '…'})
const COLON = createToken({name: 'COLON', pattern: /:/, label: ':'})
const DIRECTIVE = createToken({
  name: 'DIRECTIVE',
  pattern: /words|word|numberword|money|date|number/,
  label: 'directive'
})
const VERTICALBAR = createToken({name: 'VERTICALBAR', pattern: /|/, label: '|'})

let tokens = [
  WHITESPACE, LT, GT, VERTICALBAR, LSQUARE, RSQUARE, LBRACKET, RBRACKET,
  ELLIPSIS, COLON, DIRECTIVE, NUMBER, WORD, ANYTHING
]
let lexer = new Lexer(tokens)

function RuleParser (input) {
  Parser.call(this, input, tokens, {recoveryEnabled: true})
  var $ = this

  $.RULE('main', () => {
    return $.AT_LEAST_ONE(() =>
      $.OR([
        {ALT: () => $.CONSUME(WHITESPACE) && {kind: 'whitespace'} },
        {ALT: () => $.SUBRULE($.parameter) },
        {ALT: () => $.SUBRULE($.optional) },
        {ALT: () => $.SUBRULE($.alternatives) },
        {ALT: () => $.SUBRULE($.literal) }
      ])
    )
  })

  $.RULE('parameter', () => {
    var name
    $.CONSUME(LT)
    $.OPTION1(() => {
      name = $.CONSUME(WORD).image
      $.CONSUME(COLON)
    })
    let type = $.CONSUME2(DIRECTIVE).image
    var multiple = false
    $.OPTION2(() => {
      if ($.CONSUME(ELLIPSIS)) {
        multiple = true
      }
    })
    $.CONSUME(GT)

    if (!name) name = type

    return {kind: 'parameter', name, type, multiple}
  })

  $.RULE('alternatives', () => {
    $.CONSUME(LBRACKET)
    let alternatives = $.SUBRULE($.or)
    $.CONSUME(RBRACKET)
    return {kind: 'alternatives', alternatives}
  })

  $.RULE('optional', () => {
    $.CONSUME(LSQUARE)
    let alternatives = $.SUBRULE($.or)
    $.CONSUME(RSQUARE)
    return {kind: 'optional', alternatives}
  })

  $.RULE('literal', () => {
    let string = $.SUBRULE($.anything)
    return {kind: 'literal', string}
  })

  $.RULE('or', () => {
    var alternatives = []
    $.AT_LEAST_ONE_SEP({
      SEP: VERTICALBAR,
      DEF: () => {
        let alt = $.SUBRULE($.main)
        alternatives.push(alt)
      }
    })
    return alternatives
  })

  $.RULE('anything', () => {
    var string = ''
    $.AT_LEAST_ONE(() => {
      string += $.OR([
        {ALT: () => $.CONSUME(LT).image },
        {ALT: () => $.CONSUME(GT).image },
        {ALT: () => $.CONSUME(COLON).image },
        {ALT: () => $.CONSUME(ELLIPSIS).image },
        {ALT: () => $.CONSUME(WORD).image },
        {ALT: () => $.CONSUME(NUMBER).image },
        {ALT: () => $.CONSUME(ANYTHING).image }
      ])
    })
    return string
  })

  Parser.performSelfAnalysis(this)
}

RuleParser.prototype = Object.create(Parser.prototype)
RuleParser.prototype.constructor = RuleParser

let ruleParser = new RuleParser([])

function parseRule (text) {
  let lexResult = lexer.tokenize(text.trim())
  ruleParser.input = lexResult.tokens
  let value = ruleParser.main()

  return {
    value,
    lexErrors: lexResult.errors,
    parseErrors: ruleParser.errors
  }
}
