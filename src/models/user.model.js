const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password should be at least 6 characters'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      default: 'unisex',
    },
    profilePicUrl: {
      type: String,
      default: '',
    },
    history: {
      favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      disliked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      neutral: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    },
    // We'll initialize these preference vectors as empty arrays
    // They will be updated as the user interacts with products
    preferences: {
      clothing: {
        type: [Number],
        default: [],
      },
      footwear: {
        type: [Number],
        default: [],
      },
      accessories: {
        type: [Number],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash the password
userSchema.pre('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if entered password is correct
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;