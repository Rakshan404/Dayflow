const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hrms";
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5s timeout instead of hanging
    });
    console.log(`✅ MongoDB Connected successfully to: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("👉 Please ensure local MongoDB is running OR update MONGO_URI in server/.env with your MongoDB Atlas connection string.");
  }
}

module.exports = connectDB;

