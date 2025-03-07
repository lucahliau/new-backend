const mongoose = require('mongoose');

// Schema for comments on trending products
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    emojis: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Schema for trending products for a specific date
const trendingProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    likeCount: {
      type: Number,
      required: true,
      default: 0,
    },
    comments: [commentSchema],
  }
);

// Main trending schema that groups products by date
const trendingSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    products: [trendingProductSchema],
  },
  {
    timestamps: true,
  }
);

// Add an index for faster querying by date
trendingSchema.index({ date: -1 });

const Trending = mongoose.model('Trending', trendingSchema);

module.exports = Trending;