const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/models.user");

module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(User.authenticate()));

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
};
