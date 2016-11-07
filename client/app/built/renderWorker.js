importScripts('../../libs/gl-matrix.js');
importScripts('../../app/built/built.js');


var worker = new qec.renderWorker();
worker.setPostMessageFunction(function (r) {postMessage(r)});
onmessage = function(e) {
    //console.log('Message received from main script :', e.data);
    worker.onmessage(e);

    //workerResult = [e.data[0], "ma reponse", vec3.set(vec3.create(), 0.5, 2, 3)]
    //postMessage(workerResult);
}