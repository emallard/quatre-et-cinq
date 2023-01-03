module qec {

    export class profileUpdater extends updaterBase {
        sd: sdFields2;

        dto0: partProfileDTO;
        dto1: partProfileDTO;

        df0: distanceFieldCanvas;
        df1: distanceFieldCanvas;
        df: distanceFieldCanvas;

        constructor(
            sd: sdFields2,
            dto0: partProfileDTO,
            dto1: partProfileDTO
        ) {
            super();
            this.sd = sd;
            this.dto0 = dto0;
            this.dto1 = dto1;
            if (this.dto0 == null || this.dto0.profileSrc == null || this.dto0.profileBounds == null)
                throw new Error('wrong dto0 type');
            if (this.dto1 == null || this.dto1.profileSrc == null || this.dto1.profileBounds == null)
                throw new Error('wrong dto1 type');
            if (!(this.sd instanceof sdFields2))
                throw new Error('wrong sd type');
        }

        margin = 2;
        debugInfoInCanvas = true;
        debugCanvas: HTMLCanvasElement;

        override start(done: () => void): void {

            this.df0 = new distanceFieldCanvas();
            this.df1 = new distanceFieldCanvas();
            this.df = new distanceFieldCanvas();

            if (this.debugInfoInCanvas) {
                this.debugCanvas = document.createElement('canvas');
                document.body.append(this.debugCanvas);
            }

            this.df0.drawSrcForTop(this.dto0.profileSrc, new Float32Array(this.dto0.profileBounds), this.margin,
                () => {
                    this.df.drawSrcForTop(this.dto0.profileSrc, new Float32Array(this.dto0.profileBounds), this.margin,
                        () => {
                            this.df1.drawSrcForTop(this.dto1.profileSrc, new Float32Array(this.dto1.profileBounds), this.margin,
                                () => {
                                    this.createSegments();
                                    done();
                                });
                        });
                });
            //}
            //else {
            //    let swap = this.df0;
            //    this.df0 = this.df1;
            //    this.df1 = swap;
            //    this.start2(done);
            //}
        }

        columns: number[];

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
            return [start, end];
        }


        override update(t: number): void {

            let r = (t - this.t0) / (this.t1 - this.t0);

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
            this.sd.profile.profileTexture = this.df.floatTexture;
            this.sd.profile.profileTextureUpdated = true;

            if (this.debugInfoInCanvas)
                this.df.debugInfoInExistingCanvas(this.debugCanvas);
        }

        override stop(): void {
            if (this.df0 != null && this.df1 != null)
                this.df.floatTexture = this.df1.floatTexture;
        }
    }

}