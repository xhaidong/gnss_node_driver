'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const _ = require('lodash');
const fsp = fs.promises;
const path = require('path');
const serialport = require('serialport');
const spFile = 'sp_config.json';
const { refreshSerialport, getSpStatus } = require('../io/core');

class SpService extends Service {
  async getFile() {
    const { app } = this;
    const file = path.join(app.config.app.dataDir, spFile);
    let data = [];
    if (fs.existsSync(file)) {
      const fileData = await fsp.readFile(file);
      data = JSON.parse(fileData);
    }
    return data;
  }

  async saveFile(data) {
    refreshSerialport(data);
    const { app } = this;
    const file = path.join(app.config.app.dataDir, spFile);
    await fsp.writeFile(file, JSON.stringify(data, null, 2));
  }

  async getSpList() {
    return await this.getFile();
  }

  async getSpIds() {
    const spList = await serialport.list();
    const cfgList = await this.getFile();
    const data = [];
    for (const i in spList) {
      const name = spList[i].path;
      let isCfg = false;
      for (const j in cfgList) {
        if (name === cfgList[j].name) {
          isCfg = true;
          break;
        }
      }
      data.push({
        name,
        disabled: isCfg,
      });
    }
    return data;
  }

  async add(data) {
    const cfgList = await this.getFile();
    for (const i in cfgList) {
      if (cfgList[i].name === data.name) {
        return;
      }
    }

    cfgList.push(data);
    await this.saveFile(cfgList);
  }

  async edit(data) {
    const cfgList = await this.getFile();
    for (const i in cfgList) {
      if (cfgList[i].name === data.name) {
        cfgList[i] = data;
        break;
      }
    }

    await this.saveFile(cfgList);
  }

  async delete(data) {
    const cfgList = await this.getFile();
    let idx = -1;
    for (const i in cfgList) {
      if (cfgList[i].name === data.name) {
        idx = i;
        break;
      }
    }

    cfgList.splice(idx, 1);
    await this.saveFile(cfgList);
  }

  async notifyList() {
    const { ctx } = this;
    const spList = await this.getSpList();
    const spStatus = getSpStatus();
    for (const i in spList) {
      const name = spList[i].name;
      spList[i].connected = false;
      if (_.has(spStatus, spList[i].name)) {
        spList[i].connected = spStatus[name];
      }
    }

    ctx.service.socket.broadcast('SP', {
      action: 'list',
      data: spList,
    });
  }
}

module.exports = SpService;
