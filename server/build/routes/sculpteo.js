"use strict";
const express = require("express");
const request = require('request');
const config = require('../config');
const bodyParser = require("body-parser");
let router = express.Router();
router.post("/", bodyParser.raw(), function (req, res, next) {
    console.log(req.body);
    PostCode(req.body, req.params.filename, res);
    res.send('ok');
});
router.get("/test", function (req, res, next) {
    console.log('test');
    //PostCode(null, res);
    res.send('test');
});
function PostCode(body, filename, res) {
    //https://github.com/request/request
    var formData = {
        // Pass a simple key-value pair
        //my_field: 'my_value',
        // Pass data via Buffers
        //my_buffer: new Buffer([1, 2, 3]),
        // Pass data via Streams
        //file: fs.createReadStream('/home/etienne/a.stl'),
        file: {
            value: body,
            options: {
                filename: 'thefilename',
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
        name: 'test design',
        unit: 'mm',
        designer: config.sculpteo_username,
        password: config.sculpteo_password,
        print_authorization: '1'
    };
    var url = 'https://www.sculpteo.com/en/upload_design/a/3D/';
    //request.post({url:url, formData: formData}, function optionalCallback(err, httpResponse, body) {
    var options = {
        url: url,
        headers: {
            'X-Requested-With': ' XMLHttpRequest'
        },
        formData: formData
    };
    var r = request.post(options, function optionalCallback(err, httpResponse, body) {
        console.log('reponse');
        if (err) {
            console.error('upload failed:');
            console.log(err);
            console.log(body);
            res.send(err);
        }
        else {
            console.log('Upload successful!  Server responded with:', body);
            res.send(body);
        }
    });
    /*
        var form = r.form();
        form.append('name', 'my_name');
    //    form.append('file', fs.createReadStream('/home/etienne/b.stl'), {filename: 'blablabla'}););
    */
}
module.exports = router;
//# sourceMappingURL=sculpteo.js.map