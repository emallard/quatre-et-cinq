"use strict";
const express = require("express");
let router = express.Router();
router.get("/", function (req, res, next) {
    //res.render("index", { title: "Typescript Base Express" });
    res.send('coucou4');
});
module.exports = router;
//# sourceMappingURL=index.js.map