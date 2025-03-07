const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['favorite', 'like', 'dislike', 'neutral'],
    },
    // Additional metadata about the interaction
    category: {
      type: String,
      required: true,
      enum: ['clothing', 'footwear', 'accessories'],
    },
  },
  {
    timestamps: true,
  }
);

// Add a compound index to ensure a user can only have one interaction per product
interactionSchema.index({ user: 1, product: 1 }, { unique: true });

// Add an index for faster querying by user and type
interactionSchema.index({ user: 1, type: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;