const express = require('express');
const variantController = require('./../controllers/variantController');
const productController = require('./../controllers/productController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(variantController.getAllVariants)
  .post(
    authController.restrictTo('admin'),
    productController.setProductId,
    variantController.uploadVariantImage,
    variantController.createVariantWithImage,
    variantController.createVariant
  );

router
  .route('/:id')
  .get(variantController.getVariant)
  .patch(authController.restrictTo('admin'), variantController.updateVariant)
  .delete(authController.restrictTo('admin'), variantController.deleteVariant);

module.exports = router;
