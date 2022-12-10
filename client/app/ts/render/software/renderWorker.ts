module qec {

    export class renderWorkerInitMessage
    {
        type = 'init';
        topTexture:any;
        topBounds:Float32Array;
        profileTexture:any; 
        profileBounds:Float32Array; 
        lightPos:Float32Array;
        canvasWidth:number; 
        canvasHeight:number;
        camera:any;
    }

    export class renderWorkerInitDTOMessage
    {
        type = 'initDTO';
        sceneDTO:any;
        canvasWidth:number; 
        canvasHeight:number;
    }

    export class renderWorkerInitDoneMessage
    {
        static staticType = 'initDone'; 
        type = 'initDone';
    }

    export class renderWorkerPrepareRenderMessage
    {
        static staticType = 'prepareRender'; 
        type = 'prepareRender';
        cam:cameraDTO;
    }


    export class renderWorkerPrepareRenderDoneMessage
    {
        static staticType = 'prepareRenderDone'; 
        type = 'prepareRenderDone';
    }

    export class renderWorkerRenderMessage
    {
        static staticType = 'render'; 
        type = 'render';
        lineIndex:number;
        lineCount:number;
    }

    export class renderWorkerRenderDoneMessage
    {
        static staticType = 'renderDone'; 
        type = 'renderDone';
        imageData:Uint8ClampedArray;
        lineIndex:number;
        lineCount:number;
    }

    export class renderWorker
    {
        camera = new camera();
        renderUnit = new renderUnit();
        renderPixel = new renderPixel();
        sd = new sdFields();

        postMessage : any;
        setPostMessageFunction(f:any)
        {
            this.postMessage = f;
        }
        onmessage(e:MessageEvent) {
            if (e.data == null || e.data.type == null || !this[e.data.type])
            {
                console.error('message non reconnu : ', e.data)
            }
            this[e.data.type](e.data);
        }

        init(message:renderWorkerInitMessage)
        {
            console.log('renderWorker init');
            
            this.populate(this.camera, message.camera);  
            
            var _topTexture = this.populate(new floatTexture(), message.topTexture);
            var _profileTexture = this.populate(new floatTexture(), message.profileTexture);
            var _light = new pointLight();
            vec3.copy(_light.position, message.lightPos);
            
            //this.sd.init(_topTexture, message.topBounds, _profileTexture, message.profileBounds);

            //this.renderPixel.init(this.sd, _light, false);
            this.renderUnit.setCanvasSize(message.canvasWidth, message.canvasHeight);

            var msg = new renderWorkerInitDoneMessage();
            this.postMessage(msg);
        }

        sc: scene;
        initDTO(message:renderWorkerInitDTOMessage)
        {
            console.log('renderWorker init DTO');
            this.renderUnit.setCanvasSize(message.canvasWidth, message.canvasHeight);

            this.sc = new scene();
            this.sc.setDebug(false);
            this.sc.create(message.sceneDTO, ()=>
            {
                var scrend = this.sc.get<scRenderer>(o=>o instanceof scRenderer, 'render');
                this.renderPixel = new renderPixel();
                this.renderPixel.updateShader(scrend.settings);
                this.camera = scrend.camera;

                console.log('renderWorker init DTO OK');
                var msg = new renderWorkerInitDoneMessage();
                this.postMessage(msg);        
            });
        }

        prepareRender(message:renderWorkerPrepareRenderMessage)
        {
            this.camera.createFrom(message.cam);

            console.log('renderWorker prepare render OK');
            var msg = new renderWorkerPrepareRenderDoneMessage();
            this.postMessage(msg);  
        }

        render(message:renderWorkerRenderMessage)
        {
            console.log('Worker rendering ' + message.lineIndex)
            this.renderUnit.renderLines(this.renderPixel, this.camera, message.lineIndex, message.lineCount);
            var msgOut = new renderWorkerRenderDoneMessage();
            msgOut.lineIndex = message.lineIndex;
            msgOut.lineCount = message.lineCount;
            msgOut.imageData = this.renderUnit.getImageData();
            console.log('Worker rendering OK ' + message.lineIndex)            
            this.postMessage(msgOut);
        }

        private populate<T>(object:T, json):T
        {
            for (var k in json)
            {
                object[k] = json[k];
            } 
            return object;
        }

    }
}