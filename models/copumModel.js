const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'O código do cupom é obrigatório'],
      unique: true,
      uppercase: true,
      trim: true
    },

    discount: {
      type: Number,
      required: [true, 'O valor do desconto é obrigatório'],
      min: [0, 'O desconto não pode ser negativo']
    },

    type: {
      type: String,
      required: [true, 'O tipo de desconto é obrigatório'],
      enum: ['percentage', 'fixed']
    },
    assignedTo: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      default: null
    },

    usedAt: {
      type: Date,
      default: null
    },

    // Campos adicionais para controle
    createdAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: {
      type: Date,
      required: [true, 'A data de expiração é obrigatória']
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

couponSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

couponSchema.methods.hasReachedUsageLimit = function() {
  return this.usageCount >= this.usageLimit;
};

// Verifica se o cupom é válido
couponSchema.methods.isValid = function(userId = null) {
  const now = new Date();

  // Verifica se está ativo e não expirado
  if (!this.isActive || this.expiresAt < now || this.usedAt) {
    return false;
  }

  // Verifica se é para usuário específico
  if (this.assignedTo && userId) {
    if (this.assignedTo.toString() !== userId.toString()) {
      return false;
    }
  }

  return true;
};

// Marca como usado
couponSchema.methods.markAsUsed = function(userId = null) {
  if (this.usedAt) {
    throw new Error('Cupom já foi utilizado');
  }

  this.usedAt = new Date();

  // Atribui ao usuário se fornecida e não tiver assignedTo
  if (userId && !this.assignedTo) {
    this.assignedTo = userId;
  }

  return this.save();
};

// Calcula desconto
couponSchema.methods.calculateDiscount = function(totalAmount) {
  if (this.type === 'percentage') {
    return totalAmount * (this.discount / 100);
  } else {
    return Math.min(this.discount, totalAmount);
  }
};

module.exports = mongoose.model('Coupon', couponSchema);
