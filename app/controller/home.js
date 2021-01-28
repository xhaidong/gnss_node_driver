'use strict';

const Controller = require('egg').Controller;
const fs = require('fs');
const path = require('path');

class HomeController extends Controller {
  async index() {
    const { ctx, app } = this;

    const adminDir = path.join(app.baseDir, 'app', 'public', 'admin');
    const adminFile = path.join(adminDir, 'index.html');

    if (fs.existsSync(adminFile)) {
      ctx.response.type = 'html';
      ctx.body = fs.readFileSync(adminFile);
    } else {
      ctx.body = 'Not Found';
    }
  }
}

module.exports = HomeController;
