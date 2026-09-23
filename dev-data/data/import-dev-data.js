const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const slugify = require('slugify');

dotenv.config({ path: path.join(__dirname, '../../config.env') });

const Product = require('../../models/productModel');
const Variant = require('../../models/variationModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

let DB = process.env.DATABASE_LOCAL;
if (process.env.DATABASE) {
  DB = process.env.DATABASE.includes('<PASSWORD>')
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
    : process.env.DATABASE;
}

const ObjectId = mongoose.Types.ObjectId;

// ============ MAPA SKU → NOME DO PRODUTO ============
const skuPrefixToProductName = {
  'MOLETOM-CONF': 'Moletom Confortável',
  'SAIA-MIDI': 'Saia Midi Plissada',
  'TENIS-CASUAL': 'Tênis Casual',
  'JOGGER': 'Calça Jogger Esportiva',
  'BLAZER': 'Blazer Estiloso',
  'VESTIDO-VERAO': 'Vestido Elegante de Verão',
  'JAQUETA-JEANS': 'Jaqueta Jeans Clássica',
  'CAMISETA-PREM': 'Camiseta Premium de Algodão'
};

// ============ READ ============
const productsRaw = JSON.parse(fs.readFileSync(`${__dirname}/products.json`, 'utf-8'));
const usersRaw = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const variantsRaw = JSON.parse(fs.readFileSync(`${__dirname}/variants.json`, 'utf-8'));
const reviewsRaw = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// ============ FUNÇÃO: extrai nome do arquivo da imagem ============
function extractImageName(image) {
  if (!image) return 'default.jpg';
  if (image.startsWith('http')) {
    const withoutQuery = image.split('?')[0];
    return withoutQuery.split('/').pop();
  }
  return image;
}

// ============ MAPEIA USERS / REVIEWS ============
const users = usersRaw.map(u => ({
  _id: u._id ? new ObjectId(u._id) : undefined,
  name: u.name,
  email: u.email,
  role: u.role,
  active: u.active !== undefined ? u.active : true,
  photo: u.photo,
  password: u.password
}));

const reviews = reviewsRaw.map(r => ({
  _id: r._id ? new ObjectId(r._id) : undefined,
  review: r.review,
  rating: r.rating,
  createdAt: r.createdAt,
  user: r.user ? new ObjectId(r.user) : undefined,
  product: r.product ? new ObjectId(r.product) : undefined
}));

// ============ FUNÇÃO: acha o produto pelo SKU ============
function findProductForSku(sku, insertedProducts) {
  const parts = sku.split('-');
  for (let len = 2; len >= 1; len--) {
    const prefix = parts.slice(0, len).join('-');
    const targetName = skuPrefixToProductName[prefix];
    if (targetName) {
      const found = insertedProducts.find(
        p => p.name.toLowerCase().includes(targetName.toLowerCase().split(' ')[0])
      );
      if (found) return found;
    }
  }
  return null;
}

// ============ IMPORT ============
const importData = async () => {
  // 1) USERS
  await User.collection.insertMany(users);
  console.log(`✅ ${users.length} usuários`);

  // 2) PRODUCTS
  const productsToInsert = productsRaw.map(p => ({
    name: p.name,
    slug: slugify(p.name, { lower: true }),
    description: p.description,
    price: p.price,
    imageCover: extractImageName(p.image || p.imageCover),
    category: p.category,
    gender: p.gender,
    ratingsAverage: p.rating || 4.5,
    ratingsQuantity: 0
  }));

  const insertedProducts = [];
  for (const p of productsToInsert) {
    const doc = await Product.create(p);
    insertedProducts.push(doc);
  }
  console.log(`✅ ${insertedProducts.length} produtos`);

  // 3) VARIANTS
  let matched = 0;
  let unmatched = 0;

  for (let i = 0; i < variantsRaw.length; i++) {
    const v = variantsRaw[i];
    const prod = findProductForSku(v.sku, insertedProducts);

    if (!prod) {
      console.log(`⚠️  SKU sem match: ${v.sku}`);
      unmatched++;
      continue;
    }

    try {
      await Variant.create({
        product: prod._id,
        sku: v.sku,
        color: v.color || '#000000',
        size: v.size || 'Único',
        price: v.price,
        stock: v.stock || 0,
        image: extractImageName(v.image)
      });
      matched++;
    } catch (e) {
      console.log(`❌ Erro no SKU ${v.sku}: ${e.message}`);
    }
  }
  console.log(`✅ ${matched} variantes vinculadas (${unmatched} sem match)`);

  // 4) REVIEWS
  await Review.collection.insertMany(reviews);
  console.log(`✅ ${reviews.length} reviews`);

  console.log('🎉 Tudo importado!');
};

// ============ DELETE ============
const deleteData = async () => {
  await Product.collection.deleteMany();
  await User.collection.deleteMany();
  await Review.collection.deleteMany();
  await Variant.collection.deleteMany();
  console.log('🗑️  Tudo deletado!');
};

// ============ EXECUÇÃO ============
(async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    console.log('✅ DB conectado!');

    if (process.argv[2] === '--import') await importData();
    else if (process.argv[2] === '--delete') await deleteData();
    else console.log('Use: --import ou --delete');
  } catch (err) {
    console.error('❌', err.message);
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
})();