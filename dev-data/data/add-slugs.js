const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const slugify = require('slugify');

dotenv.config({ path: path.join(__dirname, '../../config.env') });

const Product = require('../../models/productModel');

let DB = process.env.DATABASE_LOCAL;
if (process.env.DATABASE) {
  DB = process.env.DATABASE.includes('<PASSWORD>')
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
    : process.env.DATABASE;
}

(async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    console.log('✅ DB conectado!');

    const products = await Product.find();
    console.log(`📦 ${products.length} produtos encontrados`);

    for (const p of products) {
      p.slug = slugify(p.name, { lower: true });
      await p.save();
      console.log(`✅ ${p.name} → ${p.slug}`);
    }

    console.log('🎉 Slugs adicionados!');
  } catch (err) {
    console.error('❌', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
})();