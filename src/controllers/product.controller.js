const Product = require('../models/product.model');
const { getRecommendations } = require('../services/recommendation.service');

/**
 * @desc    Get recommended products for a user
 * @route   GET /api/products/recommendations/:category
 * @access  Private
 */
const getRecommendedProducts = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;
    
    // Validate category
    if (!['clothing', 'footwear', 'accessories'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    // Get recommendations for the user
    const recommendations = await getRecommendations(
      req.user._id,
      category,
      Math.min(parseInt(limit), 50) // Cap at 50 items
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Import products from external MongoDB to our database
 * @route   POST /api/products/import
 * @access  Private/Admin (we'll implement admin middleware later)
 */
const importProducts = async (req, res) => {
  // This is a simplified version - in a real implementation,
  // you would need to connect to your external MongoDB and fetch products
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }
    
    const importedProducts = [];
    
    for (const product of products) {
      // Validate required fields
      if (!product.originalId || !product.category || !product.gender || 
          !product.embedding || !product.name || !product.imageUrl) {
        continue; // Skip invalid products
      }
      
      // Check if product already exists
      const existingProduct = await Product.findOne({ originalId: product.originalId });
      
      if (existingProduct) {
        // Update existing product
        existingProduct.category = product.category;
        existingProduct.gender = product.gender;
        existingProduct.embedding = product.embedding;
        existingProduct.name = product.name;
        existingProduct.description = product.description || '';
        existingProduct.imageUrl = product.imageUrl;
        existingProduct.price = product.price || 0;
        
        await existingProduct.save();
        importedProducts.push(existingProduct);
      } else {
        // Create new product
        const newProduct = await Product.create({
          originalId: product.originalId,
          category: product.category,
          gender: product.gender,
          embedding: product.embedding,
          name: product.name,
          description: product.description || '',
          imageUrl: product.imageUrl,
          price: product.price || 0,
        });
        
        importedProducts.push(newProduct);
      }
    }
    
    res.status(201).json({
      message: `Successfully imported ${importedProducts.length} products`,
      count: importedProducts.length,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRecommendedProducts,
  importProducts,
};