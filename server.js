const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

let DB = process.env.DATABASE_LOCAL;
if (process.env.DATABASE) {
  if (process.env.DATABASE.includes('<PASSWORD>')) {
    if (!process.env.DATABASE_PASSWORD) {
      console.error(
        'Missing DATABASE_PASSWORD environment variable for DATABASE connection.'
      );
      process.exit(1);
    }

    DB = process.env.DATABASE.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD
    );
  } else {
    DB = process.env.DATABASE;
  }
}

if (!DB) {
  console.error(
    'No MongoDB connection string was provided. Set DATABASE or DATABASE_LOCAL.'
  );
  process.exit(1);
}

const redactedDB = DB.replace(
  /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
  '$1***:***@'
);
console.log(`Connecting to MongoDB: ${redactedDB}`);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  console.log(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
