const Product = require('../models/product.model');
const User = require('../models/user.model');
const { cosineSimilarity } = require('../utils/vector.utils');

/**
 * Get recommendations for a user based on their preferences
 * @param {string} userId - The user ID
 * @param {string} category - Product category ('clothing', 'footwear', 'accessories')
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} Array of recommended products
 */
const getRecommendations = async (userId, category, limit = 10) => {
  try {
    // Find user and their preferences
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get the user's gender preference
    const userGender = user.gender;
    
    // Get user preference vectors
    const primaryVector = user.preferences[category];
    
    // Check if we need to use cross-category influence
    let secondaryVectors = {};
    if (category === 'clothing') {
      secondaryVectors.footwear = user.preferences.footwear;
    } else if (category === 'footwear') {
      secondaryVectors.clothing = user.preferences.clothing;
    }
    
    // Get products the user has already interacted with
    const interactedProductIds = [
      ...user.history.favorites,
      ...user.history.liked,
      ...user.history.disliked,
      ...user.history.neutral,
    ];
    
    // Find gender-appropriate products that the user hasn't interacted with yet
    let genderQuery = { gender: userGender };
    if (userGender === 'unisex') {
      genderQuery = {}; // Show all products for unisex users
    } else {
      // Show gender-specific and unisex products
      genderQuery = { gender: { $in: [userGender, 'unisex'] } };
    }
    
    // Find products in the requested category that match gender criteria
    // and exclude already interacted products
    const products = await Product.find({
      category,
      ...genderQuery,
      _id: { $nin: interactedProductIds },
    }).limit(limit * 3); // Get more than needed to allow for scoring and sorting
    
    // If there are no recommendations or user has no preferences yet,
    // return random products from the category
    if (products.length === 0 || primaryVector.length === 0) {
      return await Product.find({
        category,
        ...genderQuery,
        _id: { $nin: interactedProductIds },
      })
        .sort({ createdAt: -1 }) // Newest products first as a fallback
        .limit(limit);
    }
    
    // Score products based on similarity to user preference vectors
    const scoredProducts = products.map(product => {
      // Calculate primary similarity (80% weight)
      let score = 0;
      
      if (primaryVector.length > 0 && product.embedding.length > 0) {
        score += cosineSimilarity(primaryVector, product.embedding) * 0.8;
      }
      
      // Calculate secondary similarities (20% weight)
      if (category === 'clothing' && secondaryVectors.footwear.length > 0) {
        score += cosineSimilarity(secondaryVectors.footwear, product.embedding) * 0.2;
      } else if (category === 'footwear' && secondaryVectors.clothing.length > 0) {
        score += cosineSimilarity(secondaryVectors.clothing, product.embedding) * 0.2;
      }
      
      return {
        product,
        score,
      };
    });
    
    // Sort products by score (highest first) and take the top 'limit' products
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
    
  } catch (error) {
    console.error('Error in recommendation service:', error);
    throw error;
  }
};

module.exports = {
  getRecommendations,
};