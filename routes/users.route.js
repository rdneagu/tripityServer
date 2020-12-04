const users = require('../lib/users.controller');
const trips = require('../lib/trips.controller');
const permissions = require('../lib/permissions.controller');

exports.init = function(app) {
  app.post('/users/register', [
    users.register,
  ]);
  app.post('/users/authenticate', [
    users.authenticate,
  ]);
  app.get('/users/:userId/trip', [
    permissions.authenticationRequired,
    permissions.minimumPermissionLevelRequired(permissions.LEVEL.USER),
    permissions.sameUserRequired,
    trips.getTrips,
  ]);
  app.patch('/users/:userId/update', [
    permissions.authenticationRequired,
    permissions.minimumPermissionLevelRequired(permissions.LEVEL.USER),
    permissions.sameUserRequired,
    users.updateProfile,
  ]);
  app.delete('/users/:userId/delete', [
    permissions.authenticationRequired,
    permissions.sameUserRequired,
    users.delete,
  ]);
};