import express = require("express");
import mongodb = require("mongodb");
import bodyParser = require("body-parser");
import config = require('../config');

let router = express.Router();

var MongoClient = mongodb.MongoClient;
var url = config.mongo_url;
var db:mongodb.Db ;
MongoClient.connect(url).then(result => { db = result; console.log('connected to mongodb ' + url);});


router.get("/uploadString", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var id = await uploadString(req.param('content'));
    res.send({id : id});
});

router.post("/uploadString", bodyParser.text(), async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var id = await uploadString(req.body);
    res.send({id: id});
});

router.get("/downloadString", async function (req: express.Request, res: express.Response, next: express.NextFunction) {  
    await downloadString(req.query.id, res);  
});

router.get("/downloadDataUri", async function (req: express.Request, res: express.Response, next: express.NextFunction) {  
    await downloadDataUri(req.query.id, res);  
});


router.post("/uploadBufferWithMime", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var strBase64 = bufferToBase64(req.body);
    var mime = req.query.mime;
    var content = 'data:' + mime + ';base64,' + strBase64;
    var id = await uploadString(content);
    res.send(id);
});

router.get("/downloadBuffer", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
});


async function uploadString(_content: string): Promise<mongodb.ObjectID>
{
    var collection = db.collection('uploads');
    var ins = await collection.insertOne({content: _content});
    return ins.insertedId;
}

async function downloadString(_id: string, res: express.Response)
{
    var collection = db.collection('uploads');
    var found = await collection.find({_id:new mongodb.ObjectID(_id)}).limit(1);

    // error with pipe :
    // http://stackoverflow.com/questions/40259864/handle-mongodb-error-when-streaming-directly-to-express-response
    var stream = found.stream();
    stream.on('data', function (doc) { res.write(JSON.stringify(doc.content)); });
    stream.on('end', function () {res.end(); });
}

async function downloadDataUri(id: string, res: express.Response)
{
    var collection = db.collection('uploads');
    var found = await collection.find({_id:new mongodb.ObjectID(id)}).limit(1);
    var arr = await found.toArray();

    var str = arr[0].content;
    var regex = /^data:(.+);base64,(.*)$/;
    
    var matches = str.match(regex);
    var mime = matches[1];
    var data = matches[2];

    res.writeHead(200,{ 'Content-Type': mime });
    res.write(new Buffer(data, 'base64'), 'binary');
    res.end();
}

function bufferToBase64(content: ArrayBuffer): string
{
    var uarr = new Uint8Array(content);
    var strings = [], chunksize = 0xffff;
    var len = uarr.length;

    // There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
    for (var i = 0; i * chunksize < len; i++){
      strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
    }

    return btoa(strings.join(''));
}

/*
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
*/

export = router;