const crypto = require("crypto");

// Generates a random hex string for server seeds and nonces
exports.generateRandomHex = (length = 32) => {
  return crypto.randomBytes(length / 2).toString("hex");
};

// Hashes a string using SHA256
exports.sha256 = (input) => {
  return crypto.createHash("sha256").update(input).digest("hex");
};

// Combine seeds exactly as spec'd: SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
exports.getCombinedSeed = (serverSeed, clientSeed, nonce) => {
  return exports.sha256(`${serverSeed}:${clientSeed}:${nonce}`); // [cite: 32]
};
