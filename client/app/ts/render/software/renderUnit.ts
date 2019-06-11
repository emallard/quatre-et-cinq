module qec {
export class renderUnit 
{
    private width:number;
    private height:number;
    private ro = vec3.create();
    private rd = vec3.create();
    private imageData: Uint8ClampedArray;

    getImageData():Uint8ClampedArray
    {
        return this.imageData;
    }

    setCanvasSize(width:number, height:number)
    {
        this.width = width;
        this.height = height;
        
    }
    
    renderDebug(x:number, y:number,rp:irenderPixel,camera:camera)
    {
        camera.rendererInit(this.width, this.height);   
        camera.getRay(x, y, this.ro, this.rd);
        rp.render(this.ro, this.rd, true);
    }


    render(rp:irenderPixel, camera:camera)
    {   
        this.renderLines(rp,camera, 0, this.height);
    }

    renderLines(rp:irenderPixel, camera:camera, lineIndex:number, lineCount:number)
    {
        //var color = vec4.set(vec4.create(),0,0,1,1); 

        if (this.imageData == null || this.imageData.length != 4*this.width*lineCount)
            this.imageData = new Uint8ClampedArray(4*this.width*lineCount);

        camera.rendererInit(this.width, this.height);
        
        for (var j=0; j<lineCount; ++j)
        {
            for (var i=0; i<this.width; i++)
            {
                camera.getRay(i, j+lineIndex, this.ro, this.rd);
        
                var color = rp.render(this.ro, this.rd, false);
                var q = 4*(j*this.width + i);
                this.imageData[q + 0] = 255*color[0];
                this.imageData[q + 1] = 255*color[1];
                this.imageData[q + 2] = 255*color[2];
                this.imageData[q + 3] = 255*color[3];
            }
        }        
    }
    
}
}