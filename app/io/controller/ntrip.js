'use strict';

const Controller = require('egg').Controller;

class NtripController extends Controller {
  /**
   * get the config of ntripcaster list
   */
  async list() {
    const { ctx } = this;
    await ctx.service.ntrip.notifyList();
  }

  /**
   * Add ntripcaster config
   */
  async add() {
    const { ctx, app } = this;
    const msg = ctx.args[0];
    const rules = {
      host: { type: 'string', min: 1 },
      port: { type: 'int', convertType: 'int' },
      username: { type: 'string' },
      password: { type: 'string' },
      mountpoint: { type: 'string' },
      enable: { type: 'boolean' },
    };

    const errors = app.validator.validate(rules, msg);
    if (errors) {
      return;
    }

    await ctx.service.ntrip.add(msg);
    await ctx.socket.emit('NTRIP', {
      action: 'add',
    });
  }

  /**
   * Edit the setting of serialport
   */
  async edit() {
    const { ctx, app } = this;
    const msg = ctx.args[0];
    const rules = {
      idx: { type: 'int', convertType: 'int' },
      host: { type: 'string', min: 1 },
      port: { type: 'int', convertType: 'int' },
      username: { type: 'string' },
      password: { type: 'string' },
      mountpoint: { type: 'string' },
      enable: { type: 'boolean' },
    };

    const errors = app.validator.validate(rules, msg);
    if (errors) {
      return;
    }

    await ctx.service.ntrip.edit(msg);
  }

  /**
   * Delete the setting of serialport
   */
  async delete() {
    const { ctx, app } = this;
    const msg = ctx.args[0];
    const rules = {
      idx: { type: 'int', convertType: 'int' },
    };

    const errors = app.validator.validate(rules, msg);
    if (errors) {
      return;
    }

    await ctx.service.ntrip.delete(msg);
  }
}

module.exports = NtripController;
