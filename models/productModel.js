const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Um produto deve ter um nome'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'Um nome de produto deve ter menos ou igual a 40 caracteres'
      ],
      minlength: [
        5,
        'Um nome de produto deve ter mais ou igual a 10 caracteres'
      ]
    },
    description: {
      type: String,
      trim: true
    },
    slug: String,
    imageCover: {
      type: String,
      required: [true, 'Um produto deve ter uma imagem de capa']
    },
    category: {
      type: String,
      required: [true, 'Um produto deve ter uma categoria'],
      enum: {
        values: [
          'Camisetas',
          'Vestidos',
          'Casacos',
          'Calças',
          'Blazers',
          'Sapatos',
          'Carteiras',
          'Calçados',
          'Jaquetas',
          'Saias',
          'Moletons'
        ],
        message: 'Selecione uma categoria correspondente'
      }
    },
    gender: {
      type: String,
      required: [true, 'Um produto deve ter um gênero'],
      enum: {
        values: ['Masculino', 'Feminino', 'Unissex'],
        message: 'Gênero deve ser: Masculino, Feminino ou Unissex'
      }
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Um produto deve ter um preço']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          if (!this.price) {
            // Se não há preço definido, não podemos validar
            return true;
          }
          return val < this.price;
        },
        message:
          'O preço com desconto ({VALUE}) deve ser abaixo do preço regular'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A avaliação deve ser acima de 1.0'],
      max: [5, 'A avaliação deve ser abaixo de 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ slug: 1 });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
productSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

productSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

//  Virtual populate
productSchema.virtual('colors', {
  ref: 'ProductVariation',
  foreignField: 'product',
  localField: '_id'
});

productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

productSchema.virtual('variants', {
  ref: 'ProductVariation',
  foreignField: 'product',
  localField: '_id'
});

// CORREÇÃO: Padrão Singleton para evitar erro de overwrite
let Product;
try {
  Product = mongoose.model('Product');
} catch {
  Product = mongoose.model('Product', productSchema);
}
module.exports = Product;
