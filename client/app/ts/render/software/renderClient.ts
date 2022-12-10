module qec {
    export class renderClient
    {
        initDone = false;
        prepareRenderDone = false;
        renderDone = false;
        worker:Worker;

        onInitDone:()=>void
        onPrepareRenderDone:()=>void
        onRenderDone:()=>void;
        

        constructor(private name:string, private canvas:HTMLCanvasElement, private sharedRenderedData:Uint8ClampedArray)
        {
            var worker = new Worker("app/built/renderWorker.js");
            this.worker = worker;

            worker.onmessage = (evt) => {
                if (evt.data.type == renderWorkerInitDoneMessage.staticType)
                {
                    this.initDone = true;
                    // console.log(this.name + ' : initDone')
                    this.onInitDone();
                }
                else if (evt.data.type == renderWorkerPrepareRenderDoneMessage.staticType)
                {
                    this.onPrepareRenderDone();
                }
                else if (evt.data.type == renderWorkerRenderDoneMessage.staticType)
                {
                    var msg = <renderWorkerRenderDoneMessage> evt.data;
                    //console.log(this.name + ' : render done at line ' + msg.lineIndex);
                    
                    var ctx = this.canvas.getContext('2d');
                    this.sharedRenderedData.set(msg.imageData, msg.lineIndex*this.canvas.width*4);
                    
                    console.log('client finished ' + name);
                    this.renderDone = true;
                    this.onRenderDone();
                }
            };
        }

        init(rp:renderPixel, camera:camera, onInitDone:()=>void) 
        {
            this.initDone = false;
            this.onInitDone = onInitDone;
            // TODO broken
            var sd = (<sdFields> <any> rp.sd);
            var msgOut = new renderWorkerInitMessage();
            
            msgOut.topTexture = sd.topTexture;
            msgOut.topBounds = sd.topBounds;
            msgOut.profileTexture = sd.profileTexture; 
            msgOut.profileBounds = sd.profileBounds; 
            //msgOut.lightPos = rp.uLightPos;
            msgOut.canvasWidth = this.canvas.width; 
            msgOut.canvasHeight = this.canvas.height;
            msgOut.camera = camera;
            
            this.worker.postMessage(msgOut);
        }

        initDTO(sceneDTO:any, onInitDone:()=>void) 
        {
            this.initDone = false;
            this.onInitDone = onInitDone;
            
            var msgOut = new renderWorkerInitDTOMessage();
            
            msgOut.sceneDTO = sceneDTO;
            msgOut.canvasWidth = this.canvas.width; 
            msgOut.canvasHeight = this.canvas.height;
            
            this.worker.postMessage(msgOut);
        }

        camDTO = new cameraDTO();
        prepareRender(cam:camera, onPrepareRenderDone:()=>void)
        {   
            console.log('client prepare render ' + name);
                    
            this.prepareRenderDone = false;
            this.onPrepareRenderDone = onPrepareRenderDone;
            var msgOut = new renderWorkerPrepareRenderMessage();
            cam.toDTO(this.camDTO);
            msgOut.cam = this.camDTO;
            this.worker.postMessage(msgOut);
        }

        render(lineIndex:number, lineCount:number, onRenderDone:()=>void)
        {   
            console.log('client render ' + name);
                    
            this.renderDone = false;
            this.onRenderDone = onRenderDone;
            var msgOut = new renderWorkerRenderMessage();
            msgOut.lineIndex = lineIndex;
            msgOut.lineCount = lineCount;
            this.worker.postMessage(msgOut);
        }
    }
}