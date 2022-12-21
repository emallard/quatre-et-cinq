module qec {
    export class simpleRenderer implements irenderer
    {
        canvas:HTMLCanvasElement;
        renderUnit = new renderUnit();
        rp:irenderPixel = new renderPixel();
        shadows = false;

        setContainerAndSize(element:HTMLElement, rWidth:number, rHeight:number)
        {
            var canvas = document.createElement('canvas');
            this.canvas = canvas;
            canvas.width  = rWidth;
            canvas.height = rHeight;
            element.appendChild(canvas);

            this.renderUnit.setCanvasSize(canvas.width, canvas.height);    
        }

        getViewportWidth():number {
            return this.canvas.width;
        }

        getViewportHeight():number {
            return this.canvas.height;
        }

        getCanvas():HTMLCanvasElement
        {
            return this.canvas;
        }

        setRenderSteps(renderStep:boolean)
        {
            this.rp = renderStep ? new renderPixelStepCount() : new renderPixel();
        }

        showBoundingBox(b:boolean)
        {
            if (this.rp instanceof renderPixel)
                (<renderPixel> this.rp).showBoundingBox = b;
        }

        renderDebug(x:number, y:number, settings: renderSettings)
        {
            //this.rp.init(settings);
            this.renderUnit.renderDebug(x, y, this.rp, settings.camera);
        }

        render(settings: renderSettings)
        {
            //this.rp.init(settings);

            this.renderLines(settings.camera, 0);

            /*
            this.renderUnit.render(this.rp, settings.camera);

            var w = this.canvas.width;
            var h = this.canvas.height;
            
            var ctx = this.canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, w, h);
            imageData.data.set(this.renderUnit.getImageData());
            ctx.putImageData(imageData, 0,0,0,0,this.canvas.width,this.canvas.height);
            */
        }

        renderLines(cam:camera, lineIndex:number)
        {
            //console.log(lineIndex);
            let lineCount = 10;
            var h = this.canvas.height;
            this.renderUnit.renderLines(this.rp, cam, lineIndex, Math.min(lineCount, h-lineIndex));

            var w = this.canvas.width;
            var ctx = this.canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, w, h);
            imageData.data.set(this.renderUnit.getImageData(), 4*w*lineIndex);
            ctx.putImageData(imageData, 0,0,0,0,this.canvas.width,this.canvas.height);

            if (lineIndex < h)
            {
                setTimeout(() => this.renderLines(cam, lineIndex+lineCount), 0);
            }
        }


        updateShader(settings: renderSettings) {
            this.rp.updateShader(settings);
        }


        updateAllUniformsForAll() {}
        updateAllUniforms(sd: signedDistance) {}
        updateDiffuse(sd: signedDistance) {}
        updateTransform(sd: signedDistance) {}
        updateFloatTextures(sd: sdFields) {}
        updateAllPackedTextures(packer:texturePacker){}
    }
}