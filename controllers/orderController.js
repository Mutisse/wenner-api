const Order = require('./../models/orderModel');
const Notification = require('./../models/noticationModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const Email = require('./../utils/email');

exports.createOrder = catchAsync(async (req, res, next) => {
  // 1) Validar se existem produtos
  if (!req.body.products || req.body.products.length === 0) {
    return next(new AppError('Um pedido deve ter pelo menos um produto.', 400));
  }

  // 2) Validar método de pagamento
  // if (!req.body.paymentMethod) {
  //   return next(new AppError('Escolha um método de pagamento.', 400));
  // }

  // 4) Verificar se totalPrice e finalPrice estão no body
  if (!req.body.totalPrice ) {
    return next(
      new AppError('Preço total e preço final são obrigatórios.', 400)
    );
  }

  // 5) Preparar dados do pedido
  const orderData = {
    user: req.body.user,
    products: req.body.products,
    totalPrice: req.body.totalPrice,
    discount: req.body.discount || 0,
    // paymentMethod: req.body.paymentMethod,
    notes: req.body.notes || ''
  };

  // 6) Criar o pedido
  const newOrder = await Order.create(orderData);

  // 7) Criar notificação automaticamente para o usuário
  await Notification.create({
    user: newOrder.user,
    order: newOrder._id,
    title: 'Novo Pedido Criado',
    message: `Seu pedido #${newOrder._id} foi criado com sucesso!`,
    type: 'Pedido',
    isRead: false,
    isDelivered: false
  });

  // 8) Popular referências para enviar email ao admin
  const populatedOrder = await Order.findById(newOrder._id);

  // 9) Enviar email de notificação ao admin
  try {
    await Email.sendNewOrderNotification(populatedOrder);
  } catch (emailError) {
    // Não falhar o pedido se o email falhar, apenas logar o erro
    console.error('Erro ao enviar email ao admin:', emailError);
  }

  res.status(201).json({
    status: 'success',
    data: {
      order: populatedOrder
    }
  });
});

exports.getAllOrders = factory.getAll(Order);
exports.getOrder = factory.getOne(Order);
exports.updateOrder = factory.updateOne(Order);
exports.deleteOrder = factory.deleteOne(Order);
