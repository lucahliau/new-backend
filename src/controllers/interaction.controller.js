const User = require('../models/user.model');
const Product = require('../models/product.model');
const Interaction = require('../models/interaction.model');
const { updatePreferenceVector } = require('../utils/vector.utils');

/**
 * @desc    Record a user interaction with a product
 * @route   POST /api/interactions
 * @access  Private
 */
const createInteraction = async (req, res) => {
  try {
    const { productId, type } = req.body;
    
    // Validate interaction type
    if (!['favorite', 'like', 'dislike', 'neutral'].includes(type)) {
      return res.status(400).json({ message: 'Invalid interaction type' });
    }
    
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already interacted with this product
    const existingInteraction = await Interaction.findOne({
      user: req.user._id,
      product: productId,
    });
    
    if (existingInteraction) {
      // If the interaction type is the same, no need to update
      if (existingInteraction.type === type) {
        return res.status(200).json({ message: 'Interaction already recorded' });
      }
      
      // Update existing interaction
      existingInteraction.type = type;
      await existingInteraction.save();
    } else {
      // Create new interaction
      await Interaction.create({
        user: req.user._id,
        product: productId,
        type,
        category: product.category,
      });
      
      // Update product interaction counts
      if (type === 'favorite') {
        product.interactionCounts.favorites += 1;
      } else if (type === 'like') {
        product.interactionCounts.likes += 1;
      } else if (type === 'dislike') {
        product.interactionCounts.dislikes += 1;
      } else {
        product.interactionCounts.neutral += 1;
      }
      
      await product.save();
    }
    
    // Find user
    const user = await User.findById(req.user._id);
    
    // Update user history
    // First, remove from all history arrays if it exists
    user.history.favorites = user.history.favorites.filter(
      id => id.toString() !== productId
    );
    user.history.liked = user.history.liked.filter(
      id => id.toString() !== productId
    );
    user.history.disliked = user.history.disliked.filter(
      id => id.toString() !== productId
    );
    user.history.neutral = user.history.neutral.filter(
      id => id.toString() !== productId
    );
    
    // Add to appropriate history array
    if (type === 'favorite') {
      user.history.favorites.push(productId);
    } else if (type === 'like') {
      user.history.liked.push(productId);
    } else if (type === 'dislike') {
      user.history.disliked.push(productId);
    } else {
      user.history.neutral.push(productId);
    }
    
    // Update user preference vectors
    // The category of the product determines which primary vector to update
    const category = product.category;
    user.preferences[category] = updatePreferenceVector(
      user.preferences[category],
      product.embedding,
      type
    );
    
    // Cross-influence: Update secondary vectors with reduced weight
    if (category === 'clothing') {
      user.preferences.footwear = updatePreferenceVector(
        user.preferences.footwear,
        product.embedding,
        type,
        0.02 // 20% of the normal learning rate (0.1)
      );
    } else if (category === 'footwear') {
      user.preferences.clothing = updatePreferenceVector(
        user.preferences.clothing,
        product.embedding,
        type,
        0.02 // 20% of the normal learning rate (0.1)
      );
    }
    
    // Save the updated user
    await user.save();
    
    res.status(201).json({ message: 'Interaction recorded successfully' });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get user's interaction history
 * @route   GET /api/interactions/history/:type
 * @access  Private
 */
const getInteractionHistory = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate interaction type
    if (!['favorites', 'liked', 'disliked', 'neutral', 'all'].includes(type)) {
      return res.status(400).json({ message: 'Invalid history type' });
    }
    
    // Get category filter if provided
    const { category } = req.query;
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let productIds = [];
    
    // Get product IDs based on requested type
    if (type === 'all') {
      productIds = [
        ...user.history.favorites,
        ...user.history.liked,
        ...user.history.disliked,
        ...user.history.neutral,
      ];
    } else {
      productIds = user.history[type];
    }
    
    // Find products
    let query = { _id: { $in: productIds } };
    
    // Add category filter if provided
    if (category && ['clothing', 'footwear', 'accessories'].includes(category)) {
      query.category = category;
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    // Return products with their interaction type
    const productsWithInteraction = products.map(product => {
      let interactionType = '';
      
      if (user.history.favorites.includes(product._id)) {
        interactionType = 'favorite';
      } else if (user.history.liked.includes(product._id)) {
        interactionType = 'like';
      } else if (user.history.disliked.includes(product._id)) {
        interactionType = 'dislike';
      } else if (user.history.neutral.includes(product._id)) {
        interactionType = 'neutral';
      }
      
      return {
        ...product.toObject(),
        interactionType,
      };
    });
    
    res.json(productsWithInteraction);
  } catch (error) {
    console.error('Error getting interaction history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update a product's interaction category
 * @route   PUT /api/interactions/recategorize
 * @access  Private
 */
const recategorizeInteraction = async (req, res) => {
  try {
    const { productId, newType } = req.body;
    
    // Validate interaction type
    if (!['favorite', 'like', 'dislike', 'neutral'].includes(newType)) {
      return res.status(400).json({ message: 'Invalid interaction type' });
    }
    
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Find the interaction
    const interaction = await Interaction.findOne({
      user: req.user._id,
      product: productId,
    });
    
    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found' });
    }
    
    // Get the old type
    const oldType = interaction.type;
    
    // If the types are the same, no need to update
    if (oldType === newType) {
      return res.status(200).json({ message: 'No change in interaction type' });
    }
    
    // Update interaction type
    interaction.type = newType;
    await interaction.save();
    
    // Find user
    const user = await User.findById(req.user._id);
    
    // Update user history
    // Remove from old category
    if (oldType === 'favorite') {
      user.history.favorites = user.history.favorites.filter(
        id => id.toString() !== productId
      );
    } else if (oldType === 'like') {
      user.history.liked = user.history.liked.filter(
        id => id.toString() !== productId
      );
    } else if (oldType === 'dislike') {
      user.history.disliked = user.history.disliked.filter(
        id => id.toString() !== productId
      );
    } else {
      user.history.neutral = user.history.neutral.filter(
        id => id.toString() !== productId
      );
    }
    
    // Add to new category
    if (newType === 'favorite') {
      user.history.favorites.push(productId);
    } else if (newType === 'like') {
      user.history.liked.push(productId);
    } else if (newType === 'dislike') {
      user.history.disliked.push(productId);
    } else {
      user.history.neutral.push(productId);
    }
    
    // Update user preference vectors
    // This is a simplified approach - in a production system, you might want
    // to recalculate the entire preference vector based on all interactions
    const category = product.category;
    
    // First, reverse the effect of the old interaction
    user.preferences[category] = updatePreferenceVector(
      user.preferences[category],
      product.embedding,
      oldType === 'like' ? 'dislike' : oldType === 'dislike' ? 'like' : 'neutral'
    );
    
    // Then apply the new interaction
    user.preferences[category] = updatePreferenceVector(
      user.preferences[category],
      product.embedding,
      newType
    );
    
    // Save the updated user
    await user.save();
    
    res.json({ message: 'Interaction recategorized successfully' });
  } catch (error) {
    console.error('Error recategorizing interaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createInteraction,
  getInteractionHistory,
  recategorizeInteraction,
};