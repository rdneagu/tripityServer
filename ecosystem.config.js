module.exports = {
  apps : [{
    name: "tripity-server",
    script: "index.js",
    env: {
      NODE_ENV: "development",
      DEBUG: true,
    },
    env_production: {
      NODE_ENV: "production",
      DEBUG: false,
    }
  }]
}