module qec {

    export class editor2_view3d {
        rendererElt: HTMLElement;
        updater: updater;
        renderer: irenderer;

        updateFlag: boolean;
        renderFlag: boolean;
        controllerManager: controllerManager;
        sdRoot: sdUnion;
        settings: renderSettings;


        setRendererElt(rendererElt: HTMLElement) {
            this.rendererElt = rendererElt;
            this.updater = new updater();
            //this.renderer = new simpleRenderer();
            this.updater.texturePacker.isHardware = true;
            this.renderer = new hardwareRenderer();
            this.renderer.setContainerAndSize(this.rendererElt, this.rendererElt.clientWidth, this.rendererElt.clientHeight);

        }

        setSdRoot(sdRoot: sdUnion) {
            this.sdRoot = sdRoot;
            let camDTO = new cameraDTO();
            camDTO.target = [this.sdRoot.boundingBox[0], this.sdRoot.boundingBox[1], this.sdRoot.boundingBox[2]];
            camDTO.position = [camDTO.target[0], camDTO.target[1] - 100, camDTO.target[2] + 300];
            camDTO.up = [0, 0, 1];
            let cam = new camera();
            cam.createFrom(camDTO);

            let lightDto = new directionalLightDTO();
            lightDto.direction = [1, 1, -1];
            lightDto.intensity = 1;

            let light = new directionalLight();
            light.createFrom(lightDto);

            let lights = [light];

            this.settings = new renderSettings();
            this.settings.camera = cam;
            this.settings.lights = lights;
            this.settings.sd = this.sdRoot;

            this.updateFlag = true;
            this.renderFlag = true;

            this.createControllers();
            this.loop();
        }

        createControllers() {
            this.controllerManager = new controllerManager();

            let callbacks = new cameraControllerCallbacks();
            callbacks.getCamera = () => this.settings.camera;
            callbacks.getViewportHeight = () => this.renderer.getViewportHeight();
            callbacks.getViewportWidth = () => this.renderer.getViewportWidth();
            callbacks.setRenderFlag = () => this.setRenderFlag();
            this.controllerManager.cameraController = new cameraArcballController(callbacks);

            this.controllerManager.cameraController.cameraTransforms.setCenter(this.settings.camera.target);
            this.controllerManager.cameraController.cameraTransforms.setZcam(-300);
            //this.controllerManager.cameraController.cameraTransforms.setTranslation(this.settings.camera.target);

            //this.controllerManager.cameraController.setButton(2);

            //this.controllerManager.setController(this.controllerManager.cameraController);
            this.rendererElt.addEventListener('mousedown', (x: MouseEvent) => {
                //console.log('mousedown');
                this.controllerManager.onMouseDown(x);
            });
            this.rendererElt.addEventListener('mousemove', (x: MouseEvent) => {
                //console.log('mousemove');
                this.controllerManager.onMouseMove(x);
            });
            this.rendererElt.addEventListener('mouseup', (x: MouseEvent) => {
                //console.log('mouseup');
                this.controllerManager.onMouseUp(x);
            });
        }

        loop() {
            this.controllerManager.updateLoop();
            this.oneLoop(() => {
                requestAnimationFrame(() => this.loop());
            });
        }

        oneLoop(done: () => void) {
            if (this.updateFlag) {
                //console.log('update');
                //this.updateSprites();
                //this.updateScene();
                this.updateFlag = false;
                this.renderFlag = true;
                this.updater.update(this.sdRoot, () => {
                    this.renderer.updateShader(this.settings);
                    this.oneLoop(done)
                });
                return;
            }

            else if (this.renderFlag) {
                this.renderFlag = false;
                this.render();
            }
            done();
        }

        render() {
            //console.log('render');
            this.renderer.updateAllUniformsForAll();
            this.renderer.render(this.settings);
        }

        setRenderFlag() {
            this.renderFlag = true;
        }

        setUpdateFlag() {
            this.updateFlag = true;
        }
    }
}