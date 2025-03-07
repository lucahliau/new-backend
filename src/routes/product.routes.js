const express = require('express');
const { 
  getRecommendedProducts,
  importProducts 
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');
const { admin } = require('../middleware/admin.middleware');

const router = express.Router();

// Product recommendation routes
router.get('/recommendations/:category', protect, getRecommendedProducts);

// Admin route for importing products
router.post('/import', protect, admin, importProducts);

module.exports = router;