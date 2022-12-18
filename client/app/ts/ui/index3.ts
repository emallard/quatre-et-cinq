module qec {
    export class index3 {
        element: HTMLElement;
        updater: updater;
        renderer: irenderer;
        rendererParallel: parallelRenderer;

        // overidden by:
        // p2.isParallel = getParameterByName('isParallel') == '1';
        // p2.isHardware = getParameterByName('isHardware') == '1';
        // p2.renderSteps = getParameterByName('renderSteps') == '1';

        isParallel = false;
        isHardware = false;
        isAnimate = false;
        isFullScreen = false;
        renderSteps = false;
        renderSettings = new renderSettings();

        start(element: HTMLElement) {
            this.element = element;
            var sceneName = getParameterByName('scene', undefined);
            if (sceneName == undefined)
                alert("scene?sceneName");
            else
                this.createScene(sceneName);
        }

        createScene(sceneName: string) {
            new svgSceneLoader().loadUrl('data/'+sceneName, sceneDTO =>
            {
                console.log('createScene continues');
                this.updater = new updater();
                if (this.isHardware)
                {
                    this.renderer = new hardwareRenderer();
                    this.updater.texturePacker.isHardware = true;
                }
                else
                {   
                    let sr = new simpleRenderer();
                    sr.setRenderSteps(this.renderSteps);
                    this.renderer = sr;
                }
                
                let w = 600;
                let h = 600; 
                if (this.isFullScreen)
                {
                    w = window.innerWidth;
                    h = window.innerHeight; 
                }

                this.renderer.setContainerAndSize(this.element, w, h);
    
                this.renderSettings = new renderSettings();
                this.renderSettings.shadows = false;
                this.renderSettings.refraction = false;
                this.renderSettings.boundingBoxes = false;

                let scene = new qec.scene();
                scene.create(sceneDTO, () => {
                    this.renderSettings.sdArray = sceneDTO.objects.map(x => x['__instance']);
                    this.renderSettings.camera = sceneDTO.cameras[0]['__instance'];

                    let lightDto = new directionalLightDTO();
                    lightDto.direction= [1, 1, -1];
                    lightDto.intensity = 1;

                    let light = new directionalLight();
                    light.createFrom(lightDto);
                    
                    this.renderSettings.directionalLights = [light];
                    if (this.isAnimate)
                    {
                        this.renderRotate();
                    }
                    else
                    {
                        this.render();
                    }
                });

                /*
                this.renderSettings.sd = sd;
                this.renderSettings.directionalLights = sc.directionalLights;
                this.renderSettings.spotLights = sc.spotLights;
                this.renderSettings.camera = sc.cameras[0];
                this.render(() => { });
                */
            });
        }


        render() {
            this.updater.update(this.renderSettings.sdArray, () => 
            {
                this.renderer.updateShader(this.renderSettings);
                this.renderer.render(this.renderSettings);
            });
        }

        debug(x: number, y: number) {
            if (!this.isParallel)
                this.renderer.renderDebug(x, y, this.renderSettings);
        }

        previousNow:number;
        rotateLoop = new rotateLoop();
        frameCount = 0;
        t = 0;
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
                this.renderer.updateShader(this.renderSettings);
                this.renderRotateOne();
            });
        }

        renderRotateOne()
        {
            let now = Date.now();
            let dt = (now - this.previousNow)/1000;
            this.t += dt;
            this.frameCount++;
            this.previousNow = now;

            while (this.t > 1)
            {
                this.frameDiv.innerText = '' + this.frameCount;
                this.t -= 1;
                this.frameCount = 0;
            }

            this.rotateLoop.update(dt);
            this.renderer.updateAllUniformsForAll();
            this.renderer.render(this.renderSettings);
            setTimeout(() => this.renderRotateOne(), 50);
        }
    }
}