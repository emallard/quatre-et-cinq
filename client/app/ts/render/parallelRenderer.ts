module qec {
/*
    export class parallelRenderDTO
    {
        clientCount = 10;
        lineCount = 50;
    }
*/
    export class parallelRenderer
    {
        canvas:HTMLCanvasElement;
        sharedRenderedData:Uint8ClampedArray;
        clients:renderClient[] = [];
        clientCount:number;
        lineCount:number;

        private lineIndex:number;
        

        setContainerAndSize(element:HTMLElement, rWidth:number, rHeight:number)
        {
            var canvas = document.createElement('canvas');
            this.canvas = canvas;
            canvas.width  = rWidth;
            canvas.height = rHeight;
            canvas.style.border   = "1px solid";
            element.appendChild(canvas);

            this.sharedRenderedData = new Uint8ClampedArray(canvas.width* canvas.height * 4);

            this.clientCount = 4;
            this.lineCount = rHeight/this.clientCount;

            for (var i=0; i<this.clientCount; ++i)
            {
                var w = new renderClient('#'+i, this.canvas, this.sharedRenderedData);
                this.clients.push(w);
            }
        }
/*
        render(rp:renderPixel, camera:camera)
        {   
            for (var i=0; i<this.clients.length; ++i)
            {
                this.clients[i].init(rp, camera, ()=>this.initDone(rp, camera));
            }
        }
*/
        initDTO(sceneDTO:any, done:()=>void)
        {
            var run = new runAll();
            for (var i=0; i<this.clients.length; ++i)
            {
                run.push(this.initDTOAt(this.clients[i], sceneDTO));
            }
            run.run(done);
        }

        initDTOAt(client:renderClient, sceneDTO:any) : ( d:()=>void )=>void
        {
            return (done => client.initDTO(sceneDTO, done));
        }

        onRenderDone : ()=>void;
        render(cam:camera, done:()=>void)
        {
            this.onRenderDone = done;
            var run = new runAll();
            // update clients with new cam
            for (var i=0; i<this.clients.length; ++i)
            {
                run.push(this.prepareRender(this.clients[i], cam));
            }
            run.run(()=>this.render2())
        }

        render2() 
        {
            console.log('render2');
            /*
            var ctx = this.canvas.getContext('2d');
            ctx.fillStyle = "green";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            */
            this.lineIndex = 0;
            for (var i=0; i<this.clients.length; ++i)
            {
                this.nextRender(this.clients[i]);
            }                
        }

        prepareRender(client:renderClient, cam:camera) : ( d:()=>void )=>void
        {
            return (done => client.prepareRender(cam, done));
        }

        nextRender(client:renderClient)
        {
            if (this.lineIndex < this.canvas.height)
            {
                client.render(this.lineIndex, this.lineCount, () => this.nextRender(client));
                this.lineIndex += this.lineCount;
            }
            else 
            {
                // wait for all render to finish
                for (var i=0; i<this.clients.length; ++i)
                {
                    if (!this.clients[i].renderDone)
                    {
                        return;
                    }
                }
                
                var ctx = this.canvas.getContext('2d');
                var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                imageData.data.set(this.sharedRenderedData);
                ctx.putImageData(imageData, 0,0,0,0,this.canvas.width,this.canvas.height);

                this.onRenderDone();
            }
        }
    }
}
