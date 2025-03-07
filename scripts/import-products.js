const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const Product = require('../src/models/product.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * This script helps import products from your original MongoDB database
 * You can modify it to connect to your actual MongoDB instance and fetch products
 * 
 * For this example, we'll use a JSON file as a placeholder for your MongoDB data
 */

// Sample function to import products
const importProducts = async () => {
  try {
    // In a real scenario, you would fetch data from your MongoDB
    // Here we'll use a sample JSON file as a placeholder
    // You'll need to replace this with logic to connect to your MongoDB
    
    // Check if sample data file exists
    const sampleDataPath = path.resolve(__dirname, 'sample-products.json');
    
    if (!fs.existsSync(sampleDataPath)) {
      console.log('Sample data file not found. Creating one...');
      
      // Create sample data
      const sampleProducts = [];
      
      // Generate 50 sample products (20 clothing, 15 footwear, 15 accessories)
      const categories = ['clothing', 'clothing', 'clothing', 'clothing', 'footwear', 'footwear', 'footwear', 'accessories', 'accessories', 'accessories'];
      const genders = ['male', 'female', 'unisex'];
      
      for (let i = 1; i <= 50; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];
        
        // Generate random embedding vector (normally this would come from your neural net)
        const embedding = Array(50).fill().map(() => Math.random() * 2 - 1);
        
        sampleProducts.push({
          originalId: `original_${i}`,
          category,
          gender,
          embedding,
          name: `Sample ${category} ${i}`,
          description: `This is a sample ${category} product for ${gender}`,
          imageUrl: `https://example.com/images/${category}${i}.jpg`,
          price: Math.floor(Math.random() * 100) + 20,
        });
      }
      
      // Write sample data to file
      fs.writeFileSync(sampleDataPath, JSON.stringify(sampleProducts, null, 2));
      console.log('Sample data file created');
    }
    
    // Read sample data
    const rawData = fs.readFileSync(sampleDataPath);
    const products = JSON.parse(rawData);
    
    console.log(`Importing ${products.length} products...`);
    
    // Import products
    let importCount = 0;
    let updateCount = 0;
    
    for (const product of products) {
      // Check if product already exists
      const existingProduct = await Product.findOne({ originalId: product.originalId });
      
      if (existingProduct) {
        // Update existing product
        existingProduct.category = product.category;
        existingProduct.gender = product.gender;
        existingProduct.embedding = product.embedding;
        existingProduct.name = product.name;
        existingProduct.description = product.description;
        existingProduct.imageUrl = product.imageUrl;
        existingProduct.price = product.price;
        
        await existingProduct.save();
        updateCount++;
      } else {
        // Create new product
        await Product.create(product);
        importCount++;
      }
    }
    
    console.log(`Import complete: ${importCount} new products, ${updateCount} updated`);
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    // Close MongoDB connection
    mongoose.disconnect();
  }
};

// Run the import
importProducts();