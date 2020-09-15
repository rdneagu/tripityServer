const { knex, knexTables } = require('../lib/db/config');
const jwt = require('./jwt');
const logger = require('./log');

exports.LEVEL = {
  USER: 1,
  USERPLUS: 2,
  ADMIN: 32,
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
  if ((req.params && req.params.user && req.user.userId === Number.parseInt(req.params.userId)) || userPermission & 32) {
    return next();
  } else {
    return res.status(403).send('You can only perform this operation on your own user!');
  }
};
