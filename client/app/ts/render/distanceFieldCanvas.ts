module qec {
    export class distanceFieldCanvas
    {

        canvas:HTMLCanvasElement;
        distanceField:distanceField;
        srcLoaded = false;

        floatTexture = new floatTexture();
        totalBounds = vec4.create();

        optimizedBounds = vec4.create();

        constructor()
        {
            this.canvas = document.createElement('canvas');
        }

        private initCommon(fieldSize:number, bounds:Float32Array)
        {
            this.canvas.width = fieldSize;
            this.canvas.height = fieldSize;

            this.distanceField = new distanceField();
        }

        initDisc(fieldSize:number, radius:number, halfWidth:number, halfHeight:number)
        {
            this.initCommon(fieldSize, vec4.fromValues(-halfWidth, -halfHeight, halfWidth, halfHeight));
            this.distanceField.initDisc(fieldSize, radius, halfWidth, halfHeight);
            this.updateFloatTexture();
        }

        initSquare(fieldSize:number, squareHalfSize:number, halfWidth:number, halfHeight:number)
        {
            this.initCommon(fieldSize, vec4.fromValues(-halfWidth, -halfHeight, halfWidth, halfHeight));
            this.distanceField.initSquare(fieldSize, squareHalfSize, halfWidth, halfHeight);
            this.updateFloatTexture();
        }

        drawUserCanvasForTop(img:HTMLCanvasElement | HTMLImageElement, _bounds:Float32Array, margin:number)
        {
            this.drawUserCanvasBase(img, _bounds, margin, false);
        }

        drawUserCanvasForProfile(img:HTMLCanvasElement | HTMLImageElement, _bounds:Float32Array, margin:number)
        {
            this.drawUserCanvasBase(img, _bounds, margin, true);
        }

        private drawUserCanvasBase(img:HTMLCanvasElement | HTMLImageElement, _bounds:Float32Array, margin:number, profile:boolean)
        {
            this.totalBounds = vec4.fromValues(_bounds[0] - margin, _bounds[1]-margin, _bounds[2]+margin, _bounds[3]+margin);
            
            var boundW = _bounds[2] - _bounds[0];
            var boundH = _bounds[3] - _bounds[1];
            
            var totalBoundW = this.totalBounds[2] - this.totalBounds[0];
            var totalBoundH = this.totalBounds[3] - this.totalBounds[1];
            
            var dfWidth = 400;
            var dfHeight = 400;

            if (totalBoundH > totalBoundW)
                dfWidth = Math.round(dfHeight * (totalBoundW/totalBoundH));
            else
                dfHeight = Math.round(dfWidth * (totalBoundH/totalBoundW));

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
            */

            this.canvas.width = dfWidth;
            this.canvas.height = dfHeight;

            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, newImgWidth, newImgHeight);

            // draw left margin if profile
            if (profile)
                ctx.drawImage(img, 0, 0, 1, img.height, 0, offsetY, offsetX, newImgHeight);
            
            if (this.distanceField == null)
            {
                this.distanceField = new distanceField();
            }
            var df = this.distanceField;
            df.initCommon(dfWidth, dfHeight , 1 , 1);

            var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            df.initFromImageData(imageData.data, this.canvas.width, this.canvas.height, 0.5*boundW, 0.5*boundH);
            df.setSignFromImageData(imageData.data, this.canvas.width, this.canvas.height);

        }
/*
        private drawUserCanvasBaseOld(img:HTMLCanvasElement | HTMLImageElement, margin:number, profile:boolean)
        {
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // compute draw size so that it fits the canvas distance field

            var margin = 100;
            
            var drawHeight = this.canvas.height - margin;
            var drawWidth = this.canvas.width - margin;
            var scaleHeight = img.height / drawHeight;
            var scaleWidth = img.width / drawWidth;

            var scale = Math.max(scaleHeight, scaleWidth);
            
            var newImgHeight = img.height / scale; 
            var newImgWidth = img.width / scale; 
            var offsetY = (this.canvas.height - newImgHeight) / 2;
            var offsetX = (this.canvas.width - newImgWidth) / 2;

            ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, newImgWidth, newImgHeight);

            var pixelSize = newImgWidth / (this.boundsSetByUser[2] - this.boundsSetByUser[0]);
            //var pixelSize = newImgHeight / (this.boundsSetByUser[3] - this.boundsSetByUser[1]);
            
            // update halfSize
            this.bounds[0] = this.boundsSetByUser[0] - margin/2 * pixelSize;
            this.bounds[1] = this.boundsSetByUser[1] - margin/2 * pixelSize;
            this.bounds[2] = this.boundsSetByUser[2] + margin/2 * pixelSize;
            this.bounds[3] = this.boundsSetByUser[3] + margin/2 * pixelSize;
            
            //this.halfSize[0] = this.halfSizeSetByUser[0] / newImgWidth * this.canvas.width;
            //this.halfSize[1] = this.halfSizeSetByUser[1] / newImgHeight * this.canvas.height;

            // update bounding box
            this.optimizedBounds[0] = this.bounds[0] + offsetX * pixelSize;
            this.optimizedBounds[1] = this.bounds[1] + offsetY * pixelSize;
            this.optimizedBounds[2] = this.bounds[2] - offsetX * pixelSize;
            this.optimizedBounds[3] = this.bounds[3] - offsetY * pixelSize;

            //this.boundingHalf[0] = (newImgWidth / this.canvas.width) * this.halfSize[0];
            //this.boundingHalf[1] = (newImgHeight / this.canvas.height) * this.halfSize[1];
            
            /*
            console.log(this.canvas.width + ',' + this.canvas.height);
            console.log(img.width + ',' + img.height);
            console.log(vec2.str(this.halfSizeSetByUser));
            console.log(vec2.str(this.boundingHalf));*/

            /*
            if (profile)
            {
                for (var i=0; i<offsetX; ++i)
                {

                }
            }*/
        //}

        update()
        {
            this.updateFloatTexture();
        }

        private updateFloatTexture()
        {
            var texture = this.floatTexture;
            var df = this.distanceField;
            if (texture.width*texture.height != df.M*df.N)
            {
                texture.data = new Float32Array(df.M * df.N * 4);
            }
            texture.width = df.M;
            texture.height = df.N;
            for (var q=0; q < texture.width*texture.height; q++)
            {
                var d = df.D[q];
                texture.data[4*q + 0] = d;
                texture.data[4*q + 1] = d;
                texture.data[4*q + 2] = d; 
                texture.data[4*q + 3] = d;
            }
        }


        computeDistanceFieldFromSrcs(src1:string, halfWidth:number, halfHeight:number, callback:()=>void)
        {
            console.log('dfCanvas : ' + src1);
            this.srcLoaded = false;
            this.loadImg(src1, (img1)=>
            {
                this.computeDistanceField(img1, halfWidth, halfHeight);
                this.srcLoaded = true;
                callback();
            });
        }

        computeDistanceField(img1:HTMLImageElement, halfWidth:number, halfHeight:number)
        {

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


        private loadImg(src1:string, callback:(img1:HTMLImageElement)=>void)
        {
            var img = new Image();
            img.onload = function() { callback(img) };
            img.src = src1;
        }

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

        public debugInfoInCanvas()
        {
            var ctx = this.canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.distanceField.fillImageData(imageData.data, 2550);
            ctx.putImageData(imageData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
        }

    }
}