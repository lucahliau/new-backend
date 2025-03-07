const express = require('express');
const { 
  getTrendingProducts,
  addComment,
  addEmoji 
} = require('../controllers/trending.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Get trending products for today or specified date
router.get('/:date?', getTrendingProducts);

// Add a comment to a trending product
router.post('/comment', protect, addComment);

// Add an emoji to a comment
router.post('/emoji', protect, addEmoji);

module.exports = router;