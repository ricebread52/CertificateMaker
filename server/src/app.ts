import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path"; // ✅ Added to help serve files if needed

// Routes
import certificatesRouter from "./routes/certificates";
import templateCerts from "./routes/templateCerts";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // ✅ Increased limit just in case Puppeteer sends big buffers
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// Health Check
app.get("/", (_req, res) => res.send("CertificateMaker Backend Running"));

// ✅ Mount the Certificates Router (This contains your new /generate endpoint)
app.use("/api/certificates", certificatesRouter);

// Mount Templates Router
app.use("/api/templates", templateCerts);

// ✅ OPTIONAL: Serve your SVG assets statically
// This allows the frontend to fetch raw SVGs if you want to show previews
// Access via: http://localhost:5000/assets/anjadhey.svg
app.use("/assets", express.static(path.join(__dirname, "templates/assets")));

// Connect to MongoDB and start server
async function start() {
  const uri = process.env.MONGO_URI || "";
  try {
    if (!uri) {
      console.warn("⚠️ MONGO_URI not set in .env — using temporary in-memory logic if available.");
    } else {
      await mongoose.connect(uri);
      console.log("✅ MongoDB connected");
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📂 SVG Template Assets being served from: ${path.join(__dirname, "templates/assets")}`);
  });
}

start();