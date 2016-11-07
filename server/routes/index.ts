import express = require("express");
import mongodb = require("mongodb");

let router = express.Router();

router.get("/", function (req: express.Request, res: express.Response, next: express.NextFunction) {
    //res.render("index", { title: "Typescript Base Express" });
    res.send('coucou');
});


var assert = require('assert');
var MongoClient = mongodb.MongoClient;

// Connection URL
var url = 'mongodb://localhost:27018/myproject';


var insertDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
}

async function doMongo()
{
    // Use connect method to connect to the server
    var db = await MongoClient.connect(url);
    
    console.log("Connected successfully to server");

    var collection = db.collection('documents');
    console.log('1');
    await collection.insert({a:666});
    console.log('2');
    db.close();
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
router.get("/")

export = router;