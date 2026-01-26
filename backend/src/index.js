// const express = require("express");
// const cors = require("cors");
// const connectDB = require("./config/db");
// const roundController = require("./controllers/roundController");
// require("dotenv").config();

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Connect to Database
// connectDB();



// // API Routes
// app.post("/api/rounds/commit", roundController.commitRound);
// app.post("/api/rounds/:id/start", roundController.startRound);
// app.post("/api/rounds/:id/reveal", roundController.revealRound);
// app.get("/api/rounds/:id", roundController.getRound);
// app.get("/api/verify", roundController.verifyRound);

// app.get("/api/rounds/:id/verify", roundController.verifyRoundById);

// // RENAMED: Public calculator (not real verification)
// app.get("/api/verify", roundController.calculateRound);


// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const roundController = require("./controllers/roundController");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// ===== API ROUTES (CORRECTED ORDER) =====

// 1. Commit round
app.post("/api/rounds/commit", roundController.commitRound);

// 2. Start round
app.post("/api/rounds/:id/start", roundController.startRound);

// 3. Reveal round
app.post("/api/rounds/:id/reveal", roundController.revealRound);

// 4. Verify round by ID (MUST come BEFORE generic /:id route)
app.get("/api/verify", roundController.verifyRound);
app.get("/api/rounds/:id/verify", roundController.verifyRoundById);

// 5. Get round by ID (comes AFTER specific routes)
app.get("/api/rounds/:id", roundController.getRound);

// 6. Public calculator (manual verification)
app.get("/api/verify", roundController.calculateRound);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
