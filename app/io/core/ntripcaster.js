'use strict';

const net = require('net');
const utils = require('./utils');
const userAgent = 'NTRIP Aceinna Node-Driver/1.0.0';
const path = require('path');
const fs = require('fs/promises');

class Ntripcaster {
  constructor(options) {
    this.app = options.app;
    this.host = options.host;
    this.port = options.port;
    this.username = options.username;
    this.password = options.password;
    this.mountpoint = options.mountpoint;
    this.enable = options.enable;
    this.mc = options.mc;
    this.idx = options.idx;

    this.conn = null;
    this.closed = false;
    this.isReady = false;
    this.binFile = '';
  }

  run() {
    this.generateFile();
    this.connect();
  }

  close() {
    this.closed = true;
    this.releaseConn();
  }

  releaseConn() {
    if (this.conn) {
      this.conn.removeAllListeners();
      this.conn.destroy();
      this.conn = null;
    }
  }

  generateFile() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const dateTime = `${year}${month}${day}${hours}${minutes}${seconds}`;
    this.binFile = `station-${this.idx}-${this.mountpoint}-${dateTime}.bin`;
    this.binFile = path.join(this.app.config.app.dataDir, this.binFile);
  }

  refresh(options) {
    if (options.enable !== this.enable) {
      this.enable = options.enable;
      this.app.logger.info('Reconnect ntripcaster [%s:%d:%s]', this.host, this.port, this.mountpoint);
      this.reconnect();
    }
  }

  async reconnect() {
    this.closed = true;
    this.releaseConn();
    await utils.sleep(3000);
    this.generateFile();
    this.closed = false;
    this.connect();
  }

  connect() {
    // closed
    if (this.closed) {
      return;
    }

    // disabled
    if (!this.enable) {
      return;
    }

    this.isReady = false;
    this.conn = net.createConnection({
      host: this.host,
      port: this.port,
    }, () => {
      this.app.logger.info('Ntripcaster [%s:%d:%s] connected', this.host, this.port, this.mountpoint);
      const authorization = Buffer.from(
        this.username + ':' + this.password,
        'utf8'
      ).toString('base64');
      const data = `GET /${this.mountpoint} HTTP/1.0\r\nUser-Agent: ${userAgent}\r\nAuthorization: Basic ${authorization}\r\n\r\n`;
      this.conn.write(data);
    });

    const doneOnce = utils.doOnce(async () => {
      this.isReady = false;
      await utils.sleep(1000);
      this.connect();
    });

    this.conn.on('data', data => {
      if (this.isReady) {
        this.writeToFile(data);
        this.mc.writeToPort(data);
        return;
      }

      if (data.toString().startsWith('ICY 200 OK')) {
        this.isReady = true;
      }
    });

    this.conn.on('close', () => {
      this.app.logger.warn('Ntripcaster [%s:%d:%s] closed', this.host, this.port, this.mountpoint);
      doneOnce();
    });

    this.conn.on('error', err => {
      this.app.logger.error('Ntripcaster [%s:%d:%s] error %s', this.host, this.port, this.mountpoint, err);
      doneOnce();
    });

  }

  isEqual(data) {
    if (this.host === data.host && this.port === data.port &&
      this.username === data.username && this.password === data.password &&
      this.mountpoint === data.mountpoint) {
      return true;
    }
    return false;
  }

  getCfg() {
    return {
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      mountpoint: this.mountpoint,
    };
  }

  writeToFile(data) {
    fs.writeFile(this.binFile, data, {
      flag: 'a+',
    });
  }

  write(data) {
    if (this.isReady) {
      this.conn.write(data);
    }
  }
}

module.exports = Ntripcaster;
