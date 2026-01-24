Plinko Lab - Provably Fair Engine
Author: Rajat Bhopte Role: Full-Stack Developer Intern Applicant, Daphnis Labs

A full-stack, provably-fair Plinko game built with the MERN stack (React, Node.js, Express, MongoDB) and TypeScript. This project implements a deterministic physics engine and a cryptographic commit-reveal protocol to ensure 100% fair and verifiable gameplay.
Live Application: https://plinko-game-project.vercel.app/

How to Run Locally
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


2. Frontend Setup
cd frontend
npm install
npm run start
The client will be running at http://localhost:3000 and the API at http://localhost:5000.
