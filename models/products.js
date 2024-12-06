const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: Number, index: true }, // Added indexing for performance
  productName: String,
  image: String,
  description: String,
  price: Number,
  specs: Object,
});

module.exports = mongoose.model('Products', ProductSchema);
