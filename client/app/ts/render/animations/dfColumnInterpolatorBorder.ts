module qec {

    export class dfColumnInterpolatorBorder {

        columns: number[];
        df0: distanceFieldCanvas;
        df1: distanceFieldCanvas;
        df: distanceFieldCanvas;

        margin = 2;
        debugInfoInCanvas = false;
        debugCanvas: HTMLCanvasElement;

        start(src0: string, bounds0: number[], src1: string, bounds1: number[], done: () => void): void {

            this.df0 = new distanceFieldCanvas();
            this.df1 = new distanceFieldCanvas();
            this.df = new distanceFieldCanvas();

            if (this.debugInfoInCanvas) {
                this.debugCanvas = document.createElement('canvas');
                document.body.append(this.debugCanvas);
            }
            this.df0.drawSrcForBorder(src0, new Float32Array(bounds0), this.margin,
                () => {
                    this.df.drawSrcForBorder(src0, new Float32Array(bounds0), this.margin,
                        () => {
                            this.df1.drawSrcForBorder(src1, new Float32Array(bounds1), this.margin,
                                () => {
                                    this.createSegments();
                                    done();
                                });
                        });
                });

        }

        createSegments(): void {
            this.columns = [];

            let w = this.df1.canvas.width;
            let h = this.df1.canvas.height;
            let ctx0 = this.df0.canvas.getContext('2d');
            let ctx1 = this.df1.canvas.getContext('2d');
            let data0 = ctx0.getImageData(0, 0, w, h);
            let data1 = ctx1.getImageData(0, 0, w, h);

            for (let i = 0; i < w; i++) {
                let s0 = this.getStart(data0, i);
                let s1 = this.getStart(data1, i);

                this.columns.push(s0, s1);
            }
        }

        getStart(data: ImageData, i: number): number {
            for (let j = 0; j < data.height; j++) {
                let q = (data.width * j + i) * 4;
                let alpha = data.data[q + 3];
                if (alpha > 0)
                    return j;
            }
            return -1;
        }


        update(r: number): void {

            let ctx = this.df.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.df.canvas.width, this.df.canvas.height);

            let imageData = ctx.getImageData(0, 0, this.df.canvas.width, this.df.canvas.height);
            let data = imageData.data;

            for (let i = 0; i < imageData.width; i++) {


                let s0 = this.columns[2 * i + 0];
                let s1 = this.columns[2 * i + 1];

                if (s0 != -1 && s1 != -1) {
                    let s = Math.floor(mix(s0, s1, r));
                    for (let j = s; j < imageData.height; ++j) {
                        let q = (j * imageData.width + i) * 4;
                        data[q + 0] = 0;
                        data[q + 1] = 0;
                        data[q + 2] = 0;
                        data[q + 3] = 255;
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);

            this.df.computeDistanceFromCanvas(this.df.distanceField.halfSize[0], this.df.distanceField.halfSize[1]);
            this.df.update();

            if (this.debugInfoInCanvas)
                this.df.debugInfoInExistingCanvas(this.debugCanvas);
        }
    }
}