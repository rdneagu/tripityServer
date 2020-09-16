const axios = require('axios');

const { knex, knexComplexQuery, knexTables } = require('../lib/db/config');
const logger = require('./log');

const venuesCache = {};

exports.getVenue = async (req, res) => {
  try {
    logger.debug(req.query);
    const { latitude, longitude } = req.query;
    // Validate latitude and longitude

    let venue = {
      id: req.params.venueId,
    }

    if (!venue.id) {
      const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${latitude},${longitude}&v=${process.env.FOURSQUARES_VERSION}&client_id=${process.env.FOURSQUARES_CLIENT}&client_secret=${process.env.FOURSQUARES_SECRET}`);
      const [ venueResponse ] = venueRequest.data.response.venues;

      if (!venueResponse) {
        return res.status(404).send(`No venue could be found at location: ${latitude} lat, ${longitude} lon`);
      }
      venue = venueResponse;
    }

    const time = Date.now();

    // If the venue data is not cached or cache expired
    if (!venuesCache[venue.id] || venuesCache[venue.id].expiry < time) {
      const [ lookupVenue ] = (await knex.raw(`SELECT * FROM ${knexTables.venues} WHERE venueId = :venueId`, { venueId: venue.id }))[0];
      let venueToInsert;
      
      if (!lookupVenue) {
        // Get full venue data

        // Insert venue data into db
        venueToInsert = {
          venueId: venue.id,
          name: venue.name,
          category: venue.categories[0].name,          
        }
        await knex.raw(knex(knexTables.venues).insert(venueToInsert).toString().replace('/insert/i', 'replace'));
      }

      venuesCache[venue.id] = {
        data: lookupVenue || venueToInsert,
        expiry: time + (3600 * 1000),
      }
    }
    logger.debug(venuesCache[venue.id]);
    return res.status(200).send(venuesCache[venue.id].data);
  } catch(err) {
    logger.error('venues.getVenue failed with error -> ', err);
    return res.status(500).send(err.message);
  }
}

exports.getVenueReviews = async (req, res) => {
  try {
    const { venueId=0 } = req.params;
    const select = [
      `${knexTables.venueReviews}.*`,
      `${knexTables.userProfiles}.userId`,
      `${knexTables.userProfiles}.fullName`,
    ];
    const table = knexTables.venueReviews;
    const joins = [
      `${knexTables.userProfiles} ON ${knexTables.userProfiles}.userId = ${knexTables.venueReviews}.user`,
    ]
    const conditions = [
      `${knexTables.venueReviews}.venue = :venueId`,
    ]
    const venueReviews = (await knex.raw(knexComplexQuery(select, table, joins, conditions), { venueId }))[0];

    return res.status(200).send(venueReviews);
  } catch(err) {
    return res.status(500).send(err.message);
  }
}
