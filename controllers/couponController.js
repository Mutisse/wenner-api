const Coupon = require('../models/copumModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// ================================
//  Criar Cupom
// ================================
exports.createCoupon = catchAsync(async (req, res, next) => {
  // Verificar se existe data de expiração
  if (!req.body.expiresAt) {
    return next(new AppError('A data de expiração é obrigatória.', 400));
  }

  // Criar cupom
  const newCoupon = await Coupon.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      coupon: newCoupon
    }
  });
});

// ================================
//  Validar cupom antes de aplicar
// ================================
exports.validateCoupon = catchAsync(async (req, res, next) => {
  const { code, userId, totalPrice } = req.body;

  if (!code) return next(new AppError('O código do cupom é obrigatório.', 400));
  if (!totalPrice)
    return next(new AppError('O preço total é obrigatório.', 400));

  const coupon = await Coupon.findOne({ code, isActive: true });

  if (!coupon) {
    return next(new AppError('Cupom inválido ou inativo.', 404));
  }

  // Verificar expiração
  if (coupon.isExpired()) {
    return next(new AppError('Este cupom expirou.', 400));
  }

  // Verificar limite de uso
  if (coupon.hasReachedUsageLimit()) {
    return next(new AppError('Este cupom atingiu o limite de uso.', 400));
  }

  // Verificar se o cupom é atribuído a alguém
  if (coupon.assignedTo && coupon.assignedTo.toString() !== userId) {
    return next(
      new AppError('Este cupom não está atribuído a este usuário.', 403)
    );
  }

  // Verificar valor mínimo de compra
  if (totalPrice < coupon.minPurchaseAmount) {
    return next(
      new AppError(
        `Valor mínimo para usar este cupom é de ${coupon.minPurchaseAmount}.`,
        400
      )
    );
  }

  // =============================
  // Calcular desconto
  // =============================
  let discountValue = 0;

  if (coupon.type === 'percentage') {
    discountValue = (totalPrice * coupon.discount) / 100;

    // Aplicar limite de desconto máximo
    if (coupon.maxDiscountAmount && discountValue > coupon.maxDiscountAmount) {
      discountValue = coupon.maxDiscountAmount;
    }
  } else {
    discountValue = coupon.discount;
  }

  const finalPrice = totalPrice - discountValue;

  res.status(200).json({
    status: 'success',
    data: {
      coupon,
      discountValue,
      finalPrice
    }
  });
});

// ================================
//  Marcar cupom como usado
// ================================
exports.useCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code });

  if (!coupon) return next(new AppError('Cupom não encontrado.', 404));

  coupon.usageCount += 1;
  coupon.usedAt = Date.now();

  // Desativar cupom se atingiu limite
  if (coupon.usageCount >= coupon.usageLimit) {
    coupon.isActive = false;
  }

  await coupon.save();

  res.status(200).json({
    status: 'success',
    message: 'Cupom marcado como usado com sucesso.',
    data: { coupon }
  });
});

// ================================
//  Gerar CRUD com factory handler
// ================================
exports.getAllCoupons = factory.getAll(Coupon);
exports.getCoupon = factory.getOne(Coupon);
exports.updateCoupon = factory.updateOne(Coupon);
exports.deleteCoupon = factory.deleteOne(Coupon);
