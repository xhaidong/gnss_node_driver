'use strict';

const SerialPort = require('serialport');
const utils = require('./utils');
const path = require('path');
const fs = require('fs/promises');

const GGADELIMITER = Buffer.from('\r\n');

class SpController {
  constructor(options) {
    this.app = options.app;
    this.port = options.port || '';
    this.baudRate = options.baudRate || 0;
    this.gga = options.gga;
    this.rtcm = options.rtcm;
    this.cmd = options.cmd || '';
    this.mc = options.mc;

    this.conn = null;
    this.isReady = false;
    this.closed = false;
    this.binFile = '';
    this.buf = Buffer.alloc(0);
  }

  run() {
    this.generateFile();
    this.connect();
  }

  refresh(options) {
    let changed = false;
    if (options.baudRate !== this.baudRate) {
      this.baudRate = options.baudRate;
      changed = true;
    }

    if (options.gga !== this.gga) {
      this.gga = options.gga;
      changed = true;
    }

    if (options.rtcm !== this.rtcm) {
      this.rtcm = options.rtcm;
      changed = true;
    }

    if (changed) {
      this.app.logger.info(`Reconnect with new config [${this.port}]`);
      this.reconnect();
    }
  }

  close() {
    this.closed = true;
    this.releaseConn();
  }

  releaseConn() {
    if (this.conn) {
      this.conn.removeAllListeners();
      this.conn.close();
      this.conn = null;
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
    if (this.closed) {
      return;
    }

    this.isReady = false;
    this.app.logger.info(`Starting connect serialport [${this.port}]`);
    this.app.logger.info(`Config port:[${this.port}] baudRate:[${this.baudRate}]`);
    this.conn = new SerialPort(this.port, {
      baudRate: this.baudRate,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      flowControl: false,
    });

    const doneOnce = utils.doOnce(async () => {
      this.isReady = false;
      this.mc.updateSpStatus(this.port, this.isReady);

      await utils.sleep(1000);
      this.connect();
    });

    this.conn.on('open', async () => {
      this.app.logger.info(`Serialport [${this.port}] is connected`);
      let cmdArr = [];
      if (this.cmd.length > 0) {
        cmdArr = this.cmd.split('\n');
      }

      for (const k in cmdArr) {
        if (k > 0 && k % 10 === 0) {
          await utils.sleep(100);
        }
        const wCmd = cmdArr[k];
        this.conn.write(wCmd);
      }

      this.isReady = true;
      this.mc.updateSpStatus(this.port, this.isReady);
    });

    this.conn.on('data', data => {
      // .log(this.port, data);
      this.writeToFile(data);

      if (!this.gga) {
        return;
      }

      this.buf = Buffer.concat([ this.buf, data ]);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const dIdx = this.buf.indexOf(GGADELIMITER);
        if (dIdx < 0) {
          if (this.buf.length >= 10240) {
            this.buf = Buffer.alloc(0);
          }
          return;
        }
        const gga = this.buf.slice(0, dIdx + GGADELIMITER.length);
        const dollarIdx = gga.lastIndexOf('$G');
        const ggaIdx = gga.indexOf('GGA');
        if (dollarIdx >= 0 && ggaIdx > 0) {
          this.mc.writeToNtrip(gga.slice(dollarIdx));
        }

        this.buf = this.buf.slice(dIdx + GGADELIMITER.length);
      }
    });

    this.conn.on('close', () => {
      this.app.logger.warn(`Serialport [${this.port}] is close`);
      doneOnce();
    });

    this.conn.on('error', err => {
      this.app.logger.error(`Serialport [${this.port}] error: %s`, err);
      doneOnce();
    });
  }

  /**
   * Write to serialport
   * @param {String|Buffer} data write data
   */
  write(data) {
    if (this.isReady && this.rtcm) {
      this.conn.write(data);
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
    const basename = path.basename(this.port);
    this.binFile = `${basename}-${dateTime}.bin`;
    this.binFile = path.join(this.app.config.app.dataDir, this.binFile);
  }

  writeToFile(data) {
    fs.writeFile(this.binFile, data, {
      flag: 'a+',
    });
  }
}

module.exports = SpController;
