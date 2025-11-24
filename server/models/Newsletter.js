import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  company: {
    type: String,
    // required: true,
    trim: true,
    maxLength: 150
  },
  website: {
    type: String,
    // required: true,
    trim: true,
    // validate: {
    //   validator: function(v) {
    //     return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
    //   },
    //   message: 'Please enter a valid website URL'
    // }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  subscriptionStatus: {
    type: String,
    enum: ['pending', 'active', 'do not contact'],
    default: 'pending'
  },
  source: {
    type: String,
    default: 'website'
  }
},{
  timestamps:true
}
);

// Add indexes for better query performance
newsletterSchema.index({ createdAt: -1 });
newsletterSchema.index({ subscriptionStatus: 1 });

export default mongoose.model('Newsletter', newsletterSchema);