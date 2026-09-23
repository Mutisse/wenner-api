const Favorite = require('./../models/favoriteModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');



exports.addToFavorites = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.user.id;


  if (!productId) {
    return next(new AppError('Por favor, forneça o ID do produto.', 400));
  }


  // Verificar se já existe nos favoritos
  let favorite = await Favorite.findOne({ user: userId });

  if (!favorite) {
    // Criar novo documento de favoritos se não existir
    favorite = await Favorite.create({
      user: userId,
      products: [productId]
    });
  } else {
    // Verificar se o produto já está nos favoritos
    if (favorite.products.includes(productId)) {
      return next(new AppError('Este produto já está nos favoritos.', 400));
    }
    
    // Adicionar produto aos favoritos
    favorite.products.push(productId);
    await favorite.save();
  }

  res.status(200).json({
    status: 'success',
    data: {
      favorite
    }
  });
});

exports.removeFromFavorites = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const favorite = await Favorite.findOne({ user: userId });

  if (!favorite) {
    return next(new AppError('Nenhum item encontrado nos favoritos.', 404));
  }

  // Remover produto dos favoritos
  favorite.products = favorite.products.filter(
    product => product.toString() !== productId
  );

  await favorite.save();

  res.status(200).json({
    status: 'success',
    data: {
      favorite
    }
  });
});

exports.getMyFavorites = catchAsync(async (req, res, next) => {
  const favorite = await Favorite.findOne({ user: req.user.id }).populate('products');

  if (!favorite) {
    return res.status(200).json({
      status: 'success',
      data: {
        favorite: { products: [] }
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      favorite
    }
  });
});

// CRUD operations usando a factory
exports.getAllFavorites = factory.getAll(Favorite);
exports.getFavorite = factory.getOne(Favorite);
exports.createFavorite = factory.createOne(Favorite);
exports.updateFavorite = factory.updateOne(Favorite);
exports.deleteFavorite = factory.deleteOne(Favorite);