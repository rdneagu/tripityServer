const bcrypt = require('bcrypt');
const { knex, knexTables } = require('../lib/db/config');
const { PERMISSION_LEVEL } = require('../lib/permissions.controller.js')
const validator = require('./validators/users.validator.js');
const jwt = require('./jwt');
const logger = require('./log');

function jwtfy(user) {
  const token = jwt.sign(user);
  return { token, ...user, password: undefined };
}

/**
 * Authenticates an user and returns the user with its associated JWT
 */
exports.authenticate = async (req, res) => {
  try {
    const { userId = 0, token, email, password } = req.body;

    // If we process the user through session check
    if (token) {
      try {
        const [ user ] = (await knex.raw(`SELECT * FROM ${knexTables.users} LEFT JOIN ${knexTables.userProfiles} ON ${knexTables.userProfiles}.userId = ${knexTables.users}.userId WHERE ${knexTables.users}.userId = :userId`, { userId }))[0];
        if (!user) {
          throw new Error('Invalid user id');
        }
        jwt.verify(token, user);
        return res.status(200).send(jwtfy(user));
      } catch (err) {
        if (/expired/.test(err.message))
          return res.status(401).send('Encrypted authentication token has expired');
        else if (/invalid/.test(err.message))
          return res.status(401).send('Encrypted authentication token is invalid');
        
        return res.status(401).send(err.message);
      }
    }
    
    // If we process through the login form
    if (email && password) {
      const [ user ] = (await knex.raw(`SELECT * FROM ${knexTables.users} LEFT JOIN ${knexTables.userProfiles} ON ${knexTables.userProfiles}.userId = ${knexTables.users}.userId WHERE ${knexTables.users}.email = :email`, { email }))[0];
      if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          return res.status(200).send(jwtfy(user));
        }
      }
    }

    return res.status(477).send({
      email: ['Invalid username or password'],
      password: ['Invalid username or password'],
    });
  } catch(err) {
    logger.error('users.authenticate failed with error -> ', err);
    return res.status(500).send(err.message);
  }
};

/**
 * Registers an user and returns the user with its associated JWT
 */
exports.register = async (req, res) => {
  try {
    const error = validator.validate(req.body, validator.register);
    // If validation has failed, return custom invalid form status
    if (error) {
      return res.status(477).send(error);
    }

    // Unpack the required from the body result
    const { email, password, fullName, birthDay } = req.body;

    // If the email already exists in the database, throw an explanatory error
    const [ emailExists ] = (await knex.raw(`SELECT * FROM ${knexTables.users} WHERE ${knexTables.users}.email = :email`, { email }))[0];
    if (emailExists) {
      return res.status(477).send({ email: [ 'This email has already been taken' ] })
    }

    // Crypt the password and create a new user into the database then return successful
    const cryptedPwd = await bcrypt.hash(password, 10);
    const permission = PERMISSION_LEVEL.USER | PERMISSION_LEVEL.ADMIN;

    const [ userId ] = await knex(knexTables.users).insert({ password: cryptedPwd, email, permission });
    await knex(knexTables.userProfiles).insert({ userId, fullName, birthDay });

    const user = { userId, password: cryptedPwd, email, permission, fullName, birthDay };
    return res.status(200).send(jwtfy(user));
  } catch(err) {
    logger.error('users.register failed with error -> ', err);
    return res.status(500).send(err.message);
  }
};

/**
 * Updates the user data
 */
exports.updateProfile = async (req, res) => {
  try {
    const { userId = 0 } = req.user;
    const toUpdate = {};

    let isRequestEmpty = true;
    for (let prop in req.body) {
      if (req.body.hasOwnProperty(prop) && prop !== 'userId') {
        toUpdate[prop] = req.body[prop];
        isRequestEmpty = false;
      }
    }

    if (isRequestEmpty) {
      return res.status(400).send('Nothing to update');
    }

    await knex(knexTables.userProfiles).update(toUpdate).where({ userId });
    return res.status(200).send(toUpdate);
  } catch(err) {
    logger.error('users.updateProfile failed with error -> ', err);
    return res.status(500).send(err.message);
  }
};

/**
 * Deletes a user
 */
exports.delete = async (req, res) => {
  try {
    const { userId = 0 } = req.user;

    await knex(knexTables.users).delete().where({ userId });
    return res.status(200).send();
  } catch(err) {
    logger.error('[users.delete] failed to execute');
    logger.error(`${err.name}: ${err.message}`);
    logger.error(err.stack);
    return res.status(500).send(err.message);
  }
};
