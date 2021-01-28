/* eslint valid-jsdoc: "off" */

'use strict';

const fs = require('fs');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1611630631234_1127';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.logger = {
    dir: `${appInfo.baseDir}/logs`,
    appLogName: 'driver.log',
    coreLogName: 'driver.log',
    agentLogName: 'driver.log',
    errorLogName: 'driver-error.log',
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  // cors config
  config.cors = {
    credentials: true,
    origin: ctx => ctx.get('origin'),
  };

  // io config
  config.io = {
    init: {},
    namespace: {
      '/io': {
        connectionMiddleware: [ 'connection' ],
        packetMiddleware: [ 'packet' ],
      },
    },
  };

  config.app = {
    dataDir: `${appInfo.baseDir}/data`,
  };

  if (!fs.existsSync(config.app.dataDir)) {
    fs.mkdirSync(config.app.dataDir, {
      recursive: true,
    });
  }

  return {
    ...config,
    ...userConfig,
  };
};
