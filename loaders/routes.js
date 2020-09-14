const fs = require('fs');
const path = require('path');

const logger = require('../lib/log');

const ROUTES_DIR = path.join(__dirname, '../routes');

function readdir(path, options) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, options, (err, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });
}

const routes = {
  async init(app) {
    try {
      const files = await readdir(ROUTES_DIR);
      files.forEach((fn) => {
        if (!/.route.js/.test(fn)) return;

        const [ name ] = fn.split('.');
        const route = require(path.join(ROUTES_DIR, fn));
        route.init(app);
        logger.success(`Route \`${name}\` has loaded successfully`);
      });
      logger.success('Routes config finished loading').newline();
    } catch (e) {
      logger.error(e);
      logger.error('Routes failed loading, see error above').newline();
    }
  },
};

module.exports = routes;