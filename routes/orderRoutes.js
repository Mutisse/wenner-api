const express = require('express');
const orderController = require('./../controllers/orderController');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const productController = require('./../controllers/productController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(orderController.getAllOrders)
  .post(
    // authController.restrictTo('client'),
    userController.setUserId,
    orderController.createOrder
  );

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(authController.restrictTo('admin'), orderController.updateOrder)
  .delete(authController.restrictTo('admin'), orderController.deleteOrder);

module.exports = router;
