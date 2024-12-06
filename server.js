require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwtToken = require('jsonwebtoken');
const path = require('path');
const helmet = require('helmet'); // Security headers
const morgan = require('morgan'); // Logging
const mongoSanitize = require('express-mongo-sanitize'); // Sanitize inputs
const rateLimit = require('express-rate-limit'); // Rate limiting

// Import Models
const products = require('./models/products');
const userData = require('./models/users');

const app = express();
app.set('trust proxy', 1);
// const favicon = require('serve-favicon');

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// Middleware
app.use(express.json());
app.use(helmet());
app.use(mongoSanitize());
app.use(morgan('combined')); // Logs requests
app.use(cors({
  origin: ['http://localhost:3000', 'https://ecommerce-fe-0jr6.onrender.com'],
  credentials: true,
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  message: 'Too many requests, please try again later.',
});
app.use('/api', apiLimiter);

// Environment Variables
const PORT =  3020;
const MONGO_URI =  "mongodb+srv://admin:Admin%401234@cluster0.zbool.mongodb.net/eCommerce?retryWrites=true&w=majority&appName=Cluster0";
const MY_SECRET_TOKEN = 'eCommerce12062024';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.error('Database Connection Error:', err.message);
    process.exit(1); // Exit process on failure
  });
  const fetchProducts = async () => {
    try {
      const products = await Product.find({});
      console.log('Fetched Products:', products);
    } catch (err) {
      console.error('Error fetching products:', err.message);
    }
  };
mongoose.connection.once('open', () => {
  console.log('MongoDB Connection Open');
  fetchProducts();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

// JWT Authorization Middleware
const authorization = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).send('Unauthorized');
  }
  const token = authHeader.split(' ')[1];
  jwtToken.verify(token, MY_SECRET_TOKEN, (err) => {
    if (err) {
      return res.status(403).send('Forbidden');
    }
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Backend!');
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const checkUser = await userData.findOne({ username });
    if (checkUser) {
      return res.status(422).send('User Already Exists');
    }
    const newUser = new userData({ username, email, phone, password: hashedPassword });
    await newUser.save();
    res.status(201).send('Registered Successfully');
  } catch (error) {
    console.error('Error in /api/register:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const checkUser = await userData.findOne({ username });
    if (!checkUser) {
      return res.status(400).send('Invalid Username');
    }
    const isPasswordCorrect = await bcrypt.compare(password, checkUser.password);
    if (!isPasswordCorrect) {
      return res.status(400).send('Wrong Password');
    }
    const token = jwtToken.sign({ username }, MY_SECRET_TOKEN, { expiresIn: '1h' });
    res.send({ status: 'ok', token });
  } catch (error) {
    console.error('Error in /api/login:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const allProducts = await products.find({});
    res.send(allProducts);
  } catch (error) {
    console.error('Error in /api/products:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/products/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const singleProduct = await products.findOne({ id: id.toString() });
    if (!singleProduct) {
      return res.status(404).send('Product Not Found');
    }
    res.send(singleProduct);
  } catch (error) {
    console.error('Error in /api/products/:id:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Serve React Build Files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.status || 500).send(err.message || 'Internal Server Error');
});
