const { knex, knexComplexQuery, knexTables } = require('../lib/db/config');
const logger = require('./log');

const getPings = async (tripId) => {
  let pings = [];
  try {
    if (!tripId) {
      throw new TypeError(`Trip id invalid! Expected a Number but got '${tripId}'`)
    }

    const select = [
      `${knexTables.pings}.*`,
      `${knexTables.trips}.tripId`,
      `${knexTables.venues}.*`,
    ];
    const table = knexTables.pings;
    const joins = [
      `${knexTables.trips} ON ${knexTables.trips}.tripId = ${knexTables.pings}.trip`,
      `${knexTables.venues} ON ${knexTables.venues}.venueId = ${knexTables.pings}.venue`,
    ];
    const conditions = [ `${knexTables.pings}.trip = :tripId` ];

    const pings = (await knex.raw(knexComplexQuery(select, table, joins, conditions), { tripId }))[0];
    const photos = await getPhotos();
    for (let i = 0; i < pings; i++) {
      pings[i].photos = photos.filter(photo => photo.ping = pings[i].pingId);
    }
    logger.debug(pings);
  } catch(err) {
    logger.error('trips.getPings failed with error -> ', err);
  }
  return pings;
}

const getPhotos = async (pingIds) => {
  let photos = [];
  try {
    photos = (await knex.raw(`SELECT * FROM ${knexTables.photos} WHERE ${knexTables.photos}.ping IN (${pingIds.map(_ => '?').join(', ')})`, [ ...pingIds ]))[0];
  } catch(err) {
    logger.error('trips.getPhotos failed with error -> ', err);
  }
  return photos;
}

exports.synchronizeTrip = async (req, res) => {
  try {
    const { trip } = req.body;
    knex.transaction(async (trx) => {
      try {
        const tripToInsert = {
          ...trip,
          pings: undefined,
        }
        await trx.raw(trx(knexTables.trips).insert(tripToInsert).toString().replace(/insert/i, 'insert ignore'));

        const pingsToInsert = trip.pings.map(ping => ({
          ...ping,
          trip: trip.tripId,
          photos: undefined,
        }));
        await trx.raw(trx(knexTables.pings).insert(pingsToInsert).toString().replace(/insert/i, 'insert ignore'));

        const photosToInsert = trip.pings.reduce((acc, val) => {
          acc.concat(val.photos);
        }, []);
        await trx.raw(trx(knexTables.photos).insert(photosToInsert).toString().replace(/insert/i, 'insert ignore'));

      } catch(err) {
        logger.error('trips.synchronizeTrip transaction failed');
        throw err;
      }
    });
  } catch(err) {
    logger.error('trips.synchronizeTrip failed with error -> ', err);
    res.status(500).send(err.message);
  }
}

exports.getTrips = async (req, res) => {
  try {
    const userId = req.params.user || req.user.userId;
    const { tripId=0 } = req.body;

    const select = [
      `${knexTables.trips}.*`,
      `${knexTables.users}.userId`,
      `${knexTables.userProfiles}.userId`,
      `${knexTables.userProfiles}.fullName`,
    ];
    const table = knexTables.trips;
    const joins = [
      `${knexTables.users} ON ${knexTables.users}.userId = ${knexTables.trips}.owner`,
      `${knexTables.userProfiles} ON ${knexTables.userProfiles}.userId = ${knexTables.users}.userId`,
    ];
    const conditions = [];
    if (tripId) {
      conditions.push(`${knexTables.trips}.id = :tripId`)
    } else {
      conditions.push(`${knexTables.trips}.owner = :userId`);
    }

    const trips = (await knex.raw(knexComplexQuery(select, table, joins, conditions), { userId, tripId }))[0];
    for (let i = 0; i < trips.length; i++) {
      trips[i].pings = await getPings(trips[i].id);
    }
    logger.debug(trips);

    return res.status(200).send(trips);
  } catch(err) {
    logger.error('trips.getTrips failed with error -> ', err);
    return res.status(500).send(err.message);
  }
}