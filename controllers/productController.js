const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Product = require('./../models/productModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.setProductId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.product) req.body.product = req.body.product || req.params.id;
  next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Não é uma imagem! Por favor carregue apenas imagens.', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadProductImage = upload.fields([
  { name: 'imageCover', maxCount: 1 }
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.debugAuth = catchAsync(async (req, res, next) => {
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
  next();
});

exports.resizeProductImage = catchAsync(async (req, res, next) => {
  // Verificar se há arquivos, mas não bloquear se não houver images
  if (!req.files || !req.files.imageCover) return next();

  const uniqueId = req.user ? req.user.id : Date.now();
  const coverFilename = `product-${uniqueId}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${coverFilename}`);

  req.body.imageCover = coverFilename;

  next();
});

exports.getSingleProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      select: 'review rating user createdAt'
    })
    .populate({
      path: 'variants',
      select: 'name price stock image color size'
    });

  if (!product) {
    return next(new AppError('Não existe acessorio com esse nome.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

exports.getAllProductsWithColors = catchAsync(async (req, res, next) => {
  const products = await Product.find().populate({
    path: 'colors',
    select: '-sku -price -image  -stock -__v'
  });

  if (!products) {
    return next(new AppError('Não existe acessorio com esse nome.', 404));
  }

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  // Encontrar o produto para obter o nome da imagem
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('Não existe produto com esse ID.', 404));
  }

  // Se o produto tinha imagem de capa, tentar apagar o ficheiro
  if (product.imageCover) {
    const imagePath = path.join(
      __dirname,
      '..',
      'public',
      'img',
      'products',
      product.imageCover
    );

    // Apagar a imagem de forma assíncrona, sem bloquear a resposta
    fs.unlink(imagePath, err => {
      if (err && err.code !== 'ENOENT') {
        console.error('Erro ao apagar imagem do produto:', err);
      }
    });
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getMyProducts = factory.getAll(Product);
exports.getAllProducts = factory.getAll(Product);
exports.getProduct = factory.getOne(Product);
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
