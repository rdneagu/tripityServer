const trips = require('../lib/trips.controller');
const permissions = require('../lib/permissions.controller');

exports.init = function(app) {
  app.get('/trips', [
    permissions.authenticationRequired,
    trips.getTrips,
  ]);
  app.get('/trips/synchronize', [
    permissions.authenticationRequired,
    trips.sync,
  ]);
  app.patch('/trips/synchronize', [
    permissions.authenticationRequired,
    permissions.tripBelongingToUserRequired,
    trips.sync,
  ]);
};