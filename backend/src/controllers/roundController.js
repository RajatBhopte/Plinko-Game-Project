const Round = require("../models/Round");
const cryptoUtils = require("../utils/crypto");
const gameEngine = require("../services/gameEngine");

// Symmetric Paytable for 13 bins (0 to 12)
// Edges have high multipliers, center has low.
const PAYTABLE = [10, 5, 2.5, 1.2, 0.5, 0.2, 0.2, 0.2, 0.5, 1.2, 2.5, 5, 10];

exports.commitRound = async (req, res) => {
  try {
    // 1. Server generates random serverSeed and nonce
    const serverSeed = cryptoUtils.generateRandomHex(32);
    const nonce = cryptoUtils.generateRandomHex(8); // Can be a simple counter or random string

    // 2. Server publishes only the commit: SHA256(serverSeed + ":" + nonce)
    const commitHex = cryptoUtils.sha256(`${serverSeed}:${nonce}`);

    // 3. Store in DB
    const round = await Round.create({
      serverSeed,
      nonce,
      commitHex,
      status: "CREATED",
    });

    // 4. Return roundId, commitHex, and nonce (DO NOT return serverSeed)
    res.status(201).json({
      roundId: round._id,
      commitHex,
      nonce,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.startRound = async (req, res) => {
  try {
    const { clientSeed, betCents, dropColumn } = req.body;
    const roundId = req.params.id;

    const round = await Round.findById(roundId);
    if (!round || round.status !== "CREATED") {
      return res
        .status(400)
        .json({ error: "Invalid round ID or round already started" });
    }

    // 1. Combine seeds: SHA256(serverSeed:clientSeed:nonce)
    const combinedSeed = cryptoUtils.getCombinedSeed(
      round.serverSeed,
      clientSeed,
      round.nonce,
    );

    // 2. Run deterministic game engine
    const { pegMapHash, binIndex, path } = gameEngine.runPlinkoRound(
      combinedSeed,
      dropColumn,
    );

    // 3. Calculate payout
    const payoutMultiplier = PAYTABLE[binIndex];

    // 4. Update DB
    round.clientSeed = clientSeed;
    round.combinedSeed = combinedSeed;
    round.pegMapHash = pegMapHash;
    round.dropColumn = dropColumn;
    round.binIndex = binIndex;
    round.payoutMultiplier = payoutMultiplier;
    round.betCents = betCents;
    round.pathJson = path;
    round.status = "STARTED";
    await round.save();

    // 5. Return game data (still keeping serverSeed hidden)
    res.json({
      roundId: round._id,
      pegMapHash,
      rows: round.rows,
      binIndex,
      payoutMultiplier,
      path,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.revealRound = async (req, res) => {
  try {
    const round = await Round.findById(req.params.id);
    if (!round || round.status !== "STARTED") {
      return res
        .status(400)
        .json({ error: "Round not in correct state for reveal" });
    }

    // Move to REVEALED, persist timestamp
    round.status = "REVEALED";
    round.revealedAt = new Date();
    await round.save();

    // Return the serverSeed so the client can verify
    res.json({ serverSeed: round.serverSeed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRound = async (req, res) => {
  try {
    const round = await Round.findById(req.params.id);
    if (!round) return res.status(404).json({ error: "Round not found" });
    res.json(round);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyRound = async (req, res) => {
  try {
    const { serverSeed, clientSeed, nonce, dropColumn } = req.query;

    // Parse dropColumn to Int
    const dropColInt = parseInt(dropColumn, 10);

    // 1. Recompute Commit Hex
    const commitHex = cryptoUtils.sha256(`${serverSeed}:${nonce}`);

    // 2. Recompute Combined Seed
    const combinedSeed = cryptoUtils.getCombinedSeed(
      serverSeed,
      clientSeed,
      nonce,
    );

    // 3. Rerun Deterministic Engine
    const { pegMapHash, binIndex, path } = gameEngine.runPlinkoRound(
      combinedSeed,
      dropColInt,
    );

    // 4. Return results for frontend verification
    res.json({
      commitHex,
      combinedSeed,
      pegMapHash,
      binIndex,
      path, // Useful for the frontend to replay the exact path
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// NEW: Verify a specific round by ID (REAL verification)
exports.verifyRoundById = async (req, res) => {
  try {
    const roundId = req.params.id;
    
    // 1. Fetch the round from DB
    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }
    
    if (round.status !== "REVEALED") {
      return res.status(400).json({ 
        error: "Round not revealed yet. Cannot verify without server seed." 
      });
    }
    
    // 2. Recompute commit hex
    const recomputedCommitHex = cryptoUtils.sha256(`${round.serverSeed}:${round.nonce}`);
    
    // 3. Recompute combined seed
    const recomputedCombinedSeed = cryptoUtils.getCombinedSeed(
      round.serverSeed,
      round.clientSeed,
      round.nonce
    );
    
    // 4. Rerun the game engine
    const { pegMapHash: recomputedPegMapHash, binIndex: recomputedBinIndex, path: recomputedPath } = 
      gameEngine.runPlinkoRound(recomputedCombinedSeed, round.dropColumn);
    
    // 5. Compare stored vs recomputed
    const isValid = (
      recomputedCommitHex === round.commitHex &&
      recomputedCombinedSeed === round.combinedSeed &&
      recomputedPegMapHash === round.pegMapHash &&
      recomputedBinIndex === round.binIndex
    );
    
    // 6. Return verification result
    res.json({
      isValid,
      original: {
        roundId: round._id,
        commitHex: round.commitHex,
        combinedSeed: round.combinedSeed,
        pegMapHash: round.pegMapHash,
        binIndex: round.binIndex,
        serverSeed: round.serverSeed,
        clientSeed: round.clientSeed,
        nonce: round.nonce,
        dropColumn: round.dropColumn
      },
      recomputed: {
        commitHex: recomputedCommitHex,
        combinedSeed: recomputedCombinedSeed,
        pegMapHash: recomputedPegMapHash,
        binIndex: recomputedBinIndex,
        path: recomputedPath
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Keep existing verifyRound as a public calculator (rename for clarity)
exports.calculateRound = async (req, res) => {
  try {
    const { serverSeed, clientSeed, nonce, dropColumn } = req.query;

    if (!serverSeed || !clientSeed || !nonce || !dropColumn) {
      return res.status(400).json({ 
        error: "Missing required parameters: serverSeed, clientSeed, nonce, dropColumn" 
      });
    }

    const dropColInt = parseInt(dropColumn, 10);
    if (isNaN(dropColInt) || dropColInt < 0 || dropColInt > 12) {
      return res.status(400).json({ error: "dropColumn must be between 0 and 12" });
    }

    // 1. Compute Commit Hex
    const commitHex = cryptoUtils.sha256(`${serverSeed}:${nonce}`);

    // 2. Compute Combined Seed
    const combinedSeed = cryptoUtils.getCombinedSeed(serverSeed, clientSeed, nonce);

    // 3. Run Deterministic Engine
    const { pegMapHash, binIndex, path } = gameEngine.runPlinkoRound(
      combinedSeed,
      dropColInt
    );

    // 4. Return computed results (NOT verification, just calculation)
    res.json({
      note: "This is a calculation, not verification. Use GET /api/rounds/:id/verify to verify a real round.",
      commitHex,
      combinedSeed,
      pegMapHash,
      binIndex,
      path
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

