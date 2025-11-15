import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import chromium from "@sparticuz/chromium"; // <-- 1. ADD THIS IMPORT

// Routes
import certificatesRouter from "./routes/certificates";
import templateCerts from "./routes/templateCerts";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// Health Check
app.get("/", (_req, res) => res.send("CertificateMaker Backend Running"));

// Mount the Certificates Router
app.use("/api/certificates", certificatesRouter);

// Mount Templates Router
app.use("/api/templates", templateCerts);

// Serve your SVG assets statically
app.use("/assets", express.static(path.join(__dirname, "templates/assets")));

// Connect to MongoDB and start server
async function start() {
  const uri = process.env.MONGO_URI || "";
  try {
    if (!uri) {
      console.warn("⚠️ MONGO_URI not set in .env");
    } else {
      await mongoose.connect(uri);
      console.log("✅ MongoDB connected");
    }

    // ▼▼▼ 2. ADD THIS BLOCK ▼▼▼
    // This "warms up" Chromium by unpacking it before we accept requests.
    // This fixes the ETXTBSY "file busy" error on Render.
    console.log(" warming up Chromium...");
    await chromium.executablePath();
    console.log("✅ Chromium is ready.");
    // ▲▲▲ ADD THIS BLOCK ▲▲▲

  } catch (err) {
    console.error("❌ Server startup error:", err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📂 SVG Template Assets being served from: ${path.join(__dirname, "templates/assets")}`);
  });
}

start();