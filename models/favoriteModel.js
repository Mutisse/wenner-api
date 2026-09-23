const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Favorito deve pertencer a um usuário.'],
    unique: true
  },
  products: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index para melhor performance
favoriteSchema.index({ user: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;