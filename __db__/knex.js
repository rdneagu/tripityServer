const knex = require('knex');
const knexConfig = require('../src/db/config');
const sql = knex(knexConfig);

const tables = [ 'User', 'UserProfile' ];

async function dropSchema() {
  let tableList = [];
  for (let table of tables) {
    tableList.push(table);
  }
  for (let table of tableList.reverse()) {
    console.log(`\u001b[36m    Dropping table '${table}'\u001b[0m`);
    await sql.schema.dropTableIfExists(table);
  }
}

async function createSchema(tableName) {
  if (await sql.schema.hasTable(tableName)) return;
  switch (tableName) {
    case 'User':
      return await sql.schema.createTable(tableName, (table) => {
        table.charset('utf8');
        table.increments('id').primary();
        table.string('email', 64).notNullable();
        table.string('password', 128).notNullable();
        table.timestamp('createdAt').defaultTo(sql.fn.now());
        table.timestamp('updatedAt').defaultTo(sql.fn.now());
      });
    case 'UserProfile':
      return await sql.schema.createTable(tableName, (table) => {
        table.charset('utf8');
        table.integer('id').unsigned().notNullable();
        table.foreign('id').references('id').inTable('User').onDelete("NO ACTION").onUpdate("NO ACTION");
        table.string('fullName', 128).notNullable();
        table.string('birthDay', 12);
        table.string('homeCountry', 64);
        table.string('homeCity', 64);
        table.string('postCode', 32);
      });
  }
}

(async function() {
  try {
    await dropSchema();
    console.log(`\u001b[32m✓   Tables dropped\u001b[0m\n`);
    for (let table of tables) {
      console.log(`\u001b[36m    Creating table '${table}'\u001b[0m`);
      await createSchema(table);
      console.log(`\u001b[32m✓   Table '${table}' created\u001b[0m`);
    }
    process.exit(0);
  }
  catch (err) {
    console.error(`\u001b[31;1mx   ${err}\u001b[0m`);
  }
})();
