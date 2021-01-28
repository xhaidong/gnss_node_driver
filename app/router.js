'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, io } = app;
  router.get('/admin/*', controller.home.index);

  // socket.io
  io.of('/io').route('SP_LIST', io.controller.sp.list);
  io.of('/io').route('SP_IDS', io.controller.sp.ids);
  io.of('/io').route('SP_ADD', io.controller.sp.add);
  io.of('/io').route('SP_EDIT', io.controller.sp.edit);
  io.of('/io').route('SP_DEL', io.controller.sp.delete);

  io.of('/io').route('NTRIP_LIST', io.controller.ntrip.list);
  io.of('/io').route('NTRIP_ADD', io.controller.ntrip.add);
  io.of('/io').route('NTRIP_EDIT', io.controller.ntrip.edit);
  io.of('/io').route('NTRIP_DEL', io.controller.ntrip.delete);
};
