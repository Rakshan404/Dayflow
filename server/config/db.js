const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.log("Server will keep running without DB — fix MONGO_URI in .env when ready.");
  }
}

module.exports = connectDB;
