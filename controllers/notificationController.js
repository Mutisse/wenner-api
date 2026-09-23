const Notification = require('../models/noticationModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');

exports.setNotificationUserIds = (req, res, next) => {
  // Define o ID do usuário automaticamente se não foi fornecido
  if (!req.body.user) req.body.user = req.user.id;
  
  // Define o ID do pedido se foi fornecido no body ou params
  if (!req.body.order) {
    if (req.body.orderId) req.body.order = req.body.orderId;
    else if (req.params.orderId) req.body.order = req.params.orderId;
  }
  
  next();
};

exports.getAllNotifications = factory.getAll(Notification);
exports.getNotification = factory.getOne(Notification);
exports.createNotification = factory.createOne(Notification);
exports.updateNotification = factory.updateOne(Notification);
exports.deleteNotification = factory.deleteOne(Notification);
