const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, digite seu nome!']
  },
  email: {
    type: String,
    required: [true, 'Por favor, forneça seu email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Por favor, forneça um email válido']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  phone: {
    type: String,
    default: '',
    set: function(phone) {
      return phone || '(+258) XX XXXXXXX';
    }
  },
  role: {
    type: String,
    enum: ['client', 'admin', 'manager'],
    default: 'client'
  },
  password: {
    type: String,
    required: [true, 'Por favor, forneça uma senha'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Por favor, confirme sua senha'],
    validate: {
      // Isso funciona apenas em CREATE e SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'As senhas não são iguais!'
    }
  },
  address: {
    street: {
      type: String,
      default: 'Informe a rua e número'
    },
    city: {
      type: String,
      default: 'Informe a cidade'
    },
    state: {
      type: String,
      default: 'Informe o estado'
    },
    zipCode: {
      type: String,
      default: 'Informe o código de endereçamento postal'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  // Executa apenas se a senha foi modificada
  if (!this.isModified('password')) return next();

  // Criptografa a senha com custo 12
  this.password = await bcrypt.hash(this.password, 12);

  // Remove o campo passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this aponta para a query atual
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False significa que NÃO foi alterada
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
