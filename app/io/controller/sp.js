'use strict';

const Controller = require('egg').Controller;

class SPController extends Controller {
  /**
   * get the config of serial port list
   */
  async list() {
    const { ctx } = this;
    await ctx.service.sp.notifyList();
  }

  /**
   * get serial port list
   */
  async ids() {
    const { ctx } = this;
    const data = await ctx.service.sp.getSpIds();
    await ctx.socket.emit('SP', {
      action: 'ids',
      data,
    });
  }

  /**
   * Add serialport config
   */
  async add() {
    const { ctx, app } = this;
    const msg = ctx.args[0];
    const rules = {
      name: { type: 'string', min: 1 },
      baudRate: { type: 'int', convertType: 'int' },
      gga: { type: 'boolean' },
      rtcm: { type: 'boolean' },
      cmd: { type: 'string', allowEmpty: true },
    };

    const errors = app.validator.validate(rules, msg);
    if (errors) {
      return;
    }

    await ctx.service.sp.add(msg);
    await ctx.socket.emit('SP', {
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
      name: { type: 'string', min: 1 },
      baudRate: { type: 'int', convertType: 'int' },
      gga: { type: 'boolean' },
      rtcm: { type: 'boolean' },
      cmd: { type: 'string', allowEmpty: true },
    };

    const errors = app.validator.validate(rules, msg);
    if (errors) {
      return;
    }

    await ctx.service.sp.edit(msg);
  }

  /**
   * Delete the setting of serialport
   */
  async delete() {
    const { ctx, app } = this;
    const msg = ctx.args[0];
    const rules = {
      name: { type: 'string', min: 1 },
    };

    const errors = app.validator.validate(rules, msg);
    if (errors) {
      return await ctx.socket.emit('SP', {
        action: 'error',
        code: 1001,
      });
    }

    await ctx.service.sp.delete(msg);
  }
}

module.exports = SPController;
