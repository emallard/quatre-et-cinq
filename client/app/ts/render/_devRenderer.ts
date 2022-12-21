module qec {
    
    export class devRendererSettings 
    {
        sceneName = '';
        isParallel = false;
        isHardware = false;
        isBoth = false;
        isAnimate = false;
        isFullScreen = false;

        isDirectionalLight = false;
        showGrid = false;

        debugDistanceField = false;
        renderSteps = false;
    }

    export class devRenderer {
        element: HTMLElement;
        updater: updater;
        renderers: irenderer[] = [];
        //rendererParallel: parallelRenderer;

        // overidden by:
        // p2.isParallel = getParameterByName('isParallel') == '1';
        // p2.isHardware = getParameterByName('isHardware') == '1';
        // p2.renderSteps = getParameterByName('renderSteps') == '1';

        settings: devRendererSettings;

        renderSettings = new renderSettings();

        setSettings(settings: devRendererSettings)
        {
            this.settings = settings;
        }

        start(element: HTMLElement) {
            this.element = element;
            this.createScene();
        }

        createScene() {
            new svgSceneLoader().loadUrl(this.settings.sceneName, sceneDTO =>
            {
                console.log('createScene continues');
                
                // updater
                this.updater = new updater();
                this.updater.debugInfoInCanvas = this.settings.debugDistanceField;

                // renderers
                let w = 600;
                let h = 600; 
                if (this.settings.isFullScreen)
                {
                    w = window.innerWidth;
                    h = window.innerHeight; 
                }

                if (this.settings.isHardware || this.settings.isBoth)
                {
                    let hr = new hardwareRenderer();
                    let elt = document.createElement('div');
                    if (this.settings.isBoth)
                    {
                        elt.style.border = 'solid 2px blue';
                        elt.style.margin = '2px';
                        elt.style.display = 'inline-block';
                    }
                    else
                    {
                        elt.style.display = 'fixed';
                        elt.style.top = '0px;'
                        elt.style.left = '0px;'
                    }
                    this.element.append(elt);
                    hr.setContainerAndSize(elt, w, h);

                    this.renderers.push(hr);
                    this.updater.texturePacker.isHardware = true;
                }

                if (!this.settings.isHardware || this.settings.isBoth)
                {   
                    let sr = new simpleRenderer();
                    sr.setRenderSteps(this.settings.renderSteps);
                    let elt = document.createElement('div');
                    if (this.settings.isBoth)
                    {
                        elt.style.border = 'solid 2px red';
                        elt.style.margin = '2px';
                        elt.style.display = 'inline-block';
                    }
                    else
                    {
                        elt.style.display = 'fixed';
                        elt.style.top = '0px;'
                        elt.style.left = '0px;'
                    }
                    this.element.append(elt);
                    sr.setContainerAndSize(elt, w, h);

                    this.renderers.push(sr);
                }
                
                

                this.renderers.forEach(r =>  {
                    
                });
    
                this.renderSettings = new renderSettings();
                this.renderSettings.shadows = false;
                this.renderSettings.refraction = false;
                this.renderSettings.boundingBoxes = false;

                let scene = new qec.scene();
                scene.create(sceneDTO, () => {
                    this.renderSettings.sdArray = sceneDTO.objects.map(x => x['__instance']);
                    this.renderSettings.camera = sceneDTO.cameras[0]['__instance'];
                    let camTarget = this.renderSettings.camera.target;

                    // grid

                    if (this.settings.showGrid)
                    {
                        let transform = mat4.create();
                        mat4.identity(transform);
                        mat4.translate(transform, transform, vec3.fromValues(camTarget[0], camTarget[1], 0));
                        let grid = new sdGrid();
                        grid.createFrom({
                            type : sdGridDTO.TYPE,
                            size : 10,
                            thickness:0.5,
                            material: {
                                type: materialDTO.TYPE,
                                diffuse: [1, 1, 1]
                            },
                            transform: transform
                        });
                        this.renderSettings.sdArray.push(grid);
                    }

                    // light

                    if (this.settings.isDirectionalLight)
                    {
                        let lightDto = new directionalLightDTO();
                        lightDto.direction= [1, 1, -1];
                        lightDto.intensity = 1;

                        let light = new directionalLight();
                        light.createFrom(lightDto);
                        
                        this.renderSettings.lights = [light];
                    }
                    else
                    {
                        this.renderSettings.lights = [];
                        {
                            let lightDto = new spotLightDTO()
                            let dist = 30;
                            lightDto.position = [camTarget[0]-dist, camTarget[0]-dist, camTarget[0]+dist];
                            lightDto.direction= [1, 1, -1];
                            lightDto.intensity = 0.5;

                            let light = new spotLight();
                            light.createFrom(lightDto);
                            this.renderSettings.lights.push(light);
                        }
                        {
                            let lightDto = new spotLightDTO()
                            let camTarget = this.renderSettings.camera.target;
                            let dist = 30;
                            lightDto.position = [camTarget[0]+dist, camTarget[0]-dist, camTarget[0]-dist];
                            lightDto.direction= [-1, 1, 1];
                            lightDto.intensity = 0.3;

                            let light = new spotLight();
                            light.createFrom(lightDto);
                            this.renderSettings.lights.push(light);
                        }
                        
                    }

                    if (this.settings.isAnimate)
                    {
                        this.renderRotate();
                    }
                    else
                    {
                        this.render();
                    }
                });
            });
        }


        render() {
            this.updater.update(this.renderSettings.sdArray, () => 
            {
                this.renderers.forEach(r => {
                    r.updateShader(this.renderSettings);
                    r.render(this.renderSettings);
                });
            });
        }

        /*
        debug(x: number, y: number) {
            if (!this.isParallel)
                this.renderer.renderDebug(x, y, this.renderSettings);
        }*/

        previousNow:number;
        rotateLoop = new rotateLoop();
        frameCount = 0;
        t = 0;
        totalT = 0;

        frameDiv:HTMLElement;
        renderRotate() {
            this.frameDiv = document.createElement('div')
            this.frameDiv.style.position = 'fixed';
            this.frameDiv.style.top = '0px';
            this.frameDiv.style.left = '0px';
            this.frameDiv.style.color = 'red';
            document.body.appendChild(this.frameDiv);

            this.previousNow = Date.now();
            this.rotateLoop.setRenderSettings(this.renderSettings);

            this.updater.update(this.renderSettings.sdArray, () => 
            {
                this.renderers.forEach(r => {
                    r.updateShader(this.renderSettings);
                });
                this.renderRotateOne();
            });
        }

        renderRotateOne()
        {
            let now = Date.now();
            let dt = (now - this.previousNow)/1000;
            this.t += dt;
            this.totalT += dt;
            this.frameCount++;
            this.previousNow = now;

            while (this.t > 1)
            {
                this.frameDiv.innerText = '' + this.frameCount;
                this.t -= 1;
                this.frameCount = 0;
            }

            this.rotateLoop.update(dt);
            this.renderers.forEach(r => {
                r.updateShader(this.renderSettings);
                r.render(this.renderSettings);
            });
            if (this.totalT < 20)
                requestAnimationFrame(() => this.renderRotateOne());
        }
    }
}