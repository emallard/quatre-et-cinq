"use strict";
const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
let app = express();
// view engine setup
/*
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
*/
if (app.get("env") === "development") {
    app.use(logger("dev"));
}
app.use(express.static(path.join(__dirname, "..", "..", "client")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// Routes
app.use("/", require("./routes/index"));
// error handlers
app.use(function (req, res, next) {
    let err = new Error("Not Found");
    err["status"] = 404;
    next(err);
});
// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
        console.log(err.stack);
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});
module.exports = app;
//# sourceMappingURL=app.js.map