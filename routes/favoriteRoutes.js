const express = require('express');
const favoriteController = require('./../controllers/favoriteController');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

router.use(authController.protect); // Todas as rotas protegidas

router
  .route('/my-favorites')
  .get(userController.setUserId, favoriteController.getMyFavorites)
  .post(userController.setUserId, favoriteController.addToFavorites);

router
  .route('/my-favorites/:productId')
  .delete(userController.setUserId, favoriteController.removeFromFavorites);

// Rotas administrativas (opcional)
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(favoriteController.getAllFavorites)
  .post(favoriteController.createFavorite);

router
  .route('/:id')
  .get(favoriteController.getFavorite)
  .patch(favoriteController.updateFavorite)
  .delete(favoriteController.deleteFavorite);

module.exports = router;