module.exports = {
  apps : [{
    name: "tripity-server",
    script: "index.js",
    env: {
      NODE_ENV: "development",
      DEBUG: true,
      PORT: 8080,
      SECRET: 'qwe asd zxc vqwe',
      FOURSQUARES_CLIENT: 'UD2LJ1YQ1AC3I2UG45LWWTULNS5PKYJ45YSYYMFIQSHFPCPX',
      FOURSQUARES_SECRET: 'ND1NK05QUPSH4C1E3TBXHQEB51EFK40WG5N2LT12LNDJNRJJ',
      FOURSQUARES_VERSION: '20200608',
    },
    env_production: {
      NODE_ENV: "production",
      DEBUG: false,
    }
  }]
}