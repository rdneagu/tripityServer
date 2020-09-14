const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../lib/db/config').sql;
const validator = require('./validators/users.validator.js');

const logger = require('./log');

function createSecret(password) {
  return `${process.env.SECRET}.${password}`;
}

function jwtfy(user) {
  const token = jwt.sign({ data: { id: user.id, email: user.email, fullName: user.fullName, permission: user.permission } }, createSecret(user.password), { expiresIn: 30 * 86400 * 1000 });
  return { token, ...user, password: undefined };
}

/**
 * Authenticates an user and returns the user with its associated JWT
 */
exports.authenticate = async (req, res) => {
  try {
    const { id = 0, token, email, password } = req.query;

    // If we process the user through session check
    if (token) {
      try {
        const [ user ] = (await knex.raw('SELECT * FROM `User` LEFT JOIN `UserProfile` ON User.id = UserProfile.id WHERE User.id = :id', { id }))[0];
        if (!user) {
          throw new Error('Invalid user id');
        }
        jwt.verify(token, createSecret(user.password));
        res.status(200).send(jwtfy(user));
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
      const [ user ] = (await knex.raw('SELECT * FROM `User` LEFT JOIN `UserProfile` ON User.id = UserProfile.id WHERE User.email = :email', { email }))[0];
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
    const [ emailExists ] = (await knex.raw('SELECT * FROM `User` WHERE User.email = :email', { email }))[0];
    if (emailExists) {
      return res.status(477).send({ email: [ 'This email has already been taken' ] })
    }

    // Crypt the password and create a new user into the database then return successful
    const cryptedPwd = await bcrypt.hash(password, 10);

    const [ id ] = await knex('User').insert({ password: cryptedPwd, email });
    await knex('UserProfile').insert({ id, fullName, birthDay });

    const user = { id, email, fullName, birthDay, permission: 1 };
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
    const { id = 0 } = req.user;
    const toUpdate = {};

    let isRequestEmpty = true;
    for (let prop in req.body) {
      if (req.body.hasOwnProperty(prop) && prop !== 'id') {
        toUpdate[prop] = req.body[prop];
        isRequestEmpty = false;
      }
    }

    if (isRequestEmpty) {
      return res.status(400).send('Nothing to update');
    }

    await knex('UserProfile').update(toUpdate).where({ id });
    return res.status(200).send(toUpdate);
  } catch(err) {
    logger.error('users.updateProfile failed with error -> ', err);
    return res.status(500).send(err.message);
  }
};
