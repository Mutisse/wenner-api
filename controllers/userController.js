const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const Order = require('./../models/orderModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.setUserId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.user) req.body.user = req.user.id;
  next();
};


exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'Esta rota não é para atualizações de senha. Por favor use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'address');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Esta rota não está definida! Por favor, use /signup'
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getUsersOrderStats = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    // Primeiro, agrupa os pedidos por usuário para calcular totais
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: { $ifNull: ['$finalPrice', 0] } }
      }
    },
    // Faz lookup dos usuários que têm pedidos
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    // Filtra apenas usuários com role 'client'
    {
      $match: {
        'user.role': 'client'
      }
    },
    {
      $project: {
        _id: 0,
        userId: '$user._id',
        name: '$user.name',
        email: '$user.email',
        phone: '$user.phone',
        address: '$user.address',
        createdAt: '$user.createdAt',
        totalOrders: 1,
        totalSpent: 1
      }
    }
  ]);

  // Busca todos os usuários COM ROLE 'client'
  const allUsers = await User.find({ role: 'client' }).select(
    '_id name email phone address createdAt'
  );

  // Combina os resultados: usuários com pedidos + usuários sem pedidos
  const usersWithStats = allUsers.map(user => {
    const userStats = stats.find(
      stat => stat.userId.toString() === user._id.toString()
    );

    if (userStats) {
      return userStats;
    } else {
      // Usuário sem pedidos
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
        totalOrders: 0,
        totalSpent: 0
      };
    }
  });

  // Ordena por total gasto (decrescente)
  usersWithStats.sort((a, b) => b.totalSpent - a.totalSpent);

  res.status(200).json({
    status: 'success',
    results: usersWithStats.length,
    data: {
      users: usersWithStats
    }
  });
});
