const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // This will store the original MongoDB ID from your product database
    originalId: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['clothing', 'footwear', 'accessories'],
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'unisex'],
    },
    // This will store the embedding vector from your neural net
    embedding: {
      type: [Number],
      required: true,
    },
    // Additional product information
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    // Tracking metrics for the product
    interactionCounts: {
      favorites: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      dislikes: {
        type: Number,
        default: 0,
      },
      neutral: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes to improve query performance
productSchema.index({ category: 1, gender: 1 });
productSchema.index({ 'interactionCounts.likes': -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;