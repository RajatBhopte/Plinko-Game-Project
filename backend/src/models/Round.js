const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  // Game State
  status: {
    type: String,
    enum: ["CREATED", "STARTED", "REVEALED"],
    default: "CREATED",
  }, // [cite: 77]
  createdAt: { type: Date, default: Date.now }, // [cite: 75]
  revealedAt: { type: Date }, // [cite: 98]

  // Fairness Protocol
  nonce: { type: String, required: true }, // [cite: 79]
  commitHex: { type: String, required: true }, // SHA256(serverSeed:nonce) [cite: 81]
  serverSeed: { type: String }, // Hidden until REVEALED [cite: 83]
  clientSeed: { type: String }, // [cite: 85]
  combinedSeed: { type: String }, // SHA256(serverSeed:clientSeed:nonce) [cite: 86]
  pegMapHash: { type: String }, // [cite: 87]

  // Game Data
  rows: { type: Number, default: 12 }, // [cite: 89, 91]
  dropColumn: { type: Number }, // 0..12 [cite: 92]
  binIndex: { type: Number }, // 0..12 [cite: 93]
  payoutMultiplier: { type: Number }, // [cite: 94]
  betCents: { type: Number }, // [cite: 95]
  pathJson: { type: Object }, // Decisions per row for replay
});

module.exports = mongoose.model("Round", roundSchema);
