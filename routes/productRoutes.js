const express = require('express');
const productController = require('./../controllers/productController');
const authController = require('./../controllers/authController');
// const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews

// router.use('/:tourId/reviews', reviewRouter);

// router
//   .route('/top-5-cheap')
//   .get(productController.aliasTopTours, productController.getAllProducts);

// router.route('/product-stats').get(productController.getProductStats);

router.route('/product/:slug').get(productController.getSingleProduct);

router
  .route('/all')
  .get(authController.protect, productController.getAllProducts);

router
  .route('/')
  .get(productController.getAllProductsWithColors)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    productController.uploadProductImage,
    productController.resizeProductImage,
    productController.createProduct
  );

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    productController.uploadProductImage,
    productController.resizeProductImage,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    productController.deleteProduct
  );

module.exports = router;
