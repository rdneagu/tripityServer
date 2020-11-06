const venues = require('../lib/venues.controller');
const permissions = require('../lib/permissions.controller');

exports.init = function(app) {
  app.get('/venues', [
    permissions.authenticationRequired,
    venues.getVenue,
  ]);
  app.get('/venues/all', [
    permissions.authenticationRequired,
    venues.getAllVenues,
  ]);
  app.get('/venues/:venueId', [
    permissions.authenticationRequired,
    venues.getVenue,
  ]);
  app.get('/venues/:venueId/reviews', [
    permissions.authenticationRequired,
    venues.getVenueReviews,
  ]);
};