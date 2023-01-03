module qec {

    export class devRendererAnimation {

        isHardware = true;
        isDirectionalLight = false;
        isFullScreen = true;
        recordVideo = false;
        realTime = true;
        realTimeMultiplier = 1;//0.1;

        rootElt: HTMLElement;
        updater: updater;
        renderer: irenderer;

        t = 0;

        animation: animationDTO;
        updaters: updaterBase[];
        renderSettings: renderSettings = new renderSettings();
        sdArray: signedDistance[];
        video = new video();

        loadUrl(src: string, rootElt: HTMLElement) {
            this.rootElt = rootElt;
            var req = new XMLHttpRequest();
            req.open('GET', src, true);
            req.onreadystatechange = () => {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        let loader = new animationLoader();
                        loader.load(req.responseText, animationDto => this.setAnimation(animationDto));
                    }
                    else {
                        console.error("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            req.send(null);
        }


        setAnimation(animation: animationDTO) {
            this.animation = animation;

            let loadedOjects = qec.sceneLoader.load(animation.scenes[0].dtos);

            //this.renderSettings.sd = loadedOjects.filter((x: any) => instanceOfSignedDistance(x));
            this.renderSettings.sd = loadedOjects.find((x: any) => x instanceof sdUnion);
            this.renderSettings.camera = loadedOjects.filter((x: any) => x instanceof camera)[0];

            if (this.animation.noColor) {
                console.log('animation.noColor');
                for (let sd of getAllSignedDistances.getAll(this.renderSettings.sd)) {
                    let grey = 1;
                    sd.getMaterial(null).setDiffuse(grey, grey, grey);
                }
            }

            let camTarget = this.renderSettings.camera.target;
            camTarget[2] = 0;

            // light
            this.renderSettings.lights = devRendererTools.createLights(this.isDirectionalLight, camTarget);

            // updater
            this.updater = new updater();
            this.updater.texturePacker.isHardware = this.isHardware;

            // renderer
            let w = 600;
            let h = 600;
            if (this.isFullScreen) {
                w = window.innerWidth;
                h = window.innerHeight;
            }

            if (this.isHardware)
                this.renderer = new hardwareRenderer();
            else
                this.renderer = new simpleRenderer();

            let elt = document.createElement('div');
            this.rootElt.append(elt);
            this.renderer.setContainerAndSize(elt, w, h);

            this.updater.update(this.renderSettings.sd, () => {
                this.renderer.updateShader(this.renderSettings);
                this.renderer.render(this.renderSettings);
                this.loopStart();
            });
        }

        previousNow: number;
        adjustEndStart = 0.001;
        loopStart() {
            console.log('loop start');
            this.previousNow = Date.now();
            this.t = this.animation.start - this.adjustEndStart;
            this.updaters = [];
            this.sdArray = getAllSignedDistances.getAll(this.renderSettings.sd);
            this.clearColors();
            this.loop();
        }

        clearColors() {
            for (let sd of this.sdArray) {
                sd.getMaterial(null).setDiffuse(1, 1, 1);
            }
        }

        loop() {
            let dt = 0.1;
            if (this.realTime) {
                let now = Date.now();
                dt = (now - this.previousNow) / 1000;
                dt *= this.realTimeMultiplier;
                this.previousNow = now;
            }
            this.updateTransitions(dt, () => {
                this.updater.update(this.renderSettings.sd, () => {
                    this.renderer.updateAllUniformsForAll();
                    this.renderer.render(this.renderSettings);

                    if (this.recordVideo)
                        this.video.addCanvas(this.renderer.getCanvas());

                    if (this.t < this.animation.end + this.adjustEndStart)
                        requestAnimationFrame(() => this.loop());
                    else
                        if (this.recordVideo)
                            this.video.finalizeVideo();
                });
            });
        }

        updateTransitions(dt: number, done: () => void) {
            let tNext = this.t + dt;
            //console.log(`transitions : t=${this.t}`);

            // check if we need to finish current updaters
            let updatersCopy = this.updaters.slice();
            this.updaters = [];
            for (let updater of updatersCopy) {
                if (updater.t1 < tNext) {
                    console.log(`[t=${this.t.toFixed(1)}] updater stops : ${updater.id} - [${updater.t0},${updater.t1}]`);
                    updater.stop();
                }
                else
                    this.updaters.push(updater);
            }

            // check if we need to start
            let starting = this.findStartingSegments(this.t, tNext);
            let newUpdaters: updaterBase[] = [];
            for (let s of starting) {
                console.log(`[t=${this.t.toFixed(1)}] segment starts : ${s.dto0.svgId} - [${s.t0},${s.t1}]`);

                let sd = this.sdArray.find(x => x.svgId == s.dto0.svgId);
                if (sd == null)
                    throw new Error(`svgId not found ${s.dto0.svgId}`);

                let parameters = s.parameters.slice();
                //parameters.push('redMaterial');

                for (let parameter of parameters) {
                    let newUpdater: updaterBase;

                    if (parameter == 'thickness') {
                        newUpdater = new thicknessUpdater(<sdFields1>sd, s.dto0[parameter], s.dto1[parameter]);
                    }
                    else if (parameter == 'redMaterial') {
                        newUpdater = new redMaterialUpdater(sd);
                    }
                    else if (parameter == 'profile') {
                        newUpdater = new profileUpdater(<sdFields2>sd, s.dto0[parameter], s.dto1[parameter]);
                    }
                    else if (parameter == 'border') {
                        newUpdater = new borderUpdater(<sdFields2Border>sd, s.dto0[parameter], s.dto1[parameter]);
                    }
                    else
                        throw Error('unknown parameter')

                    newUpdater.id = s.dto0.svgId;
                    newUpdater.t0 = s.t0;
                    newUpdater.t1 = s.t1;
                    newUpdaters.push(newUpdater);
                    this.updaters.push(newUpdater);
                }
            }

            let run = new runAll();
            for (let u of newUpdaters)
                run.push(_done => u.start(_done));

            run.run(() => {
                this.t = tNext;

                for (let u of this.updaters)
                    u.update(this.t);

                done();
            })


        }


        findStartingSegments(_t: number, _tNext: number): sdAnimationSegmentDTO[] {
            let found: sdAnimationSegmentDTO[] = [];
            for (let s of this.animation.segments) {
                if (s.t0 >= _t && s.t0 < _tNext) {
                    found.push(s);
                }
            }
            return found;
        }
    }
}