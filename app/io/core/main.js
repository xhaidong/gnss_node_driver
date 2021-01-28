'use strict';

const _ = require('lodash');
const SerialPort = require('./serialport');
const Ntripcaster = require('./ntripcaster');

class MainController {
  constructor(app) {
    this.app = app;

    this.sps = {};
    this.ntrips = [];
  }

  async start() {
    await this.initSerialPort();
    await this.initNtrip();
  }

  async initSerialPort() {
    const ctx = await this.app.createAnonymousContext();
    const ports = await ctx.service.sp.getSpList();
    await this.refreshSp(ports);
  }

  async refreshSp(ports) {
    const newPorts = [];
    for (const i in ports) {
      const item = ports[i];
      const name = item.name;
      newPorts.push(name);
      if (!_.has(this.sps, name)) {
        const sp = new SerialPort({
          app: this.app,
          port: item.name,
          baudRate: item.baudRate,
          gga: item.gga,
          rtcm: item.rtcm,
          cmd: item.cmd,
          mc: this,
        });
        this.sps[name] = {
          connected: false,
          instance: sp,
        };
        sp.run();
      } else {
        const sp = this.sps[name].instance;
        sp.refresh({
          port: item.name,
          baudRate: item.baudRate,
          gga: item.gga,
          rtcm: item.rtcm,
          cmd: item.cmd,
        });
      }
    }

    for (const k in this.sps) {
      if (newPorts.indexOf(k) < 0) {
        const sp = this.sps[k].instance;
        sp.close();

        delete this.sps[k];
      }
    }

    const ctx = await this.app.createAnonymousContext();
    ctx.service.sp.notifyList();
  }

  async updateSpStatus(name, connected) {
    if (_.has(this.sps, name)) {
      this.sps[name].connected = connected;

      const ctx = await this.app.createAnonymousContext();
      ctx.service.sp.notifyList();
    }
  }

  getSpStatus() {
    const data = {};
    for (const k in this.sps) {
      data[k] = this.sps[k].connected;
    }
    return data;
  }

  writeToNtrip(data) {
    for (const i in this.ntrips) {
      this.ntrips[i].write(data);
    }
  }

  writeToPort(data) {
    for (const i in this.sps) {
      this.sps[i].instance.write(data);
    }
  }

  async initNtrip() {
    const ctx = await this.app.createAnonymousContext();
    const ntrips = await ctx.service.ntrip.getNtripList();
    await this.refreshNtrip(ntrips);
  }

  async refreshNtrip(ntrips) {
    const newNtrips = [];
    for (const i in ntrips) {
      const item = ntrips[i];
      let isFound = false;
      for (const j in this.ntrips) {
        const nItem = this.ntrips[j];
        if (nItem.isEqual(item)) {
          isFound = true;
          nItem.refresh(item);
          newNtrips.push(nItem);
        }
      }

      if (!isFound) {
        const instance = new Ntripcaster({
          host: item.host,
          port: item.port,
          username: item.username,
          password: item.password,
          mountpoint: item.mountpoint,
          enable: item.enable,
          idx: i,
          mc: this,
          app: this.app,
        });
        instance.run();
        newNtrips.push(instance);
      }
    }

    // release old ntrips
    for (const i in this.ntrips) {
      const cfg = this.ntrips[i].getCfg();
      let isFound = false;
      for (const j in newNtrips) {
        if (newNtrips[j].isEqual(cfg)) {
          isFound = true;
        }
      }
      if (!isFound) {
        this.ntrips[i].close();
      }
    }

    this.ntrips = newNtrips;

    const ctx = await this.app.createAnonymousContext();
    ctx.service.ntrip.notifyList();
  }

  getNtripStatus() {
    const data = [];
    for (const i in this.ntrips) {
      const item = Object.assign(this.ntrips[i].getCfg(), { enbale: false, connected: false });
      item.enable = this.ntrips[i].enable;
      item.connected = this.ntrips[i].isReady;
      data.push(item);
    }

    return data;
  }
}

module.exports = MainController;
