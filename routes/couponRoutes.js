const express = require('express');
const couponController = require('../controllers/couponController');
const authController = require('../controllers/authController');

const router = express.Router();

// 1) Rotas públicas

// 1.a) Validar cupom antes da compra
router.post('/validate', couponController.validateCoupon);

// 1.b) Marcar cupom como usado
router.post('/use', couponController.useCoupon);

router.use(authController.protect);
router.use(authController.restrictTo('admin'));

// Criar cupom
router
  .route('/')
  .post(couponController.createCoupon)
  .get(couponController.getAllCoupons);

// Rotas por ID
router
  .route('/:id')
  .get(couponController.getCoupon)
  .patch(couponController.updateCoupon)
  .delete(couponController.deleteCoupon);

module.exports = router;
