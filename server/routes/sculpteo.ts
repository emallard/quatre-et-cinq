import express = require("express");
import request = require('request');
import fs = require('fs');
import config = require('../config');
import bodyParser = require("body-parser");
let router = express.Router();

router.post("/", bodyParser.raw({limit: 1000000, type:(req)=>true}), function (req: express.Request, res: express.Response, next: express.NextFunction) {
    
    console.log('designName: ' + req.query.designName);
    console.log(req.body);
    
    PostCode(req.body, req.query.designName, res);
    //res.send({errors: "mock"});
});

router.get("/test", function (req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log('test');
    //res.send('test');
});

function PostCode(body:Buffer, designName:string, res: express.Response) {

    //https://github.com/request/request

    var formData = {
        // Pass a simple key-value pair
        //my_field: 'my_value',
        // Pass data via Buffers
        //my_buffer: new Buffer([1, 2, 3]),
        // Pass data via Streams
        //file: fs.createReadStream('/home/etienne/a.stl'),
        
        file : {
            value:  body,
            options: {
                filename: 'thefilename.zip',
                contentType: 'application/octet-stream'
            }
        },
        // Pass optional meta-data with an 'options' object with style: {value: DATA, options: OPTIONS}
        // Use case: for some types of streams, you'll need to provide "file"-related information manually.
        // See the `form-data` README for more information about options: https://github.com/form-data/form-data
        /*
        custom_file: {
            value:  fs.createReadStream('/dev/urandom'),
            options: {
            filename: 'topsecret.jpg',
            contentType: 'image/jpg'
            }
        }*/
        /*filename: 'a.stl',*/
        name: designName,
        unit: 'cm',
        designer: config.sculpteo_username,
        password: config.sculpteo_password,
        print_authorization: '1'
    };
    var url = 'https://www.sculpteo.com/en/upload_design/a/3D/';
      
    //request.post({url:url, formData: formData}, function optionalCallback(err, httpResponse, body) {
    
    var options = {
        url: url,
        headers: {
            'X-Requested-With' : ' XMLHttpRequest'
            //,'Content-Type': 'multipart/form-data'
        }
        ,formData: formData
    };


    var r = request.post(options, function optionalCallback(err, httpResponse, body) {
        console.log('reponse');
        if (err) {
            console.error('upload failed:');
            console.log(err);
            console.log(body);
            res.send(err);
        }
        else
        {
            var bodyJson = JSON.parse(body);
            console.log('Upload successful!  Server responded with:', bodyJson.uuid);
            res.send({uuid: bodyJson.uuid});
        }
    });
/*
    var form = r.form();
    form.append('name', 'my_name');
//    form.append('file', fs.createReadStream('/home/etienne/b.stl'), {filename: 'blablabla'}););
*/
}


export = router;