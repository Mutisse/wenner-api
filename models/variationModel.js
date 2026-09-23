const mongoose = require('mongoose');

const variationSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'A variação deve pertencer a um produto']
  },
  sku: {
    type: String,
    unique: true
  },
  color: String,
  size: String,
  stock: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: [true, 'A variação deve ter uma imagem']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// variationSchema.pre(/^find/, function(next) {
//   this.populate({
//     path: 'product',
//     select: 'slug name price imageCover'
//   });

//   next();
// });

const ProductVariation = mongoose.model('ProductVariation', variationSchema);
module.exports = ProductVariation;
