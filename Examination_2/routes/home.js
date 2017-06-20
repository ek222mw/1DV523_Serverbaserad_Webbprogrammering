/*jshint esversion:6 */
//home route, which is triggered when start the app.
let router = require("express").Router();
router.route("/")
    .get(function(req, res) {
        res.render("home/index");
    });

module.exports = router;
