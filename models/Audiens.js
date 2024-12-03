const mongoose = require('mongoose');

const audienceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Audiens', audienceSchema);
