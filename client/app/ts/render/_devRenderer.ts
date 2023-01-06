module qec {

    export class devRendererSettings {
        sceneName = '';
        isParallel = false;
        isHardware = false;
        isBoth = false;
        isAnimated = false;
        isFullScreen = false;

        isDirectionalLight = false;
        showGrid = false;
        noColor = false;
        zColor = false;
        generateVideo = false;
        exportOBJ = false;

        debugDistanceField = false;
        renderSteps = false;
        backgroundColor = vec4.fromValues(1, 1, 1, 1);
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

        settings: devRendererSettings = new devRendererSettings();
        renderSettings = new renderSettings();

        start(element: HTMLElement, override: any) {
            for (let key in override) {
                this.settings[key] = override[key];
            }
            this.element = element;
            this.createScene();
        }

        createScene() {
            new svgSceneLoader().loadUrl(this.settings.sceneName, sceneDTO => {
                console.log('createScene continues');

                // updater
                this.updater = new updater();
                this.updater.debugInfoInCanvas = this.settings.debugDistanceField;

                // renderers
                let w = 600;
                let h = 600;
                if (this.settings.isFullScreen) {
                    w = window.innerWidth;
                    h = window.innerHeight;
                }

                if (this.settings.isHardware || this.settings.isBoth) {
                    let hr = new hardwareRenderer();
                    let elt = document.createElement('div');
                    if (this.settings.isBoth) {
                        elt.style.border = 'solid 2px blue';
                        elt.style.margin = '2px';
                        elt.style.display = 'inline-block';
                    }
                    else {
                        elt.style.display = 'fixed';
                        elt.style.top = '0px;'
                        elt.style.left = '0px;'
                    }
                    this.element.append(elt);
                    hr.setContainerAndSize(elt, w, h);

                    this.renderers.push(hr);
                    this.updater.texturePacker.isHardware = true;
                }

                if (!this.settings.isHardware || this.settings.isBoth) {
                    let sr = new simpleRenderer();
                    sr.setRenderSteps(this.settings.renderSteps);
                    let elt = document.createElement('div');
                    if (this.settings.isBoth) {
                        elt.style.border = 'solid 2px red';
                        elt.style.margin = '2px';
                        elt.style.display = 'inline-block';
                    }
                    else {
                        elt.style.display = 'fixed';
                        elt.style.top = '0px;'
                        elt.style.left = '0px;'
                    }
                    this.element.append(elt);
                    sr.setContainerAndSize(elt, w, h);

                    this.renderers.push(sr);
                }

                this.renderSettings = new renderSettings();
                this.renderSettings.shadows = false;
                this.renderSettings.refraction = false;
                this.renderSettings.boundingBoxes = false;
                this.renderSettings.noColor = this.settings.noColor;
                this.renderSettings.zColor = this.settings.zColor;
                this.renderSettings.backgroundColor = this.settings.backgroundColor;

                let loadedOjects = qec.sceneLoader.load(sceneDTO.dtos);

                this.renderSettings.sd = loadedOjects.find(x => x instanceof sdUnion);
                this.renderSettings.camera = loadedOjects.filter(x => x instanceof camera)[0];
                let camTarget = this.renderSettings.camera.target;
                camTarget[2] = 0;
                // grid

                //if (this.settings.showGrid)
                //    this.renderSettings.sdArray.push(devRendererTools.createGrid(camTarget));

                // light
                this.renderSettings.lights = devRendererTools.createLights(this.settings.isDirectionalLight, camTarget);

                if (this.settings.isAnimated) {
                    this.renderRotate();
                }
                else {
                    this.render();
                }
            });
        }


        render() {
            this.updater.update(this.renderSettings.sd, () => {

                if (!this.settings.exportOBJ) {
                    this.renderers.forEach(r => {
                        r.updateShader(this.renderSettings);
                        r.render(this.renderSettings);
                    });
                }

                if (this.settings.exportOBJ) {
                    let toTriangles = new signedDistanceToTriangles();
                    toTriangles.compute(this.renderSettings.sd, 200, 200, 50, 1);

                    //let obj = new exportOBJ().getText(toTriangles.triangles, toTriangles.normals, toTriangles.colors);
                    //saveAs(obj, "example.obj");

                    var stl = new exportSTL().getBinary(toTriangles.triangles, toTriangles.normals);
                    var blob = new Blob([stl], { type: 'application//octet-binary' });
                    saveAs(blob, 'download.stl');
                }
            });
        }

        /*
        debug(x: number, y: number) {
            if (!this.isParallel)
                this.renderer.renderDebug(x, y, this.renderSettings);
        }*/

        previousNow: number;
        rotateLoop = new rotateLoop();
        frameCount = 0;
        t = 0;
        totalT = 0;

        frameDiv: HTMLElement;

        video = new video();
        renderRotate() {
            this.frameDiv = document.createElement('div')
            this.frameDiv.style.position = 'fixed';
            this.frameDiv.style.top = '0px';
            this.frameDiv.style.left = '0px';
            this.frameDiv.style.color = 'red';
            document.body.appendChild(this.frameDiv);

            this.previousNow = Date.now();
            this.rotateLoop.setRenderSettings(this.renderSettings);

            this.updater.update(this.renderSettings.sd, () => {
                this.renderers.forEach(r => {
                    r.updateShader(this.renderSettings);
                });
                this.renderRotateOne();
            });
        }

        renderRotateOne() {
            let now = Date.now();
            let dt = (now - this.previousNow) / 1000;

            if (this.settings.generateVideo) {
                dt = 0.02;
            }

            this.t += dt;
            this.totalT += dt;
            this.frameCount++;
            this.previousNow = now;

            while (this.t > 1) {
                this.frameDiv.innerText = '' + this.frameCount;
                this.t -= 1;
                this.frameCount = 0;
            }

            this.rotateLoop.update(dt);
            this.renderers.forEach(r => {
                r.updateShader(this.renderSettings);
                r.render(this.renderSettings);
            });

            if (this.settings.generateVideo) {
                this.video.addCanvas(this.renderers[0].getCanvas());
            }

            if (this.totalT < 10)
                requestAnimationFrame(() => this.renderRotateOne());

            else {
                if (this.settings.generateVideo)
                    this.video.finalizeVideo();
            }
        }
    }
}