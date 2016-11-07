module qec {
    export class index2
    {
        sceneDTO: any;
        sc:scene;
        element:HTMLElement;
        renderer:irenderer;
        rendererParallel:parallelRenderer;
        /*
        sd:signedDistance;
        light:spotLight;
        cam: camera;
        */
        isParallel = false;
        isHardware = false;
        renderSteps = false;

        renderSettings = new renderSettings();

        start(element:HTMLElement)
        {
            var select = document.createElement('select');
            var option0 = document.createElement('option');
                option0.value = "";
                option0.text = "<select>";
                select.appendChild(option0);

            var examples = getExamples();
            for(var i in examples)
            {
                var option = document.createElement('option');
                option.value = examples[i].title;
                option.text = option.value;
                select.appendChild(option);
            }
            document.body.appendChild(select);
            select.addEventListener('change', (e) => 
                window.location.href = 
                    '?scene=' + select.value + 
                    '&isParallel=' + (this.isParallel ? '1' : '0') +
                    '&isHardware=' + (this.isHardware ? '1' : '0') +
                    '&renderSteps=' + (this.renderSteps ? '1' : '0')
                )

            this.element = element;

            var sceneName = getParameterByName('scene', undefined);
            if (!sceneName) sceneName = 'Sphere';
            this.createScene(sceneName);
        }

        createScene(title:string)
        {
            this.sceneDTO = createExample(title);
            
            if (!this.isParallel) {
                this.sc = new scene();
                this.sc.setDebug(true);
                this.sc.create(this.sceneDTO, ()=>
                {
                    if (this.isHardware)
                        this.renderer = new hardwareRenderer();
                    else
                    {
                        var sr = new simpleRenderer();
                        sr.setRenderSteps(this.renderSteps);
                        this.renderer = sr;
                    }
                    this.renderer.setContainerAndSize(this.element, 600, 600);

                    var scrend = this.sc.get<scRenderer>(o=>o instanceof scRenderer, 'render');
                    this.renderSettings = scrend.settings;
                    this.renderSettings.shadows = true; 
                    this.render(()=>{});        
                });
            }
            else {
                this.rendererParallel = new parallelRenderer();    
                this.rendererParallel.setContainerAndSize(this.element, 400, 400);

                this.rendererParallel.initDTO(this.sceneDTO, () =>
                {
                    var sc = new scene();
                    //this.cam = <camera> sc.createOne(this.sceneDTO, 'camera');
                    this.render(()=>{});
                });
            }
        }

        render(done: ()=>void)
        {
            if (!this.isParallel)
            {
                this.renderer.updateShader(this.renderSettings.sd);
                this.renderer.render(this.renderSettings);
                done();
            }
            else
                this.rendererParallel.render(this.renderSettings.camera, done);
        }

        debug(x:number, y:number)
        {
            if (!this.isParallel)
                this.renderer.renderDebug(x, y, this.renderSettings);
        }


        t = 5;
        camDist = 0;
        startRenderLoop()
        {
            var cam = this.renderSettings.camera;
            this.t = 5;
            this.camDist = vec2.distance(cam.target, cam.position);
            this.renderLoop();
        }
         
        private renderLoop()
        {
            if (this.t>10)
                return;
            
            var cam = this.renderSettings.camera;
            cam.position[0] = cam.target[0] + this.camDist*Math.cos(Math.PI*2 * this.t/10);
            cam.position[1] = cam.target[1] + this.camDist*Math.sin(Math.PI*2 * this.t/10);
            cam.setPosition(cam.position);
            this.render(() => 
            {
                this.t += 0.5;
                setTimeout(()=>this.renderLoop(), 0);
            });

            
        }

    }
}