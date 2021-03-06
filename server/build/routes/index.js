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
let router = express.Router();
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27018/test';
var db;
MongoClient.connect(url).then(result => { db = result; console.log('connected to mongodb ' + url); });
router.post("/upload", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var id = yield upload(req.body);
        res.send(id);
    });
});
router.get("/uploadString", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var id = yield uploadString(req.param('content'));
        //console.log('uploadString ' + JSON.stringify(req.query));
        res.send(id);
    });
});
router.get("/downloadString", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        yield downloadString(req.query.id, res);
    });
});
router.get("/download", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var collection = db.collection('uploads');
        var found = yield collection.find({ _id: req.params.id });
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        var stream = found.stream();
        stream.pipe(res);
        //stream.on('end', function() { res.end(); });
        /*
        response.writeHead(200, { "Content-Type": mimeType });
        response.write(file, "binary");
        response.end();
        */
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
function upload(content) {
    return __awaiter(this, void 0, void 0, function* () {
        //var grid  = mongodb.
        var collection = db.collection('uploads');
        var uarr = new Uint8Array(content);
        var strings = [], chunksize = 0xffff;
        var len = uarr.length;
        // There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
        for (var i = 0; i * chunksize < len; i++) {
            strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
        }
        var ins = yield collection.insert({
            "content": btoa(strings.join('')),
            "encoding": "base64"
        });
        db.close();
        return ins.insertedId;
    });
}
module.exports = router;
//# sourceMappingURL=index.js.map