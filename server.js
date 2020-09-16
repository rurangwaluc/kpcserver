const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const expressValidator = require('express-validator');
require('dotenv').config();
//  routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');
const getTokenRoutes = require('./routes/getToken');
const orderRoutes = require('./routes/order');

// app
const app = express();

// db
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB Connected'));

// middlewares

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    // origin: process.env.CLIENT_URL
  }))
  app.use(morgan('dev'))
}

// routes middleware
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api', getTokenRoutes);
app.use('/api', orderRoutes);

app.use('/api/uploads', express.static('uploads'));



const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});