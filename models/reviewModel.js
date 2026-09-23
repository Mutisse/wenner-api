const mongoose = require('mongoose');
const Product = require('./productModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A avaliação não pode estar vazia!']
    },
    rating: {
      type: Number,
      min: [1, 'A avaliação deve ser no mínimo 1'],
      max: [5, 'A avaliação deve ser no máximo 5'],
      required: [true, 'A avaliação deve ter uma classificação']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'A avaliação deve pertencer a um produto.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A avaliação deve pertencer a um usuário']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índice único para evitar múltiplas avaliações do mesmo usuário no mesmo produto
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Middleware para popular dados do usuário ao buscar avaliações
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// Método estático para calcular avaliações médias
reviewSchema.statics.calcAverageRatings = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId }
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// Atualizar estatísticas após salvar uma avaliação
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.product);
});

// Middleware para findByIdAndUpdate e findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.product);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
