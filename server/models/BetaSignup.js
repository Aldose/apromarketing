const mongoose = require('mongoose');

const betaSignupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email'
      }
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'accepted', 'declined'],
      default: 'pending'
    }
  },
  {
    collection: 'beta-signups',
    timestamps: true
  }
);

// Create indexes for better query performance
betaSignupSchema.index({ email: 1 });
betaSignupSchema.index({ submittedAt: -1 });

export const BetaSignup = mongoose.model('BetaSignup', betaSignupSchema);