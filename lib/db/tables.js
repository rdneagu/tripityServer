const logger = require('../log');

const tables = [ 'User', 'UserProfile', 'Venue', 'VenueReview', 'Trip', 'Ping', 'Photo' ];

async function dropSchema(sql) {
  let tableList = [];
  for (let table of tables) {
    tableList.push(table);
  }
  for (let table of tableList.reverse()) {
    logger.info(`Dropping table '${table}'`);
    await sql.schema.dropTableIfExists(table);
  }
}

async function createSchema(sql, tableName) {
  if (await sql.schema.hasTable(tableName)) return;

  logger.info(`Creating table '${tableName}'`);
  await sql.schema.createTable(tableName, (table) => {
    switch (tableName) {
      case 'User':
        table.charset('utf8');
        table.increments('id').primary();
        table.string('email', 64).notNullable();
        table.string('password', 128).notNullable();
        table.integer('permission').defaultTo(1).notNullable();
        table.timestamp('createdAt').defaultTo(sql.fn.now());
        table.timestamp('updatedAt').defaultTo(sql.fn.now());
        break;
        
      case 'UserProfile':
        table.charset('utf8');
        table.integer('id').unsigned().notNullable();
        table.foreign('id').references('id').inTable('User').onDelete("NO ACTION").onUpdate("NO ACTION");
        table.string('fullName', 128).notNullable();
        table.string('birthDay', 12);
        table.string('homeCountry', 64);
        table.string('homeCity', 64);
        table.string('postCode', 32);
        break;
  
      case 'Venue':
        table.charset('utf8');
        table.string('id').primary();
        table.string('name').notNullable();
        table.string('category').notNullable();
        break;
  
      case 'VenueReview':
        table.charset('utf8');
        table.string('id').primary();
        table.string('venue').notNullable();
        table.foreign('venue').references('id').inTable('Venue').onDelete("NO ACTION").onUpdate("NO ACTION");
        table.integer('user').unsigned().notNullable();
        table.foreign('user').references('id').inTable('User').onDelete("NO ACTION").onUpdate("NO ACTION");
        table.integer('stars').notNullable();
        table.text('comment');
        break;
  
      case 'Trip':
        table.charset('utf8');
        table.string('id').primary();
        table.integer('user').unsigned().notNullable();
        table.foreign('user').references('id').inTable('User').onDelete("NO ACTION").onUpdate("NO ACTION");
        table.boolean('finished').defaultTo(false);
        break;
  
      case 'Ping':
        table.charset('utf8');
        table.string('id').primary();
        table.string('trip').notNullable();
        table.foreign('trip').references('id').inTable('Trip').onDelete("NO ACTION").onUpdate("NO ACTION");
        table.float('latitude', 14, 8).notNullable();
        table.float('longitude', 14, 8).notNullable();
        table.string('country');
        table.integer('timestamp').notNullable();
        table.integer('distance');
        table.boolean('transport').defaultTo(false);
        table.string('venue').notNullable();
        table.foreign('venue').references('id').inTable('Venue').onDelete("NO ACTION").onUpdate("NO ACTION");
        break;
  
      case 'Photo':
        table.charset('utf8');
        table.string('id').primary();
        table.string('ping').notNullable();
        table.foreign('ping').references('id').inTable('Ping').onDelete("NO ACTION").onUpdate("NO ACTION");
        table.string('uri').notNullable();
        table.boolean('cover').defaultTo(false);
        break;
    }
  });
  logger.success(`Table '${tableName}' created`);
}

async function run(sql, options={}) {
  if (options.drop) {
    await dropSchema(sql);
    logger.success('Tables dropped').newline();
  }
  for (let table of tables) {
    await createSchema(sql, table);
  }
}

module.exports = { run };
