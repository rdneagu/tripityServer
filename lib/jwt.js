const jwt = require('jsonwebtoken');

/**
 * Generates a JWT secret based on user's hashed password
 * 
 * @param {String} password                 - Hashed password
 * @returns {String} JWT secret
 */
exports.generateJWTSecret = (password) => {
  return `${process.env.SECRET}.${password}`;
}

/**
 * JWT wrapper that creates a token for a specific user
 * 
 * @param {Object} user                     - User object
 */
exports.sign = (user) => {
  return jwt.sign({ data: { userId: user.userId, email: user.email, fullName: user.fullName, permission: user.permission } }, this.generateJWTSecret(user.password), { expiresIn: 30 * 86400 * 1000 });
}

/**
 * JWT wrapper that verifies a token against a specific user
 * 
 * @param {String} token                    - Token
 * @param {Object} user                     - User object
 */
exports.verify = (token, user) => {
  return jwt.verify(token, this.generateJWTSecret(user.password)).data;
}