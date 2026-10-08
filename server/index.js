require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Coffee = require("./models/Coffee");
const { seed } = require("./seed");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
app.use(express.json());

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const toClient = (c) => ({
  id: c._id,
  name: c.name,
  origin: c.origin,
  roast: c.roast,
  votes: c.votes,
  rating: c.votes ? Math.round((c.ratingSum / c.votes) * 10) / 10 : 0,
});

// Step 1: all coffees for the grid
app.get("/api/coffees", async (req, res) => {
  try {
    res.json((await Coffee.find().lean()).map(toClient));
  } catch {
    res.status(500).json({ error: "Could not load coffees." });
  }
});

// Step 2: vote. Atomically increments the vote count and adds to the rating total.
app.post("/api/coffees/:id/vote", async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res
      .status(400)
      .json({ error: "Rating must be a whole number from 1 to 5." });
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: "Invalid coffee id." });
  try {
    const c = await Coffee.findByIdAndUpdate(
      req.params.id,
      { $inc: { votes: 1, ratingSum: rating } },
      { new: true },
    ).lean();
    if (!c) return res.status(404).json({ error: "Coffee not found." });
    res.json(toClient(c));
  } catch {
    res.status(500).json({ error: "Could not save your vote." });
  }
});

// Step 4: leaderboard (top 5 by rating; needs at least 10 votes so one vote can't win)
app.get("/api/leaderboard", async (req, res) => {
  try {
    const top = (await Coffee.find({ votes: { $gte: 10 } }).lean())
      .map(toClient)
      .sort((a, b) => b.rating - a.rating || b.votes - a.votes)
      .slice(0, 5);
    res.json(top);
  } catch {
    res.status(500).json({ error: "Could not load leaderboard." });
  }
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Serve the built React app in production
const dist = path.join(__dirname, "../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");
    if (await seed(false)) console.log("Database was empty: loaded seed data");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
