const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const favoriteRouter = require('./routes/favoriteRoutes');
const variantRouter = require('./routes/variantRoutes');
const productRouter = require('./routes/productRoutes');
const orderRouter = require('./routes/orderRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const reportRouter = require('./routes/reportRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const couponRouter = require('./routes/couponRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ============ CORS — LIBERA GERAL ============
app.use(
  cors({
    origin: true,          // ← reflete a origem da requisição
    credentials: true
  })
);
app.options('*', cors({ origin: true, credentials: true }));

// ============ MIDDLEWARES ============
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ⚠️ mongoSanitize pode quebrar no Node 24 — comenta se der erro
// app.use(mongoSanitize());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ============ ROUTES ============
app.use('/api/v1/favorites', favoriteRouter);
app.use('/api/v1/variants', variantRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/coupons', couponRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;