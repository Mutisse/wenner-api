const express = require('express');
const notificationController = require('./../controllers/notificationController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(notificationController.getAllNotifications)
  .post(
    notificationController.setNotificationUserIds,
    notificationController.createNotification
  );

router
  .route('/:id')
  .get(notificationController.getNotification)
  .patch(
    authController.restrictTo('client', 'admin'),
    notificationController.updateNotification
  )
  .delete(
    authController.restrictTo('client', 'admin'),
    notificationController.deleteNotification
  );

module.exports = router;
