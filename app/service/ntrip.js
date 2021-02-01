'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const ntripFile = 'ntrip_config.json';
const { refreshNtrip, getNtripStatus } = require('../io/core');


class NtripService extends Service {
  async getFile() {
    const { app } = this;
    const file = path.join(app.config.app.dataDir, ntripFile);
    let data = [];
    if (fs.existsSync(file)) {
      const fileData = await fsp.readFile(file);
      data = JSON.parse(fileData);
    }
    return data;
  }

  async saveFile(data) {
    refreshNtrip(data);
    const { app } = this;
    const file = path.join(app.config.app.dataDir, ntripFile);
    await fsp.writeFile(file, JSON.stringify(data, null, 2));
  }

  async getNtripList() {
    return await this.getFile();
  }

  async add(data) {
    const cfgList = await this.getFile();
    for (const i in cfgList) {
      const item = cfgList[i];
      if (item.host === data.host && item.port === data.port &&
        item.username === data.username && item.password === data.password &&
        item.mountpoint === data.mountpoint) {
        return;
      }
    }

    cfgList.push(data);
    await this.saveFile(cfgList);
  }

  async edit(data) {
    const cfgList = await this.getFile();
    if (!cfgList[data.idx]) {
      return;
    }
    cfgList[data.idx] = {
      host: data.host,
      port: data.port,
      username: data.username,
      password: data.password,
      mountpoint: data.mountpoint,
      enable: data.enable,
    };

    await this.saveFile(cfgList);
  }

  async delete(data) {
    const cfgList = await this.getFile();
    if (!cfgList[data.idx]) {
      return;
    }

    cfgList.splice(data.idx, 1);
    await this.saveFile(cfgList);
  }

  async notifyList() {
    const { ctx } = this;
    const data = await getNtripStatus();

    ctx.service.socket.broadcast('NTRIP', {
      action: 'list',
      data,
    });
  }
}

module.exports = NtripService;
