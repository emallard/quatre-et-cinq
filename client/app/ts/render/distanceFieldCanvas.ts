module qec {
    export class distanceFieldCanvas {

        canvas: HTMLCanvasElement;
        distanceField: distanceField;
        srcLoaded = false;

        floatTexture = new floatTexture();
        totalBounds = vec4.create();

        optimizedBounds = vec4.create();

        dfMaxWidth = 800;
        dfMaxHeight = 800;

        constructor() {
            this.canvas = document.createElement('canvas');
        }

        setDistanceFieldMaxSize(maxWidth: number, maxHeight: number) {
            this.dfMaxWidth = maxWidth;
            this.dfMaxHeight = maxHeight;
        }

        private initCommon(fieldSize: number, bounds: Float32Array) {
            this.canvas.width = fieldSize;
            this.canvas.height = fieldSize;

            this.distanceField = new distanceField();
        }

        initDisc(fieldSize: number, radius: number, halfWidth: number, halfHeight: number) {
            this.initCommon(fieldSize, vec4.fromValues(-halfWidth, -halfHeight, halfWidth, halfHeight));
            this.distanceField.initDisc(fieldSize, radius, halfWidth, halfHeight);
            this.updateFloatTexture();
        }

        initSquare(fieldSize: number, squareHalfSize: number, halfWidth: number, halfHeight: number) {
            this.initCommon(fieldSize, vec4.fromValues(-halfWidth, -halfHeight, halfWidth, halfHeight));
            this.distanceField.initSquare(fieldSize, squareHalfSize, halfWidth, halfHeight);
            this.updateFloatTexture();
        }

        updateFromInterpolation(df0: distanceFieldCanvas, df1: distanceFieldCanvas, r: number) {
            let d0 = df0.distanceField.D;
            let d1 = df1.distanceField.D;

            let w = this.canvas.width;
            let h = this.canvas.height;

            let ctx = this.canvas.getContext('2d');
            let imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            //ctx.clearRect(0, 0, w, h);

            console.log('updateFromInterpolation ' + r + ' ' + df0.distanceField.D.length);
            for (let q = 0; q < df0.distanceField.D.length; ++q) {

                let interpolated = d0[q] * (1 - r) + d1[q] * r;
                let alpha = interpolated < 0 ? 255 : 0;

                imageData.data[q * 4] = 0;
                imageData.data[q * 4 + 1] = 0;
                imageData.data[q * 4 + 2] = 0;
                imageData.data[q * 4 + 3] = alpha;
            }
            ctx.putImageData(imageData, 0, 0, 0, 0, w, h);

            this.computeDistanceFromCanvas(df0.distanceField.halfSize[0], df0.distanceField.halfSize[1]);
        }

        drawSrcForTop(src: string, bounds: Float32Array, margin: number, done: () => void) {
            // load image
            let img = new Image();
            img.onload = () => {
                this.drawUserCanvasForTop(img, bounds, margin);
                done();

            };
            img.src = src;
        }

        drawSrcForBorder(src: string, bounds: Float32Array, margin: number, done: () => void) {
            // load image
            let img = new Image();
            img.onload = () => {
                this.drawUserCanvasForBorder(img, bounds, margin);
                done();

            };
            img.src = src;
        }

        drawUserCanvasForTop(img: HTMLCanvasElement | HTMLImageElement, _bounds: Float32Array, margin: number) {
            this.drawUserCanvasBase(img, _bounds, margin, false, distanceFieldBorderType.all);
        }

        drawUserCanvasForProfileTop(img: HTMLCanvasElement | HTMLImageElement, _bounds: Float32Array, margin: number) {
            this.drawUserCanvasBase(img, _bounds, margin, false, distanceFieldBorderType.top);
        }

        drawUserCanvasForProfileBottom(img: HTMLCanvasElement | HTMLImageElement, _bounds: Float32Array, margin: number) {
            this.drawUserCanvasBase(img, _bounds, margin, false, distanceFieldBorderType.bottom);
        }

        drawUserCanvasForBorder(img: HTMLCanvasElement | HTMLImageElement, _bounds: Float32Array, margin: number) {
            this.drawUserCanvasBase(img, _bounds, margin, true, distanceFieldBorderType.all);
        }

        private drawUserCanvasBase(img: HTMLCanvasElement | HTMLImageElement, _bounds: Float32Array, margin: number, border: boolean, borderType: distanceFieldBorderType) {
            this.totalBounds = vec4.fromValues(_bounds[0] - margin, _bounds[1] - margin, _bounds[2] + margin, _bounds[3] + margin);

            var boundW = _bounds[2] - _bounds[0];
            var boundH = _bounds[3] - _bounds[1];

            var totalBoundW = this.totalBounds[2] - this.totalBounds[0];
            var totalBoundH = this.totalBounds[3] - this.totalBounds[1];

            var dfWidth = this.dfMaxWidth;
            var dfHeight = this.dfMaxHeight;

            if (totalBoundH > totalBoundW)
                dfWidth = Math.round(dfHeight * (totalBoundW / totalBoundH));
            else
                dfHeight = Math.round(dfWidth * (totalBoundH / totalBoundW));

            var newImgWidth = dfWidth * (boundW / totalBoundW);
            var newImgHeight = dfHeight * (boundH / totalBoundH);


            var offsetX = (dfWidth - newImgWidth) / 2;
            var offsetY = (dfHeight - newImgHeight) / 2;

            /*
            console.log('bounds : ' + vec4.str(_bounds));
            console.log('totalBounds : ' + vec4.str(this.totalBounds));
            console.log('dfWidth : ' + dfWidth);
            console.log('dfHeight : ' + dfHeight);
            console.log('offsetX : ' + offsetX);
            console.log('offsetY : ' + offsetY);
            console.log('img.width : ' + img.width);
            console.log('img.height : ' + img.height);
            */
            this.canvas.width = dfWidth;
            this.canvas.height = dfHeight;

            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, dfWidth, dfHeight);

            ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, newImgWidth, newImgHeight);

            // draw left margin if profile
            /*
            if (profile)
            {
                ctx.drawImage(img, 0, 0, 1, img.height, 0, offsetY, offsetX, newImgHeight);
            }
            */
            if (border) {
                let fillGap = 2;
                // draw left margin if profile
                ctx.drawImage(img, 0, 0, 1, img.height, 0, offsetY - fillGap, offsetX, newImgHeight + fillGap);

                // draw bottom margin if profile
                let take2ndRow = 1;
                ctx.drawImage(img, 0, img.height - 1 - take2ndRow, img.width, 1, offsetX, dfHeight - offsetY - fillGap, newImgWidth, offsetY + fillGap * 2);

                // draw bottom left
                ctx.drawImage(img, 0, img.height - 1 - take2ndRow, 1, 1, 0, dfHeight - offsetY - fillGap, offsetX, offsetY + fillGap * 2);
            }

            if (this.distanceField == null) {
                this.distanceField = new distanceField();
                this.distanceField.setBorderType(borderType);
            }

            this.computeDistanceFromCanvas(0.5 * totalBoundW, 0.5 * totalBoundH);
        }

        computeDistanceFromCanvas(halfWidth: number, halfHeight: number) {
            var ctx = this.canvas.getContext('2d');
            var df = this.distanceField;
            var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            df.initFromImageData(imageData.data, this.canvas.width, this.canvas.height, halfWidth, halfHeight);
            df.setSignFromImageData(imageData.data, this.canvas.width, this.canvas.height);
        }


        update() {
            this.updateFloatTexture();
        }

        private updateFloatTexture() {
            var texture = this.floatTexture;
            var df = this.distanceField;
            if (texture.width * texture.height != df.M * df.N) {
                texture.data = new Float32Array(df.M * df.N * 4);
            }
            texture.width = df.M;
            texture.height = df.N;
            for (var q = 0; q < texture.width * texture.height; q++) {
                var d = df.D[q];
                texture.data[4 * q + 0] = d;
                texture.data[4 * q + 1] = d;
                texture.data[4 * q + 2] = d;
                texture.data[4 * q + 3] = d;
            }
        }


        computeDistanceFieldFromSrcs(src1: string, halfWidth: number, halfHeight: number, callback: () => void) {
            console.log('dfCanvas : ' + src1);
            this.srcLoaded = false;
            this.loadImg(src1, (img1) => {
                this.computeDistanceField(img1, halfWidth, halfHeight);
                this.srcLoaded = true;
                callback();
            });
        }

        computeDistanceField(img1: HTMLImageElement, halfWidth: number, halfHeight: number) {

            this.initCommon(img1.width, null);
            this.drawUserCanvasForTop(img1, new Float32Array([-halfWidth, -halfHeight, halfWidth, halfHeight]), 0.01);
            /*
                        var width = img1.width;
                        var height = img1.height;
                        this.canvas.width = width;
                        this.canvas.height = height;
            
                        this.distanceField = new distanceField();
                        var df = this.distanceField;
                        var ctx = this.canvas.getContext('2d');
            
                        ctx.clearRect(0,0,width,height);
                        ctx.drawImage(img1, 0, 0, img1.width, img1.height);
                        var imageData = ctx.getImageData(0, 0, width, height);
                        df.initFromImageData(imageData.data, width, height, halfWidth, halfHeight);
            
                        //df.fillImageData(imageData.data);
                        //ctx.putImageData(imageData,0,0);
            
                        ctx.clearRect(0,0,width,height);
                        ctx.drawImage(img1, 0, 0, img1.width, img1.height);
                        imageData = ctx.getImageData(0, 0, width,height);
                        df.setSignFromImageData(imageData.data, width, height);
            
                        //df.fillImageData(imageData.data, 50000);
                        //ctx.putImageData(imageData,0,0);
                        */
        }


        private loadImg(src1: string, callback: (img1: HTMLImageElement) => void) {
            var img = new Image();
            img.onload = function () { callback(img) };
            img.src = src1;
        }
        /*
                private loadImgs(src1:string, src2:string, callback:(img1:HTMLImageElement, img2:HTMLImageElement)=>void)
                {
                    var img = new Image();
                    img.onload = function()
                    {
                        var img2 = new Image();
                        img2.onload = function()
                        {
                            callback(img, img2);
                        }
                        img2.src = src2;
                    }
                    img.src = src1;
                }
        */

        debugScale = 255;
        public debugInfoInExistingCanvas(canvas: HTMLCanvasElement) {
            canvas.width = this.canvas.width;
            canvas.height = this.canvas.height;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.distanceField.fillImageData(imageData.data, this.debugScale);
            ctx.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
        }

        public debugInfoInCanvas() {
            var ctx = this.canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.distanceField.fillImageData(imageData.data, this.debugScale);
            ctx.putImageData(imageData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
        }

    }
}