const users = require('../lib/users.controller');
const permissions = require('../lib/permissions.controller');

exports.init = function(app) {
  app.post('/users/register', [
    users.register,
  ]);
  app.get('/users/authenticate', [
    users.authenticate,
  ]);
  app.patch('/users/:user/update', [
    permissions.authenticationRequired,
    permissions.minimumPermissionLevelRequired(1),
    permissions.sameUserRequired,
    users.updateProfile,
  ]);
  app.delete('/users/:userId', [
    // ValidationMiddleware.validJWTNeeded,
    // PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
    // UsersController.removeById
  ]);
};