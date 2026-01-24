Plinko Lab - Provably Fair Engine

A full-stack, provably-fair Plinko game built with the MERN stack (React, Node.js, Express, MongoDB) and TypeScript. This project implements a deterministic physics engine and a cryptographic commit-reveal protocol to ensure 100% fair and verifiable gameplay.
Live Application: https://plinko-game-project.vercel.app/

How to Run Locally Prerequisites
Node.js (v18+)

MongoDB installed and running locally (or a MongoDB Atlas URI)
Create a .env file in the root of your backend directory:
MONGO_URI="mongodb://localhost:27017/plinko_db"
PORT=5000

Installation Steps
1. Backend Setup
cd backend
npm install
npm run dev
