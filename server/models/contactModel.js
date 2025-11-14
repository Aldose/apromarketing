const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {type: String, required: true},
    email: {type: String, required: true},
    message:{type: String},
    read: {type: Boolean, default: false},
  },  
);

export const Contact = mongoose.model('Contact', contactSchema);