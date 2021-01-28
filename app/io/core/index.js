'use strict';

const MainController = require('./main');

let mc;

const initSerialport = async app => {
  if (!mc) {
    mc = new MainController(app);
  }
  await mc.start();
};

const refreshSerialport = ports => {
  if (mc) {
    mc.refreshSp(ports);
  }
};

const getSpStatus = () => {
  let rst = {};
  if (mc) {
    rst = mc.getSpStatus();
  }
  return rst;
};

const refreshNtrip = ntrips => {
  if (mc) {
    mc.refreshNtrip(ntrips);
  }
};

const getNtripStatus = () => {
  let rst = {};
  if (mc) {
    rst = mc.getNtripStatus();
  }
  return rst;
};

module.exports = {
  initSerialport,
  refreshSerialport,
  getSpStatus,
  refreshNtrip,
  getNtripStatus,
};
