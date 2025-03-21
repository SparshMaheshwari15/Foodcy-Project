const express = require("express");
const passport = require("passport");
const User = require("../models/models.user");
const Order = require("../models/models.order");
const { ensureAuthenticated } = require("../middleware/middleware.auth");

const router = express.Router();

router.get("/", ensureAuthenticated,async (req, res) => {
    // res.render("login"); // Create a login.ejs file
    const orders = await Order.find();
    res.render('admin', { orders });
});


module.exports = router;
