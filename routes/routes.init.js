const express = require("express");
const Order = require("../models/models.order");
const { ensureAuthenticated } = require("../middleware/middleware.auth");
const router = express.Router();

const INIT_PASSWORD = process.env.SECRET_KEY_TO_INIT;

router.get("/", ensureAuthenticated, (req, res) => {
    res.render("init"); // Show the password input page
});

router.post("/", ensureAuthenticated, async (req, res) => {
    const { password, upperLimit } = req.body;
    if (!upperLimit) {
        req.flash("No upper limit");
        return res.send("No upper limit")
    }
    if (upperLimit<1) {
        req.flash("Wrong upper limit");
        return res.send("Wrong upper limit")
    }
    if (!password) {
        req.flash("No password");
        return res.send("No password")
    }
    if (password === INIT_PASSWORD) {
        try {
            await Order.deleteMany({});
            console.log('Database cleared.');

            const orders = [];
            for (let i = 1; i <= upperLimit; i++) {
                orders.push({ billNo: i.toString(), status: 'Pending' });
            }
            await Order.insertMany(orders);
            res.render("initSucc.ejs", { upperLimit });
            // res.send('Database cleared and reinitialized with orders 1-' + upperLimit);
        } catch (error) {
            console.error('Error initializing database:', error);
            res.status(500).render("initFail", { errorMessage: error.message });
            // res.status(500).send('Error initializing database');
        }
        // res.send("Init Successful!");
    } else {
        res.status(500).render("initFail", { errorMessage: "Incorrect password!" });
        // res.status(403).send("Incorrect password!");
    }
});

module.exports = router;
