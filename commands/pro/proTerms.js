const proTerms = require('fs')
  .readFileSync(`${__dirname}/proTerms.txt`, 'utf8')
  .split('\n')
  .map(str => str.split('|'));

module.exports = proTerms;
