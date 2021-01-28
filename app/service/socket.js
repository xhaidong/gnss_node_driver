'use strict';

const Service = require('egg').Service;

class SocketService extends Service {
  async broadcast(event, data) {
    const { app } = this;
    const nsp = app.io.of('/io');
    for (const i in nsp.sockets) {
      nsp.sockets[i].emit(event, data);
    }
  }
}

module.exports = SocketService;
