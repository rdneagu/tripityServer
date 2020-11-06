const logger = require('../log');

exports.tables = {
  users: 'Users',
  userProfiles: 'UserProfiles',
  venues: 'Venues',
  venueReviews: 'VenueReviews',
  trips: 'Trips',
  pings: 'Pings',
  photos: 'Photos',
}

const dropSchema = async (sql) => {
  const tables = Object.values(this.tables);
  for (let table of tables.reverse()) {
    logger.info(`Dropping table '${table}'`);
    await sql.schema.dropTableIfExists(table);
  }
}

const createSchema = async (sql, tableName) => {
  if (await sql.schema.hasTable(tableName)) return;

  logger.info(`Creating table '${tableName}'`);
  await sql.schema.createTable(tableName, (table) => {
    switch (tableName) {
      case this.tables.users:
        table.charset('utf8');
        table.increments('userId').primary();
        table.string('email', 64).notNullable();
        table.string('password', 128).notNullable();
        table.integer('permission').defaultTo(1).notNullable();
        table.timestamp('createdAt').defaultTo(sql.fn.now());
        table.timestamp('updatedAt').defaultTo(sql.fn.now());
        break;
        
      case this.tables.userProfiles:
        table.charset('utf8');
        table.integer('userId').unsigned().notNullable();
        table.foreign('userId').references('userId').inTable(this.tables.users).onDelete("NO ACTION").onUpdate("NO ACTION");
        table.string('fullName', 128).notNullable();
        table.string('birthDay', 12);
        table.string('homeCountry', 64);
        table.string('homeCity', 64);
        table.string('postCode', 32);
        break;
  
      case this.tables.venues:
        table.charset('utf8');
        table.string('venueId').primary();
        table.string('name').notNullable();
        table.string('category').notNullable();
        table.text('contact');
        table.text('location');
        table.string('url', 255);
        table.string('description', 1024);
        table.text('hours');
        break;
  
      case this.tables.venueReviews:
        table.charset('utf8');
        table.string('reviewId').primary();
        table.integer('user').unsigned().notNullable();
        table.foreign('user').references('userId').inTable(this.tables.users).onDelete("NO ACTION").onUpdate("NO ACTION");
        table.string('venue').notNullable();
        table.foreign('venue').references('venueId').inTable(this.tables.venues).onDelete("NO ACTION").onUpdate("NO ACTION");
        table.integer('stars').notNullable();
        table.text('comment');
        break;
  
      case this.tables.trips:
        table.charset('utf8');
        table.string('tripId').primary();
        table.integer('owner').unsigned().notNullable();
        table.foreign('owner').references('userId').inTable(this.tables.users).onDelete("NO ACTION").onUpdate("NO ACTION");
        table.bigInteger('startedAt').unsigned().notNullable();
        table.bigInteger('finishedAt').unsigned();
        table.bigInteger('synced').unsigned();
        break;
  
      case this.tables.pings:
        table.charset('utf8');
        table.string('pingId').primary();
        table.string('trip').notNullable();
        table.foreign('trip').references('tripId').inTable(this.tables.trips).onDelete("NO ACTION").onUpdate("NO ACTION");
        table.float('latitude', 14, 8).notNullable();
        table.float('longitude', 14, 8).notNullable();
        table.string('country');
        table.string('city');
        table.bigInteger('timestamp').unsigned().notNullable();
        table.integer('distance');
        table.boolean('transport').defaultTo(false);
        table.string('venue');
        table.foreign('venue').references('venueId').inTable(this.tables.venues).onDelete("NO ACTION").onUpdate("NO ACTION");
        break;
  
      case this.tables.photos:
        table.charset('utf8');
        table.string('photoId').primary();
        table.string('ping').notNullable();
        table.foreign('ping').references('pingId').inTable(this.tables.pings).onDelete("NO ACTION").onUpdate("NO ACTION");
        table.string('uri').notNullable();
        table.string('s3');
        table.boolean('cover').defaultTo(false);
        break;
    }
  });
  logger.success(`Table '${tableName}' created`);
}

exports.run = async (sql, options={}) => {
  if (options.drop) {
    await dropSchema(sql);
    logger.success('Tables dropped').newline();
  }
  for (let table of Object.values(this.tables)) {
    await createSchema(sql, table);
  }
}
