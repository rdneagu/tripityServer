const axios = require('axios');

const { knex, knexComplexQuery, knexTables } = require('../lib/db/config');
const logger = require('./log');

const venuesCache = {};

exports.getAllVenues = async (req, res) => {
  try {
    const { latitude, longitude, altitude=0 } = req.query;

    const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${latitude},${longitude}&alt=${altitude}&v=${process.env.FOURSQUARES_VERSION}&client_id=${process.env.FOURSQUARES_CLIENT}&client_secret=${process.env.FOURSQUARES_SECRET}`);
    const venueResponse = venueRequest.data.response.venues;

    if (!venueResponse.length) {
      return res.status(200).send(null);
    }
    return res.status(200).send(venueResponse);
  } catch(err) {
    logger.error('venues.getAllVenues failed with error -> ', err);
    return res.status(500).send(err.message);
  }
}

exports.getVenue = async (req, res) => {
  try {
    let venue = {
      id: req.params.venueId,
    }

    if (!venue.id) {
      const { latitude, longitude, altitude=0 } = req.query;

      const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/search?ll=${latitude},${longitude}&alt=${altitude}&v=${process.env.FOURSQUARES_VERSION}&client_id=${process.env.FOURSQUARES_CLIENT}&client_secret=${process.env.FOURSQUARES_SECRET}`);
      const [ venueResponse ] = venueRequest.data.response.venues;

      venue = venueResponse;
      if (!venue) {
        return res.status(200).send(null);
      }
    }

    const time = Date.now();

    // If the venue data is not cached or cache expired
    if (!venuesCache[venue.id] || venuesCache[venue.id].expiry < time) {
      const [ lookupVenue ] = (await knex.raw(`SELECT * FROM ${knexTables.venues} WHERE venueId = :venueId`, { venueId: venue.id }))[0];
      let venueToInsert;
      
      if (!lookupVenue) {
        // Get full venue data
        // const venueRequest = await axios.get(`https://api.foursquare.com/v2/venues/${venue.id}?v=${process.env.FOURSQUARES_VERSION}&client_id=${process.env.FOURSQUARES_CLIENT}&client_secret=${process.env.FOURSQUARES_SECRET}`);
        const venueResponse = null; // venueRequest.data.response.venue;

        const venueDetails = {}
        if (venueResponse) {
          venueDetails.contact = JSON.stringify(venueResponse.contact);
          venueDetails.location = JSON.stringify(venueResponse.location);
          venueDetails.url = venueResponse.url;
          venueDetails.description = JSON.stringify(venueResponse.description);
          venueDetails.hours = JSON.stringify(venueResponse.hours);
        }

        // Insert venue data into db
        venueToInsert = {
          venueId: venue.id,
          name: venue.name,
          category: venue.categories[0].name,
          ...venueDetails,
        }
        await knex.raw(knex(knexTables.venues).insert(venueToInsert).toString().replace('/insert/i', 'replace'));
      }

      venuesCache[venue.id] = {
        data: lookupVenue || venueToInsert,
        expiry: time + (86400 * 1000),
      }
    }
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