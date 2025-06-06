const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Candidate = require("../models/Candidate");

const router = express.Router();

// Who is logged in (used by frontend after login)
router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ username: decoded.name, role: decoded.role });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// Register a new user (candidate by default)
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const role = "candidate"; // All new users default to candidate

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    // Create candidate profile with default fields
    if (role === "candidate") {
      await Candidate.create({
        userId: newUser._id,
        roleApplied: "",
        skills: [],
        introduction: "",
        education: [],
        contactNumber: "+60123456789" // default valid contact
      });
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login (React sends credentials)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    const isMatch = user && await bcrypt.compare(password, user.password);

    if (!user || !isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
    });

    res.cookie("username", user.name, { httpOnly: true });
    res.cookie("role", user.role, { httpOnly: true });

    res.json({ success: true, username: user.name, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.clearCookie("username");
  res.clearCookie("role");
  res.json({ message: "Logged out successfully" });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token"); // Clear the authentication token cookie
  res.status(200).json({ message: "Logout successful" });
});


module.exports = router;
  
