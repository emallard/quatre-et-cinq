module qec {
    export class index3 {
        element: HTMLElement;
        renderer: irenderer;
        rendererParallel: parallelRenderer;
        texturePacker: texturePacker;

        /*
        sd:signedDistance;
        light:spotLight;
        cam: camera;
        */
        isParallel = false;
        isHardware = false;
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
                var sr = new simpleRenderer();
                sr.setRenderSteps(this.renderSteps);
                this.renderer = sr;
                
                this.renderer.setContainerAndSize(this.element, 600, 600);
    
                this.renderSettings = new renderSettings();
                this.renderSettings.shadows = false;
                this.renderSettings.refraction = false;
                this.renderSettings.boundingBoxes = false;

                let scene = new qec.scene();
                scene.create(sceneDTO, () => {

                    var union = new sdUnion();
                    union.array = sceneDTO.objects.map(x => x['__instance']);

                    this.renderSettings.sd = union;
                    this.renderSettings.camera = sceneDTO.cameras[0]['__instance'];

                    let lightDto = new directionalLightDTO();
                    lightDto.direction= [1, -1, -1];
                    lightDto.intensity = 1;

                    let light = new directionalLight();
                    light.createFrom(lightDto);
                    
                    this.renderSettings.directionalLights = [light];
                    this.render();
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
            this.renderer.render(this.renderSettings);
        }

        debug(x: number, y: number) {
            if (!this.isParallel)
                this.renderer.renderDebug(x, y, this.renderSettings);
        }
    }
}