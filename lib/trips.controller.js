const { knex, knexComplexQuery, knexTables } = require('../lib/db/config');
const logger = require('./log');

const getTrips = async (userId, tripId) => {
  let trips = [];
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
  const order = [
    'startedAt ASC',
  ];

  const dbTrips = (await knex.raw(knexComplexQuery(select, table, joins, conditions, undefined, order), { userId, tripId }))[0];
  if (dbTrips.length) {
    const pings = await getPings(dbTrips.map(t => t.tripId));
    trips = dbTrips.map(trip => ({
      tripId: trip.tripId,
      owner: trip.owner,
      pings: pings.filter(ping => ping.trip === trip.tripId),
      startedAt: trip.startedAt,
      finishedAt: trip.finishedAt,
      synced: trip.synced,
      '_extra': {
        fullName: trip.fullName,
      },
    }));
  }
  return trips;
}

const getPings = async (tripIds) => {
  let pings = [];
  try {
    if (!tripIds.length) {
      throw new TypeError(`Trip id invalid! Expected a Number[] but got '${tripIds}'`)
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
    const conditions = [
      `${knexTables.pings}.trip IN (${tripIds.map(_ => '?').join(', ')})`,
    ];
    const order = [
      'timestamp ASC',
    ];

    const dbPings = (await knex.raw(knexComplexQuery(select, table, joins, conditions, undefined, order), [ ...tripIds ]))[0];
    const photos = await getPhotos(dbPings.map(p => p.pingId));

    pings = dbPings.map(ping => ({
      pingId: ping.pingId,
      trip: ping.trip,
      type: ping.type,
      latitude: ping.latitude,
      longitude: ping.longitude,
      altitude: ping.altitude,
      country: ping.country,
      city: ping.city,
      timestamp: ping.timestamp,
      distance: ping.distance,
      transport: !!ping.transport,
      venue: (ping.venueId) ? {
        venueId: ping.venueId,
        name: ping.name,
        category: ping.category,
        contact: ping.contact,
        location: ping.location,
      } : null,
      photos: photos.filter(photo => photo.ping === ping.pingId).map(photo => ({
        hash: photo.hash,
        uri: photo.uri,
        s3: photo.s3,
        thumbnail: !!photo.thumbnail,
      })),
      parsed: true,
    }));
  } catch(err) {
    logger.error('trips.getPings failed with error -> ', err.message);
  }
  return pings;
}

const getPhotos = async (pingIds) => {
  let photos = [];
  try {
    photos = (await knex.raw(`SELECT * FROM ${knexTables.photos} WHERE ${knexTables.photos}.ping IN (${pingIds.map(_ => '?').join(', ')})`, [ ...pingIds ]))[0];
  } catch(err) {
    logger.error('trips.getPhotos failed with error -> ', err.message);
  }
  return photos;
}

exports.sync = async (req, res) => {
  try {
    const { trip } = req.body;
    if (trip) {
      await new Promise((resolve, reject) => {
        knex.transaction(async (trx) => {
          try {
            const tripToInsert = {
              tripId: trip.tripId,
              owner: req.user.userId,
              startedAt: trip.startedAt,
              finishedAt: trip.finishedAt,
              synced: trip.synced,
            }
            await trx.raw(trx(knexTables.trips).insert(tripToInsert).toString().replace(/insert/i, 'replace'));

            const pingsToInsert = trip.pings.map(ping => ({
              pingId: ping.pingId,
              trip: trip.tripId,
              type: ping.type,
              latitude: ping.latitude,
              longitude: ping.longitude,
              altitude: ping.altitude,
              country: ping.country,
              city: ping.city,
              timestamp: ping.timestamp,
              distance: ping.distance,
              transport: ping.transport,
              venue: (ping.venue) ? ping.venue.venueId : null,
            }));
            await trx.raw(trx(knexTables.pings).insert(pingsToInsert).toString().replace(/insert/i, 'replace'));

            const photosToInsert = trip.pings.reduce((acc, ping) => {
              const photos = ping.photos.map((photo => ({
                hash: photo.hash,
                ping: ping.pingId,
                uri: photo.uri,
                s3: photo.s3,
                thumbnail: photo.thumbnail,
              })));
              acc.concat(photos);

              return acc;
            }, []);
            await trx.raw(trx(knexTables.photos).insert(photosToInsert).toString().replace(/insert/i, 'replace'));
            
            resolve();
          } catch(err) {
            logger.error('trips.sync transaction failed');
            reject(err);
          }
        });
      });
      return res.status(200).send();
    }

    const trips = await getTrips(req.user.userId);
    return res.status(200).send(trips);
  } catch(err) {
    logger.error('trips.sync failed with error -> ', err.message);
    res.status(500).send(err.message);
  }
}

exports.getTrips = async (req, res) => {
  try {
    const userId = req.query.user || req.user.userId;
    const { tripId=0 } = req.query.tripId;

    const trips = await getTrips(userId, tripId);
    return res.status(200).send(trips);
  } catch(err) {
    logger.error('trips.getTrips failed with error -> ', err.message);
    return res.status(500).send(err.message);
  }
}