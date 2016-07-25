const proTerms = require('fs')
  .readFileSync(`${__dirname}/proTerms.txt`, 'utf8')
  .split('\n');

module.exports = proTerms;
