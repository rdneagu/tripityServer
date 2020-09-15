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

const logger = require('../log');

exports.knex = knex(knexConfig);
exports.knexComplexQuery = (select=[], table, joins=[], conditions=[], group=[], order=[], limit='') => {
  return `SELECT ${select.join(', ')} \
          FROM ${table} \
          ${(joins.length) ? `LEFT JOIN ${joins.join(' LEFT JOIN ')}` : ''} \
          ${(conditions.length) ? `WHERE ${conditions.join(' AND ')}` : ''} \
          ${(group.length) ? `GROUP BY ${group.join(', ')}` : ''} \
          ${(order.length) ? `ORDER BY ${order.join(', ')}` : ''} \
          ${limit} \
          `
}
exports.init = async () => {
  try {
    logger.info('Initializing knex.js');
    await knexTables.run(this.knex, { drop: false });
    logger.success('knex.js initialization successful').newline();
  } catch(err) {
    logger.error('knex.js initialization failed');
    logger.error(err);
  }
}
exports.knexTables = knexTables.tables;
