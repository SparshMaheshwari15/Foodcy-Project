const express = require("express");
const passport = require("passport");
const User = require("../models/models.user");

const router = express.Router();

// Admin Login Page
router.get("/login", (req, res) => {
    res.render("login"); // Create a login.ejs file
});

// Handle Login
router.post("/login", passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/login",
    failureFlash: true,
}));

// Logout
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success_msg", "You are logged out");
        res.redirect("/login");
    });
});

// Register Admin (Only for first-time setup)
// router.get("/register", async (req, res) => {
//     const existingAdmin = await User.findOne({ username: "admin" });
//     if (!existingAdmin) {
//         const newUser = new User({ username: "admin", email: "admin@example.com" });
//         await User.register(newUser, "admin");
//         res.send("Admin created! Now go to /login to sign in.");
//     } else {
//         res.send("Admin already exists!");
//     }
// });

module.exports = router;
