const express = require('express');
const app = express();

const logger = require('./lib/log');
const knex = require('./lib/db/config');
const routes = require('./loaders/routes');

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, Origin, X-Requested-With, Range');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  } else {
    return next();
  }
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

(async function() {
  await knex.init();
  await routes.init(app);

  app.listen(8080, function () {
    logger.success(`Listening to port 8080`)
  });
})();

/* Custom status codes
 * 477 - Form validation failed
 */
