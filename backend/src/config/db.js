const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // Make sure to add MONGODB_URI in your .env file
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
