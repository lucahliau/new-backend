const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const interactionRoutes = require('./routes/interaction.routes');
const trendingRoutes = require('./routes/trending.routes');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Modify as needed for your app
}));

// Configure CORS for production
app.use(cors({
  // Replace with your frontend app's domain when ready
  // For now, allow all origins during development
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request body
app.use(express.json({ limit: '1mb' }));

// Only use Morgan logger in development mode
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// App Engine specific health check endpoint
app.get('/_ah/health', (req, res) => {
  res.status(200).send('OK');
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/trending', trendingRoutes);

// Basic route to test the server
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Clothing Recommendation API',
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Handle 404s
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong on the server' 
    : err.message || 'Internal Server Error';
  
  res.status(statusCode).json({ 
    message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 8080; // App Engine uses port 8080
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});