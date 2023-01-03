module qec {

    export class dfColumnInterpolator {

        columns: number[];
        df0: distanceFieldCanvas;
        df1: distanceFieldCanvas;
        df: distanceFieldCanvas;

        margin = 2;
        debugInfoInCanvas = true;
        debugCanvas: HTMLCanvasElement;

        isBorder = true;
        start(src0: string, bounds0: number[], src1: string, bounds1: number[], done: () => void): void {

            this.df0 = new distanceFieldCanvas();
            this.df1 = new distanceFieldCanvas();
            this.df = new distanceFieldCanvas();

            if (this.debugInfoInCanvas) {
                this.debugCanvas = document.createElement('canvas');
                document.body.append(this.debugCanvas);
            }

            if (!this.isBorder) {
                this.df0.drawSrcForTop(src0, new Float32Array(bounds0), this.margin,
                    () => {
                        this.df.drawSrcForTop(src0, new Float32Array(bounds0), this.margin,
                            () => {
                                this.df1.drawSrcForTop(src1, new Float32Array(bounds1), this.margin,
                                    () => {
                                        this.createSegments();
                                        this.update(0);
                                        done();
                                    });
                            });
                    });
            }
            else {
                this.df0.drawSrcForBorder(src0, new Float32Array(bounds0), this.margin,
                    () => {
                        this.df.drawSrcForBorder(src0, new Float32Array(bounds0), this.margin,
                            () => {
                                this.df1.drawSrcForBorder(src1, new Float32Array(bounds1), this.margin,
                                    () => {
                                        this.createSegments();
                                        this.update(0);
                                        done();
                                    });
                            });
                    });
            }
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
                let [s0, e0] = this.getColumnSegment(data0, i);
                let [s1, e1] = this.getColumnSegment(data1, i);

                let m0 = (e0 + s0) / 2;
                let m1 = (e1 + s1) / 2;

                this.columns.push(m0, m0 - s0, m1, m1 - s1);
            }
        }

        getColumnSegment(data: ImageData, i: number): [number, number] {
            let start = -1;
            let end = -1;
            for (let j = 0; j < data.height; j++) {
                let q = (data.width * j + i) * 4;
                let alpha = data.data[q + 3];
                if (alpha > 0 && start == -1)
                    start = j;
                if (alpha == 0 && start != -1) {
                    end = j;
                    break;
                }
            }
            if (start != -1 && end == -1)
                end = data.height - 1;
            return [start, end];
        }


        update(r: number): void {

            let ctx = this.df.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.df.canvas.width, this.df.canvas.height);

            let imageData = ctx.getImageData(0, 0, this.df.canvas.width, this.df.canvas.height);
            let data = imageData.data;

            for (let i = 0; i < imageData.width; i++) {
                let m0 = this.columns[4 * i + 0];
                let h0 = this.columns[4 * i + 1];
                let m1 = this.columns[4 * i + 2];
                let h1 = this.columns[4 * i + 3];

                if (m0 == -1)
                    continue;

                let m = mix(m0, m1, r);
                let h = mix(h0, h1, r);
                for (let j = Math.floor(m - h); j < Math.ceil(m + h); ++j) {
                    let q = (j * imageData.width + i) * 4;
                    data[q + 0] = 0;
                    data[q + 1] = 0;
                    data[q + 2] = 0;
                    data[q + 3] = 255;
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