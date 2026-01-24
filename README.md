Plinko Lab - Provably Fair Engine
Author: Rajat Bhopte Role: Full-Stack Developer Intern Applicant, Daphnis Labs

A full-stack, provably-fair Plinko game built with the MERN stack (React, Node.js, Express, MongoDB) and TypeScript. This project implements a deterministic physics engine and a cryptographic commit-reveal protocol to ensure 100% fair and verifiable gameplay.

🔗 Links
Live Application: https://plinko-game-project.vercel.app/

🚀 How to Run Locally
Prerequisites
Node.js (v18+)

MongoDB installed and running locally (or a MongoDB Atlas URI)

Environment Variables
Create a .env file in the root of your backend directory:
MONGO_URI="mongodb://localhost:27017/plinko_db"
PORT=5000


Create a .env file in the root of your frontend directory:
REACT_APP_API_URL="http://localhost:5000/api"


Installation Steps
1. Backend Setup
cd backend
npm install
npm run dev


3. Frontend Setup
cd frontend
npm install
npm run start
The client will be running at http://localhost:3000 and the API at http://localhost:5000.

🏗️ Architecture Overview
The application follows a decoupled client-server architecture.
Frontend (React + TypeScript): Handles the UI/UX, user inputs, and animations. The Plinko board and deterministic ball paths are rendered dynamically using HTML5 Canvas.
Backend (Node.js + Express.js): Acts as the secure authority for the RNG protocol, validating inputs, and executing the deterministic engine to compute outcomes.
Database (MongoDB + Mongoose): NoSQL database used to store round data, commits, and revealed seeds for public verification.

⚖️ Fairness Specification
This game uses a standard commit-reveal protocol to guarantee fairness.
Hashing & Commit: The Express server generates a secret serverSeed and nonce, then publishes commitHex = SHA256(serverSeed + nonce)  before the round starts.
Combined Seed Generation: Once the client provides a clientSeed, the final randomness is driven by combinedSeed = SHA256(serverSeed + clientSeed + ":" + nonce).
PRNG (xorshift32): We use the xorshift32 algorithm seeded by the first 4 bytes of the combinedSeed. This specific PRNG was chosen for its high performance and ease of deterministic replication in the verifier.
Peg Map & Rounding Rules:
Each of the 12 rows generates a leftBias between 0.4 and 0.6.
The formula used: leftBias = 0.5 + (rand() - 0.5) * 0.2.
Floating-point numbers are rounded to exactly 6 decimal places to ensure stable hashing across different environments.
Drop Column Influence: The player's chosen column applies a slight bias adjustment: adj = (dropColumn - floor(12/2)) * 0.01.

🤖 AI Usage Log
As encouraged, I leveraged AI (Google Gemini) to accelerate the development process.
Where: Implementing the xorshift32 PRNG in TypeScript.
Prompt used: "Write a deterministic xorshift32 PRNG function in TypeScript that takes a hex string seed, extracts the first 4 bytes, and generates pseudo-random numbers between 0 and 1."
What I kept/changed: The AI generated a standard bitwise implementation. I modified the output to float [0, 1) and added strict types.
Why: Bitwise operations in JS/TS can be tricky with 32-bit signed integers; AI provided a syntactically correct foundation instantly, allowing me to focus on the Express controllers and Mongoose schemas.


⏱️ Time Log & Future Work
Total Time Spent: ~8.5 Hours
1.5 Hours: System design, commit-reveal protocol research, and Mongoose schema setup.
3 Hours: Building the deterministic engine in Node.js and matching the test vectors.
3 Hours: React frontend UI, Canvas animations, and the Verifier page.
1 Hour: Testing, README, and deployment.
If I had more time, I would:

Algorithmic Optimization: Optimize the React Canvas rendering loop using requestAnimationFrame for strictly 60fps on low-end devices.
WebSockets: Implement Socket.io for a real-time multiplayer leaderboard and live round streaming.
True Physics: Replace the "faked" physics with a fixed-timestep Matter.js implementation while keeping the Node.js backend authoritative.
