const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Um pedido deve pertencer a um usuário']
    },
    products: [
      {
        // Produto principal (necessário se não houver variação)
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product'
        },

        // Variação do produto (necessário se houver variantes)
        variation: {
          type: mongoose.Schema.ObjectId,
          ref: 'Variation'
        },

        quantity: {
          type: Number,
          required: [true, 'Um pedido deve ter uma quantidade'],
          min: [1, 'A quantidade deve ser pelo menos 1']
        },

        // preço do item no momento do pedido
        price: {
          type: Number,
          required: [true, 'Um produto no pedido deve ter um preço']
        }
      }
    ],

    totalPrice: {
      type: Number,
      required: [true, 'Um pedido deve ter um preço total']
    },

    discount: {
      type: Number,
      default: 0,
      validate: {
        validator: function(val) {
          return val >= 0 && val <= this.totalPrice;
        },
        message: 'O desconto deve estar entre 0 e o preço total'
      }
    },
    status: {
      type: String,
      enum: ['pendente', 'confirmado', 'enviado', 'entregue', 'cancelado'],
      default: 'pendente'
    },

    paymentMethod: {
      type: String,
      enum: ['cartao', 'boleto', 'pix', 'transferencia']
      // required: [true, 'Escolha um método de pagamento']
    },

    paid: { type: Boolean, default: false },
    paidAt: Date,
    deliveryDate: Date,
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Virtual para calcular o número total de itens no pedido
orderSchema.virtual('totalItems').get(function() {
  return this.products.reduce((total, item) => total + item.quantity, 0);
});

// Middleware para popular referências
orderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email phone'
  }).populate({
    path: 'products.product',
    select: 'name price imageCover category'
  });

  next();
});

// CORREÇÃO: Padrão Singleton para evitar erro de overwrite
let Order;
try {
  Order = mongoose.model('Order');
} catch {
  Order = mongoose.model('Order', orderSchema);
}

module.exports = mongoose.model('Order', orderSchema);
