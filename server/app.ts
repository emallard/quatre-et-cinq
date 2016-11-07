import express = require("express");
import path = require("path");
import favicon = require('serve-favicon');
import logger = require("morgan");
import bodyParser = require("body-parser");
import cookieParser = require('cookie-parser');

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

app.use(function(req, res, next) {
    let err = <any>new Error("Not Found");
    err["status"] = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
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
app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});

export = app;