const mongoose = require('mongoose');

// ratingSum / votes = average rating. Storing the sum lets us update atomically with $inc.
const coffeeSchema = new mongoose.Schema({
  seedId: Number,
  name: { type: String, required: true },
  origin: String,
  roast: String,
  votes: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
});

module.exports = mongoose.model('Coffee', coffeeSchema);
