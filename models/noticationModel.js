const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // 👤 Quem vai receber a notificação
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Pode ser cliente, funcionário ou admin
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  title: {
    type: String,
    required: [true, 'A notificação precisa de um título']
  },
  message: {
    type: String,
    required: [true, 'A notificação precisa de uma mensagem']
  },
  type: {
    type: String,
    enum: ['Pedido', 'Entregue', 'Cancelado', 'Sistema', 'Avaliação' , 'Aprovado', 'Rejeitado', 'Outro'],
    required: [true, 'A notificação precisa de um tipo']
  },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
