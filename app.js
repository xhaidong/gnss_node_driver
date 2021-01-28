'use strict';

const core = require('./app/io/core');

class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  async willReady() {
    console.log('willReady');
    await core.initSerialport(this.app);
  }

  async serverDidReady() {
    console.log('serverDidReady');
  }
}

module.exports = AppBootHook;
