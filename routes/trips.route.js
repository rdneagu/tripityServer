const trips = require('../lib/trips.controller');
const permissions = require('../lib/permissions.controller');

exports.init = function(app) {
  app.get('/trips', [
    permissions.authenticationRequired,
    trips.getTrips,
  ]);
  app.get('/trips/:tripId/synchronize', [
    permissions.authenticationRequired,
    trips.synchronizeTrip,
  ]);
};