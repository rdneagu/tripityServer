const validate = require('validate.js');

exports.register = {
  email: {
    presence: {
      allowEmpty: false,
    },
    email: true,
  },
  password: {
    presence: {
      allowEmpty: false,
    },
    length: {
      minimum: 6,
      maximum: 18,
    },
  },
  confirmPassword: {
    presence: {
      allowEmpty: false,
    },
    equality: {
      attribute: 'password',
      message: '^The password does not match',
    },
  },
  fullName: {
    presence: {
      allowEmpty: false,
    },
    length: {
      minimum: 6,
    },
  },
  birthDay: {
    format: {
      pattern: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/,
      flags: '',
      message: '^Birth date must be in format DD/MM/YYYY with a lowest date of 01/01/1900',
    },
  },
};

exports.validate = (data, constraints) => {
  return validate(data, constraints);
};
