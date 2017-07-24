global.window = {}
window.chevrotain = require('chevrotain')

const {parseRule} = require('./parser-parser')
const {makeLineParser} = require('./parser')
const tape = require('tape')

tape('parsing user-defined rule definitions', t => {
  var rule = ' <word> banana[^@boat] (de|a)'
  t.deepEqual(parseRule(rule), {
    value: [
      {kind: 'parameter', name: 'word', type: 'word', multiple: false},
      {kind: 'whitespace'},
      {kind: 'literal', string: 'banana'},
      {kind: 'optional', alternatives: [
        [{kind: 'literal', string: '^@boat'}]
      ]},
      {kind: 'whitespace'},
      {kind: 'alternatives', alternatives: [
        [{kind: 'literal', string: 'de'}],
        [{kind: 'literal', string: 'a'}]
      ]}
    ],
    lexErrors: [],
    parseErrors: []
  }, rule)

  rule = 'pagamentos: <pagamentos:money...> [em <date>]'
  t.deepEqual(parseRule(rule), {
    value: [
      {kind: 'literal', string: 'pagamentos:'},
      {kind: 'whitespace'},
      {kind: 'parameter', name: 'pagamentos', type: 'money', multiple: true},
      {kind: 'whitespace'},
      {kind: 'optional', alternatives: [
        [
          {kind: 'literal', string: 'em'},
          {kind: 'whitespace'},
          {kind: 'parameter', name: 'date', type: 'date', multiple: false}
        ]
      ]}
    ],
    lexErrors: [],
    parseErrors: []
  }, rule)

  t.end()
})

tape('parsing a line', t => {
  var parser = makeLineParser([
    {kind: 'parameter', name: 'xu', type: 'word'},
    {kind: 'whitespace'},
    {kind: 'literal', string: 'banana'},
    {kind: 'optional', alternatives: [
      [{kind: 'literal', string: '-boat'}]
    ]}
  ])

  var line = 'açaí banana-boat'
  t.deepEqual(parser.tryParse(line), {xu: 'açaí'}, line)
  line = 'açaí   banana'
  t.deepEqual(parser.tryParse(line), {xu: 'açaí'}, line)

  parser = makeLineParser([
    {kind: 'literal', string: 'pag'},
    {kind: 'optional', alternatives: [
      [{kind: 'literal', string: 'agamento'}],
      [{kind: 'literal', string: 'ou'}],
      [{kind: 'literal', string: 'o'}]
    ]},
    {kind: 'whitespace'},
    {kind: 'parameter', name: 'habitante', type: 'words'},
    {kind: 'whitespace'},
    {kind: 'parameter', name: 'valor', type: 'money'},
    {kind: 'whitespace'},
    {kind: 'literal', string: 'em'},
    {kind: 'whitespace'},
    {kind: 'parameter', type: 'date', name: 'date'}
  ])

  line = 'pag maria euzébia 525,30 em 13/12/2018'
  t.deepEqual(parser.tryParse(line), {habitante: 'maria euzébia', valor: 525.30, date: '2018-12-13'}, line)
  line = 'pagou joana francisca 725,30 em 18/01/2019'
  t.deepEqual(parser.tryParse(line), {habitante: 'joana francisca', valor: 725.30, date: '2019-01-18'}, line)

  parser = makeLineParser([
    {kind: 'alternatives', alternatives: [
      [
        {kind: 'literal', string: 'débito:'},
        {kind: 'whitespace'},
        {kind: 'parameter', name: 'débito', type: 'money', multiple: true}
      ],
      [
        {kind: 'literal', string: 'crédito:'},
        {kind: 'whitespace'},
        {kind: 'parameter', name: 'crédito', type: 'money', multiple: true}
      ]
    ]}
  ])

  line = 'débito: 18, 25,40'
  t.deepEqual(parser.tryParse(line), {'débito': [18, 25.40]}, line)
  line = 'crédito: 38.16'
  t.deepEqual(parser.tryParse(line), {'crédito': [38.16]}, line)

  parser = makeLineParser([
    {kind: 'parameter', name: 'nome', type: 'words'},
    {kind: 'whitespace'},
    {kind: 'literal', string: 'pagou'}
  ])

  line = 'fulano pagou'
  t.deepEqual(parser.tryParse(line), {nome: 'fulano'}, line)
  line = 'fulano de tal pagou'
  t.deepEqual(parser.tryParse(line), {nome: 'fulano de tal'}, line)

  t.end()
})

tape('both things', t => {
  t.deepEqual(
    makeLineParser(
      parseRule(
        'pac[iente] <pac:words> [da|do] dr[a][.] <dent:words> pag[ou|.][:] <money> [dia <date>]'
      ).value
    ).tryParse('paciente beltrano armando da dra. mariana gastón pagou: 600 dia 18/12/2001'), {
      dent: 'mariana gastón',
      pac: 'beltrano armando',
      money: 600,
      date: '2001-12-18'
    }
  )

  t.deepEqual(
    makeLineParser(
      parseRule(
        '<someone:words> [has] paid <money> [on <date>]'
      ).value
    ).tryParse('someone else has paid 12 on 23/11/2019'), {
      someone: 'someone else',
      money: 12,
      date: '2019-11-23'
    }
  )

  t.deepEqual(
    makeLineParser(
      parseRule(
        '<someone:words> [has] paid <money> [on <date>]'
      ).value
    ).tryParse('someone else paid 12 on 23/11/2019'), {
      someone: 'someone else',
      money: 12,
      date: '2019-11-23'
    }
  )

  t.deepEqual(
    makeLineParser(
      parseRule(
        'chegou <someone:words>'
      ).value
    ).tryParse('chegou fulano'), {
      someone: 'fulano'
    }
  )


  let today = new Date()
  today.setDate(15)
  t.deepEqual(
    makeLineParser(
      parseRule(
        '<nome:words> [do <quarto:numberword>] pagou <valor:money> [dia <date>]'
      ).value
    ).tryParse('Maria Angélica do C2 pagou 777,40 dia 15'), {
      nome: 'Maria Angélica',
      quarto: 'C2',
      valor: 777.40,
      date: today.toISOString().split('T')[0]
    }
  )

  t.end()
})
