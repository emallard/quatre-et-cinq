// https://gist.github.com/ilblog/5fa2914e0ad666bbb85745dbf4b3f106
// https://github.com/Kagami/ffmpeg.js
declare var ffmpeg;
declare var Whammy;
module qec {
    export class video {
        MEMFS: any[] = [];

        worker: any;
        width = 1;
        height = 1;

        encoder: any
        zip = new JSZip();

        constructor() {
            //this.encoder = new Whammy.Video(15);
            //worker = new Worker('/libs/ffmpeg-worker-mp4.js')
        }

        mimeType = 'image/jpeg'; //'image/webp';// 'image/jpeg';
        counter = 0;

        addCanvas(canvas: HTMLCanvasElement) {
            this.width = canvas.width;
            this.height = canvas.height;

            const imgString = canvas.toDataURL(this.mimeType, 1);
            const data = this.convertDataURIToBinary(imgString)
            //this.encoder.add(imgString);
            /*
            this.MEMFS.push({
                name: `img${ this.pad( this.MEMFS.length, 3, '0' ) }.jpeg`,
                data: data
            })
            */

            let imgName = `img${this.pad(this.counter, 4, '0')}.jpeg`;
            this.counter++;
            this.zip.file(imgName, data);
        }

        pad(n, width, z) {
            z = z || '0';
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        }

        // https://semisignal.com/tag/ffmpeg-js/
        convertDataURIToBinary(dataURI) {
            var base64 = dataURI.replace(/^data[^,]+,/, '');
            var raw = window.atob(base64);
            var rawLength = raw.length;

            var array = new Uint8Array(new ArrayBuffer(rawLength));
            for (let i = 0; i < rawLength; i++) {
                array[i] = raw.charCodeAt(i);
            }
            return array;
        };

        //**blob to dataURL**
        blobToDataURL(blob, callback) {
            var a = new FileReader();
            a.onload = e => { callback(e.target.result); }
            a.readAsDataURL(blob);
        }

        finalizeVideo() {
            this.zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    // see FileSaver.js
                    saveAs(content, "images.zip");
                });
        }

        finalizeVideo1() {
            this.encoder.compile(false, output => this.done(output));
        }

        finalizeVideo2() {

            /*
            // Encode test video to VP8.
            const result = ffmpeg({
                MEMFS: this.MEMFS,
                arguments: ["-r", "20", "-i", "img%03d.jpeg", "-c:v", "libx264", "-crf", "1", "-vf", "scale=150:150", "-pix_fmt", "yuv420p", "-vb", "20M", "out.mp4"],
                // Write out.webm to disk.
            });

            const out = result.MEMFS[0];       

            let url = URL.createObjectURL(out);
            saveAs(url, 'download.mp4');
            */

            let messages = '';

            this.worker.onmessage = e => {
                var msg = e.data;
                switch (msg.type) {
                    case "stdout":
                    case "stderr":
                        messages += msg.data + "\n";
                        break;
                    case "exit":
                        console.log("Process exited with code " + msg.data);
                        //worker.terminate();
                        break;

                    case 'done':
                        const blob = new Blob([msg.data.MEMFS[0].data], {
                            type: "video/mp4"
                        });
                        this.done(blob)

                        break;
                }
                console.log(messages);
            };

            // https://trac.ffmpeg.org/wiki/Slideshow
            // https://semisignal.com/tag/ffmpeg-js/
            this.worker.postMessage({
                type: 'run',
                TOTAL_MEMORY: 268435456,
                //arguments: 'ffmpeg -framerate 24 -i img%03d.jpeg output.mp4'.split(' '),
                /*
                arguments: ["-r", "20", "-i", "img%03d.jpeg", 
                "-c:v", "libx264", 
                //"-preset", "slow", "-crf", "18",
                "-crf", "1", 
                "-vf", 
                //`scale=${this.width}:${this.height}`, 
                "scale=150:150", 
                //"-pix_fmt", "yuv420p", 
                "-pix_fmt", "yuv444p", 
                "-vb", "20M", 
                "out.mp4"],
                */
                arguments: [
                    "-framerate", "30", "-i", "img%03d.jpeg", "-c:v", "libx264", "-crf", "1", "-vf", "scale=512:512", "-pix_fmt", "yuv420p", "-vb", "20M", "out.mp4"],
                //arguments: '-r 60 -i img%03d.jpeg -c:v libx264 -crf 1 -vf -pix_fmt yuv420p -vb 20M out.mp4'.split(' '),
                MEMFS: this.MEMFS
            });
        }

        done(out) {
            //let url = URL.createObjectURL(out);
            saveAs(out, 'download.webm');
        }
    }
}