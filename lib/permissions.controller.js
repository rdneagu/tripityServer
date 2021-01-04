const { knex, knexTables } = require('../lib/db/config');
const jwt = require('./jwt');
const logger = require('./log');

exports.PERMISSION_LEVEL = {
  GUEST: 0,
  USER: 1 << 0,
  USERPLUS: 1 << 1,
  ADMIN: 1 << 5,
}

exports.authenticationRequired = async (req, res, next) => {
  if (!req.headers['authorization']) {
    return res.status(401).send('Authorization token is missing, you must be logged in to perform this operation!');
  }

  try {
    const [ match, authorization, userId, token , ] = req.headers['authorization'].split(/^(Bearer) (\d+):([\w-.]+)$/);
    if (authorization !== 'Bearer') {
      throw new Error(`Invalid authorization, expected 'Bearer [token]' but found '${match}'`);
    }

    const [ user ] = (await knex.raw(`SELECT * FROM ${knexTables.users} WHERE ${knexTables.users}.userId = :userId`, { userId }))[0];
    if (!user) {
      throw new Error(`Invalid user, cannot find a user with id ${userId}`);
    }

    req.user = jwt.verify(token, user);
    return next();
  } catch (err) {
    if (/expired/.test(err.message))
      return res.status(401).send('Encrypted authentication token has expired');
    else if (/invalid/.test(err.message))
      return res.status(401).send('Encrypted authentication token is invalid');
    
    logger.debug('permissions.authenticationRequired failed with error -> ', err);
    return res.status(401).send(err.message);
  }
};

exports.minimumPermissionLevelRequired = (requiredPermission) => {
  return (req, res, next) => {
    const userPermission = Number.parseInt(req.user.permission);
    if (userPermission & requiredPermission) {
      return next();
    } else {
      return res.status(403).send('You do not have permission to access this feature!');
    }
  };
};

exports.sameUserRequired = (req, res, next) => {
  const userPermission = Number.parseInt(req.user.permission);
  if ((req.params && req.params.userId && req.user.userId === Number.parseInt(req.params.userId)) || (userPermission & exports.PERMISSION_LEVEL.ADMIN)) {
    return next();
  } else {
    return res.status(403).send('You can only perform this operation on your own user!');
  }
};

exports.tripBelongingToUserRequired = async (req, res, next) => {
  const tripId = req.params.tripId || req.query.tripId || (req.body.trip ? req.body.trip.tripId : undefined)
  const trips = (await knex.raw(`SELECT * FROM ${knexTables.trips} WHERE tripId = :tripId`, { tripId }))[0];
  if (trips.length && trips.owner !== req.user.userId) {
    return res.status(403).send('This trip is not yours!');
  } else {
    return next();
  }
}
