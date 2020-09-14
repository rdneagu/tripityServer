const knex = require('knex');
const knexTables = require('./tables');
const knexConfig = {
  client: 'mysql',
  connection: {
    host: process.env.SQL_HOST || 'database-1.cxsa8qxfqxs5.eu-west-2.rds.amazonaws.com',
    user: process.env.SQL_USER || 'tripity',
    password: process.env.SQL_PASS || 'tripityPassword',
    database: process.env.SQL_DB || 'tripity',
  },
};
const sql = knex(knexConfig);

const logger = require('../log');

async function init() {
  try {
    logger.info('Initializing knex.js');
    await knexTables.run(sql, { drop: false });
    logger.success('knex.js initialization successful').newline();
  } catch(err) {
    logger.error('knex.js initialization failed');
    logger.error(err);
  }
}

module.exports = { sql, init };