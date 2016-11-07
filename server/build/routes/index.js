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
router.get("/", function (req, res, next) {
    //res.render("index", { title: "Typescript Base Express" });
    res.send('coucou');
});
var assert = require('assert');
var MongoClient = mongodb.MongoClient;
// Connection URL
var url = 'mongodb://localhost:27018/myproject';
var insertDocuments = function (db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.insertMany([
        { a: 1 }, { a: 2 }, { a: 3 }
    ], function (err, result) {
        assert.equal(err, null);
        assert.equal(3, result.result.n);
        assert.equal(3, result.ops.length);
        console.log("Inserted 3 documents into the collection");
        callback(result);
    });
};
function doMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        // Use connect method to connect to the server
        var db = yield MongoClient.connect(url);
        console.log("Connected successfully to server");
        var collection = db.collection('documents');
        console.log('1');
        yield collection.insert({ a: 666 });
        console.log('2');
        db.close();
    });
}
//doMongo();
/*
// db.ts
export interface User {
      _id: mongodb.ObjectId;
      username: string;
      password: string;
      somethingElse: string;
}
*/
router.get("/");
module.exports = router;
//# sourceMappingURL=index.js.map