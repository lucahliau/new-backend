const Trending = require('../models/trending.model');
const Product = require('../models/product.model');

/**
 * @desc    Get trending products for a specific date
 * @route   GET /api/trending/:date?
 * @access  Public
 */
const getTrendingProducts = async (req, res) => {
  try {
    // If date is provided, use it; otherwise, use current date
    let date = req.params.date 
      ? new Date(req.params.date) 
      : new Date();
    
    // Set time to midnight for consistent querying
    date.setHours(0, 0, 0, 0);
    
    // Find trending data for the specified date
    let trending = await Trending.findOne({ date })
      .populate({
        path: 'products.product',
        select: 'name description imageUrl category gender price',
      })
      .populate({
        path: 'products.comments.user',
        select: 'username profilePicUrl',
      });
    
    // If no trending data exists for the date
    if (!trending) {
      // For past dates, return empty array
      if (date < new Date().setHours(0, 0, 0, 0)) {
        return res.json([]);
      }
      
      // For current/future date, generate trending data
      trending = await generateTrendingForToday();
    }
    
    // Format the response
    const formattedTrending = trending.products.map(item => ({
      productId: item.product._id,
      product: item.product,
      likeCount: item.likeCount,
      comments: item.comments.map(comment => ({
        id: comment._id,
        user: {
          id: comment.user._id,
          username: comment.user.username,
          profilePic: comment.user.profilePicUrl,
        },
        text: comment.text,
        emojis: comment.emojis,
        createdAt: comment.createdAt,
      })),
    }));
    
    res.json(formattedTrending);
  } catch (error) {
    console.error('Error getting trending products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add a comment to a trending product
 * @route   POST /api/trending/comment
 * @access  Private
 */
const addComment = async (req, res) => {
  try {
    const { productId, text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's trending
    let trending = await Trending.findOne({ date: today });
    
    // If no trending exists for today, generate it
    if (!trending) {
      trending = await generateTrendingForToday();
    }
    
    // Find the product in the trending list
    const productIndex = trending.products.findIndex(
      p => p.product.toString() === productId
    );
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in trending' });
    }
    
    // Add the comment
    trending.products[productIndex].comments.push({
      user: req.user._id,
      text,
      emojis: [],
    });
    
    await trending.save();
    
    // Find the newly added comment
    const newComment = trending.products[productIndex].comments[
      trending.products[productIndex].comments.length - 1
    ];
    
    // Return the comment with user info
    await Trending.populate(newComment, {
      path: 'user',
      select: 'username profilePicUrl',
    });
    
    res.status(201).json({
      id: newComment._id,
      user: {
        id: newComment.user._id,
        username: newComment.user.username,
        profilePic: newComment.user.profilePicUrl,
      },
      text: newComment.text,
      emojis: newComment.emojis,
      createdAt: newComment.createdAt,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add an emoji to a comment
 * @route   POST /api/trending/emoji
 * @access  Private
 */
const addEmoji = async (req, res) => {
  try {
    const { productId, commentId, emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's trending
    let trending = await Trending.findOne({ date: today });
    
    // If no trending exists for today, generate it
    if (!trending) {
      trending = await generateTrendingForToday();
    }
    
    // Find the product in the trending list
    const productIndex = trending.products.findIndex(
      p => p.product.toString() === productId
    );
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in trending' });
    }
    
    // Find the comment
    const commentIndex = trending.products[productIndex].comments.findIndex(
      c => c._id.toString() === commentId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Add the emoji if it doesn't already exist
    if (!trending.products[productIndex].comments[commentIndex].emojis.includes(emoji)) {
      trending.products[productIndex].comments[commentIndex].emojis.push(emoji);
      await trending.save();
    }
    
    res.json({
      emojis: trending.products[productIndex].comments[commentIndex].emojis,
    });
  } catch (error) {
    console.error('Error adding emoji:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Generate trending data for today based on most liked products
 * @returns {Promise<Object>} The created trending document
 */
const generateTrendingForToday = async () => {
  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get yesterday's date
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Find the most liked products
  const mostLikedProducts = await Product.find()
    .sort({ 'interactionCounts.likes': -1 })
    .limit(20); // Get top 20 most liked products
  
  // Create trending data structure
  const trendingProducts = mostLikedProducts.map(product => ({
    product: product._id,
    likeCount: product.interactionCounts.likes,
    comments: [],
  }));
  
  // Create or update trending data
  const trending = await Trending.findOneAndUpdate(
    { date: today },
    { 
      date: today,
      products: trendingProducts,
    },
    { new: true, upsert: true }
  );
  
  return trending;
};

module.exports = {
  getTrendingProducts,
  addComment,
  addEmoji,
};