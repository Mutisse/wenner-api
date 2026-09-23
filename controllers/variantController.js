const Variant = require('./../models/variationModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

exports.setVariationId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.variation)
    req.body.variation = req.body.variation || req.params.id;
  next();
};

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

exports.uploadVariantImage = upload.fields([{ name: 'image', maxCount: 1 }]);

exports.createVariantWithImage = catchAsync(async (req, res, next) => {
  if (req.files && req.files.image) {
    const uniqueId = req.user.id;
    const coverFilename = `product-${uniqueId}-${Date.now()}-cover.jpeg`;

    // Criar diretório se não existir
    const fs = require('fs');
    const dir = 'public/img/variants';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await sharp(req.files.image[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`${dir}/${coverFilename}`);

    req.body.image = coverFilename;
  }

  next();
});

exports.resizeVariantPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `variant-${req.body.product}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/variants/${req.file.filename}`);

  next();
});

exports.getAllVariants = factory.getAll(Variant);
exports.getVariant = factory.getOne(Variant);
exports.createVariant = factory.createOne(Variant);
exports.updateVariant = factory.updateOne(Variant);
exports.deleteVariant = factory.deleteOne(Variant);
