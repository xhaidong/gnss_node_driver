'use strict';

const doOnce = func => {
  let done = false;
  return function innerOnce(...args) {
    if (done) {
      return;
    }
    done = true;
    Reflect.apply(func, this, args);
  };
};

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

module.exports = {
  doOnce,
  sleep,
};
