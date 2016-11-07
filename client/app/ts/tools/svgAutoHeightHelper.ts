module qec
{
    export class svgAutoHeightHelper
    {
        svgHelper = new svgHelper();
        stack:Uint8ClampedArray;
        valueForIds : { [id: string] : number } = {};
        indexInIds = 0;

        setSvg(content:string, done:()=>void)
        {
            this.svgHelper.setSvg(content, ()=>{
                this.indexInIds = 0;
                this.stack = null;
                this.nextDraw(done);
            });
        }


        nextDraw(done:()=>void)
        {
            var ids = this.svgHelper.elementsId;
            if (this.indexInIds < ids.length)
            {
                this.draw(ids[this.indexInIds], ()=>
                {
                    this.indexInIds++;
                    this.nextDraw(done);
                });
            }
            else
            {
                done();
            }
        }

        draw(id:string, done:()=>void)
        {
            this.svgHelper.drawOnly(id, () =>
            {
                if (this.stack == null)
                {
                    this.stack = new Uint8ClampedArray(this.svgHelper.canvas.width * this.svgHelper.canvas.height);
                    this.stack.fill(0, 0,this.stack.length);
                }
                
                var c = this.svgHelper.canvas;
                var ctxId = c.getContext('2d');

                var imageDataId = ctxId.getImageData(0,0,c.width, c.height);
                var max = 0;

                // find maxValue under visible pixels
                for (var q = 0 ; q < this.stack.length; q++)
                {
                    var stackValue = this.stack[q];
         
                    if (imageDataId.data[4*q+3] > 0 &&
                          (imageDataId.data[4*q] != 255
                        || imageDataId.data[4*q+1] != 255
                        || imageDataId.data[4*q+2] != 255))
                        {
                            max = Math.max(max, stackValue);
                        }
                    
                }

                var valueForId = max + 1;
                this.valueForIds[id] = valueForId;
                console.log('autoHeight for ' + id + ' = ' + valueForId);

                for (var q = 0 ; q < this.stack.length; q++)
                {
                    if (imageDataId.data[4*q+3] > 0 &&
                          (imageDataId.data[4*q] != 255
                        || imageDataId.data[4*q+1] != 255
                        || imageDataId.data[4*q+2] != 255))
                         {
                             this.stack[q] = valueForId;
                        }
                }
                done();
            });
        }
    }
}