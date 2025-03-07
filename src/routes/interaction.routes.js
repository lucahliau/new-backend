const express = require('express');
const { 
  createInteraction,
  getInteractionHistory,
  recategorizeInteraction 
} = require('../controllers/interaction.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Record an interaction (swipe)
router.post('/', protect, createInteraction);

// Get interaction history by type
router.get('/history/:type', protect, getInteractionHistory);

// Update interaction category
router.put('/recategorize', protect, recategorizeInteraction);

module.exports = router;