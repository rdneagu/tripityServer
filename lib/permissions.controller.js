const jwt = require('jsonwebtoken');

const knex = require('../lib/db/config').sql;
const logger = require('./log');

exports.authenticationRequired = async (req, res, next) => {
  if (req.headers['authorization']) {
    try {
      const authorization = req.headers['authorization'].split(' ');
      if (authorization[0] !== 'Bearer') {
        return res.status(401).send('Invalid authorization header');
      } else {
        try {
          const [ id, token ] = authorization[1].split(':');
          const [ user ] = (await knex.raw('SELECT * FROM `User` WHERE User.id = :id', { id }))[0];
          if (!user) {
            throw new Error('Invalid user id');
          }
          req.user = jwt.verify(token, `${process.env.SECRET}.${user.password}`).data;
          return next();
        } catch (err) {
          if (/expired/.test(err.message))
            return res.status(401).send('Encrypted authentication token has expired');
          else if (/invalid/.test(err.message))
            return res.status(401).send('Encrypted authentication token is invalid');
          
          throw err;
        }
      }
    } catch (err) {
      logger.error('permissions.authenticationRequired failed with error -> ', err);
      return res.status(500).send(err.message);
    }
  }
  return res.status(401).send('You are not authorized to perform this operation!');
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
  if ((req.params && req.params.user && req.user.id === Number.parseInt(req.params.user)) || userPermission & 32) {
    return next();
  } else {
    return res.status(403).send('You can only perform this operation on your own user!');
  }
};
