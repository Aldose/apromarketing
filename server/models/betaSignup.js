const mongoose = require('mongoose');

const betaSignupSchema = new mongoose.Schema(
  {
    name: {type: String, required: true},
    email: {type: String, required: true},
    company: {type: String},
    website: {type: String},
    lang: {type: String, default: 'en-US'},
  },  
);

export const BetaSignup = mongoose.model('BetaSignup', betaSignupSchema);