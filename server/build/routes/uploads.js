"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const config = require('../config');
let router = express.Router();
var MongoClient = mongodb.MongoClient;
var url = config.mongo_url;
var db;
MongoClient.connect(url).then(result => { db = result; console.log('connected to mongodb ' + url); });
router.get("/uploadString", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var id = yield uploadString(req.param('content'));
        res.send({ id: id });
    });
});
router.post("/uploadString", bodyParser.text(), function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var id = yield uploadString(req.body);
        res.send({ id: id });
    });
});
router.get("/downloadString", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        yield downloadString(req.query.id, res);
    });
});
router.get("/downloadDataUri", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        yield downloadDataUri(req.query.id, res);
    });
});
router.post("/uploadBufferWithMime", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var strBase64 = bufferToBase64(req.body);
        var mime = req.query.mime;
        var content = 'data:' + mime + ';base64,' + strBase64;
        var id = yield uploadString(content);
        res.send(id);
    });
});
router.get("/downloadBuffer", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
    });
});
function uploadString(_content) {
    return __awaiter(this, void 0, void 0, function* () {
        var collection = db.collection('uploads');
        var ins = yield collection.insertOne({ content: _content });
        return ins.insertedId;
    });
}
function downloadString(_id, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var collection = db.collection('uploads');
        var found = yield collection.find({ _id: new mongodb.ObjectID(_id) }).limit(1);
        // error with pipe :
        // http://stackoverflow.com/questions/40259864/handle-mongodb-error-when-streaming-directly-to-express-response
        var stream = found.stream();
        stream.on('data', function (doc) { res.write(JSON.stringify(doc.content)); });
        stream.on('end', function () { res.end(); });
    });
}
function downloadDataUri(id, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var collection = db.collection('uploads');
        var found = yield collection.find({ _id: new mongodb.ObjectID(id) }).limit(1);
        var arr = yield found.toArray();
        var str = arr[0].content;
        var regex = /^data:(.+);base64,(.*)$/;
        var matches = str.match(regex);
        var mime = matches[1];
        var data = matches[2];
        res.writeHead(200, { 'Content-Type': mime });
        res.write(new Buffer(data, 'base64'), 'binary');
        res.end();
    });
}
function bufferToBase64(content) {
    var uarr = new Uint8Array(content);
    var strings = [], chunksize = 0xffff;
    var len = uarr.length;
    // There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
    for (var i = 0; i * chunksize < len; i++) {
        strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
    }
    return btoa(strings.join(''));
}
module.exports = router;
//# sourceMappingURL=uploads.js.map