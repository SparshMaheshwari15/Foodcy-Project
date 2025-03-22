const express = require("express");
const passport = require("passport");
const User = require("../models/models.user");

const router = express.Router();

// Admin Login Page
router.get("/login", (req, res) => {
    res.render("login");
});

// Handle Login
router.post("/login", passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/auth/login",
    failureFlash: true,
}));

// Logout
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        // Set flash message BEFORE destroying session
        req.flash("success_msg", "You are logged out");
        console.log("You are logged out");
        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                console.log("Error destroying session:");
                return res.redirect("/"); // Redirect home if error occurs
            }

            // Clear the session cookie
            res.clearCookie("connect.sid");
            console.log("connect.sid");

            // Redirect after session is cleared
            res.redirect("/auth/login");
        });
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
