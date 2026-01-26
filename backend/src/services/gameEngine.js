// const crypto = require("crypto");

// // Deterministic Game Engine for Plinko
// const ROWS = 12; // [cite: 37]

// function runPlinkoRound(combinedSeed, dropColumn) {
//   // 1. Seed the PRNG with the first 4 bytes of the combinedSeed (big-endian)
//   const seedHex = combinedSeed.substring(0, 8);
//   let prngState = parseInt(seedHex, 16);

//   // xorshift32 implementation
//   function rand() {
//     prngState ^= prngState << 13;
//     prngState ^= prngState >> 17;
//     prngState ^= prngState << 5;
//     prngState >>>= 0; // Ensure unsigned 32-bit integer
//     return prngState / 4294967296; // Return float in [0, 1) [cite: 41]
//   }

//   // 2. Generate Peg Map
//   const pegMap = [];
//   for (let r = 0; r < ROWS; r++) {
//     const rowPegs = [];
//     for (let p = 0; p <= r; p++) {
//       // leftBias = 0.5 + (rand() - 0.5) * 0.2 [cite: 41]
//       let leftBias = 0.5 + (rand() - 0.5) * 0.2;
//       // Round to 6 decimals for stable hashing [cite: 41]
//       leftBias = parseFloat(leftBias.toFixed(6));
//       rowPegs.push(leftBias);
//     }
//     pegMap.push(rowPegs);
//   }

//   // 3. Compute Peg Map Hash: SHA256(JSON.stringify(pegMap)) [cite: 42]
//   const pegMapHash = crypto
//     .createHash("sha256")
//     .update(JSON.stringify(pegMap))
//     .digest("hex");

//   // 4. Calculate Path & Decisions
//   let pos = 0; // Number of 'Right' moves so far [cite: 38]
//   const path = [];

//   // Drop column influence [cite: 44]
//   const adj = (dropColumn - Math.floor(ROWS / 2)) * 0.01;

//   for (let r = 0; r < ROWS; r++) {
//     const pegIndex = Math.min(pos, r); // Peg under current path [cite: 45]
//     const baseBias = pegMap[r][pegIndex];

//     let bias = baseBias + adj;
//     bias = Math.max(0, Math.min(1, bias)); // clamp(leftBias + adj, 0, 1) [cite: 43]

//     const rnd = rand();
//     const direction = rnd < bias ? "L" : "R"; // If rnd < bias choose Left, else Right [cite: 45]

//     path.push({
//       row: r,
//       peg: pegIndex,
//       baseBias,
//       finalBias: bias,
//       rnd,
//       direction,
//     });

//     if (direction === "R") {
//       pos += 1; // [cite: 45]
//     }
//   }

//   const binIndex = pos; // Final binIndex = pos (0..12) [cite: 39]

//   return {
//     pegMapHash,
//     binIndex,
//     path,
//   };
// }

// module.exports = { runPlinkoRound };
const crypto = require("crypto");

const ROWS = 12;
const ROWS = 12;

function runPlinkoRound(combinedSeed, dropColumn) {
  // Validate dropColumn
  if (dropColumn < 0 || dropColumn > 12) {
    throw new Error("dropColumn must be between 0 and 12");
  }

  // 1. Seed the PRNG
  // Validate dropColumn
  if (dropColumn < 0 || dropColumn > 12) {
    throw new Error("dropColumn must be between 0 and 12");
  }

  // 1. Seed the PRNG
  const seedHex = combinedSeed.substring(0, 8);
  let prngState = parseInt(seedHex, 16);

  function rand() {
    prngState ^= prngState << 13;
    prngState ^= prngState >> 17;
    prngState ^= prngState << 5;
    prngState >>>= 0;
    return prngState / 4294967296;
    prngState >>>= 0;
    return prngState / 4294967296;
  }

  // 2. Generate Peg Map
  const pegMap = [];
  for (let r = 0; r < ROWS; r++) {
    const rowPegs = [];
    for (let p = 0; p <= r; p++) {
      let leftBias = 0.5 + (rand() - 0.5) * 0.2;
      leftBias = parseFloat(leftBias.toFixed(6));
      rowPegs.push(leftBias);
    }
    pegMap.push(rowPegs);
  }

  // 3. Compute Peg Map Hash
  // 3. Compute Peg Map Hash
  const pegMapHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(pegMap))
    .digest("hex");

  // 4. Calculate Path & Decisions
  // FIXED: Start at the player's chosen drop column
  let pos = dropColumn; // ✅ Start where player chose
  const path = [];

  // Optional: Small bias adjustment based on drop column (makes minimal difference)
  // const adj = (dropColumn - Math.floor(ROWS / 2)) * 0.01;
  const adj = 0; // Disabled for cleaner physics

  for (let r = 0; r < ROWS; r++) {
    // Calculate which peg we're hitting based on current position
    // In a pyramid layout, row r has pegs from position (12-r)/2 to (12+r)/2
    const rowStartPos = (12 - r) / 2;
    const rowEndPos = (12 + r) / 2;

    // Clamp position to valid peg range for this row
    const clampedPos = Math.max(rowStartPos, Math.min(rowEndPos, pos));

    // Peg index within the row (0 to r)
    const pegIndex = Math.round(clampedPos - rowStartPos);

    const baseBias = pegMap[r][pegIndex];
    let bias = baseBias + adj;
    bias = Math.max(0, Math.min(1, bias));
    bias = Math.max(0, Math.min(1, bias));

    const rnd = rand();
    const direction = rnd < bias ? "L" : "R";
    const direction = rnd < bias ? "L" : "R";

    path.push({
      row: r,
      peg: pegIndex,
      baseBias,
      finalBias: bias,
      rnd,
      direction,
    });

    if (direction === "R") {
      pos += 1;
    }
    // If direction === "L", pos stays the same
  }

  // Clamp final bin to valid range [0, 12]
  const binIndex = Math.max(0, Math.min(12, pos));

  return {
    pegMapHash,
    binIndex: clampedBinIndex,
    path,
  };
}

module.exports = { runPlinkoRound };


