module qec {

    export class devRendererAnimation {

        isHardware = true;
        isDirectionalLight = false;
        isFullScreen = false;

        rootElt: HTMLElement;
        updater: updater;
        renderer: irenderer;

        t = 0;

        animation: animationDTO;
        updaters: updaterBase[];
        renderSettings: renderSettings = new renderSettings();
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

            let loadedOjects = new qec.sceneLoader().load(animation.scenes[0].dtos);

            this.renderSettings.sdArray = loadedOjects.filter((x: any) => instanceOfSignedDistance(x));
            this.renderSettings.camera = loadedOjects.filter((x: any) => x instanceof camera)[0];

            if (this.animation.noColor) {
                console.log('animation.noColor');
                for (let sd of this.renderSettings.sdArray) {
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

            this.updater.update(this.renderSettings.sdArray, () => {
                this.renderer.updateShader(this.renderSettings);
                this.renderer.render(this.renderSettings);
                this.loopStart();
            });
        }

        previousNow: number;

        loopStart() {
            console.log('loop start');
            this.previousNow = Date.now();
            this.t = this.animation.start;
            this.updaters = [];
            this.loop();
        }

        loop() {
            let now = Date.now();
            let dt = (now - this.previousNow) / 1000;
            this.previousNow = now;
            this.updateTransitions(dt);
            this.updater.update(this.renderSettings.sdArray, () => {
                this.renderer.updateAllUniformsForAll();
                this.renderer.render(this.renderSettings);

                this.video.addCanvas(this.renderer.getCanvas());

                if (this.t < this.animation.end)
                    requestAnimationFrame(() => this.loop());
                else
                    this.video.finalizeVideo();
            });
        }

        updateTransitions(dt: number) {
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
            for (let s of starting) {
                console.log(`[t=${this.t.toFixed(1)}] segment starts : ${s.dto0.svgId} - [${s.t0},${s.t1}]`);

                let sd = this.renderSettings.sdArray.find(x => x.svgId == s.dto0.svgId);
                if (sd == null)
                    throw new Error(`svgId not found ${s.dto0.svgId}`);

                for (let p of s.parameters) {
                    let newUpdater: updaterBase;

                    if (p == 'thickness') {
                        newUpdater = new thicknessUpdater(<sdFields1>sd, s.dto0[p], s.dto1[p]);
                    }
                    else if (p == 'redMaterial') {
                        newUpdater = new redMaterialUpdater(sd);
                    }
                    else
                        throw Error('unknown parameter')

                    newUpdater.id = s.dto0.svgId;
                    newUpdater.t0 = s.t0;
                    newUpdater.t1 = s.t1;
                    newUpdater.start();
                    this.updaters.push(newUpdater);
                }

            }

            this.t = tNext;

            for (let u of this.updaters)
                u.update(this.t);

        }


        findStartingSegments(_t: number, _tNext: number): sdAnimationSegmentDTO[] {
            let found: sdAnimationSegmentDTO[] = [];
            for (let s of this.animation.segments) {
                if (s.t0 > _t && s.t0 < _tNext) {
                    found.push(s);
                }
            }
            return found;
        }
    }

    export class animationLoader {

        load(json: string, done: (x: animationDTO) => void) {

            console.log('animationLoader: load');

            let dto = JSON.parse(json);
            let run = new runAll();
            let scenes: scSceneDTO[] = [];

            console.log('animationLoader: scenes ' + dto.scenes.join(', '));
            for (let i = 0; i < dto.scenes.length; ++i) {
                let url = dto.scenes[i];
                let captured_i = i;
                run.push(_done => {
                    new svgSceneLoader().loadUrl(url, x => {
                        scenes[captured_i] = x;
                        _done();
                    });
                });
            }
            run.run(() => {
                this.loadSegments(scenes, dto, done);
            });
        }

        loadSegments(scenes: scSceneDTO[], json: any, done: (x: animationDTO) => void) {
            console.log('animationLoader: loadAnims');

            let segments = json.segments;
            let anim = new animationDTO();
            if (json.noColor != undefined)
                anim.noColor = json.noColor;
            anim.start = json.start;
            anim.end = json.end;
            anim.scenes.push(...scenes);

            for (let scene of scenes) {
                let dic: { [key: string]: any } = {};
                for (let a of scene.dtos) {
                    if (a.svgId != undefined)
                        dic[a.svgId] = a;
                }
                anim.scenesObjectsByName.push(dic);
            }

            for (let seg of segments) {
                let segment = new sdAnimationSegmentDTO();
                segment.t0 = seg[0];
                segment.t1 = seg[1];
                segment.dto0 = anim.scenesObjectsByName[0][seg[2]];
                segment.dto1 = anim.scenesObjectsByName[1][seg[2]];
                if (segment.dto0 == null)
                    throw new Error(`not found in scene ${seg[2]}`);
                if (segment.dto1 == null)
                    throw new Error(`not found in scene ${seg[2]}`);
                segment.parameters = seg[3];
                if (!Array.isArray(seg[3]))
                    segment.parameters = [seg[3]];

                anim.segments.push(segment)
            }
            done(anim);
        }
    }

    export class animationDTO {
        start: number;
        end: number;
        scenes: scSceneDTO[] = [];
        scenesObjectsByName: { [key: string]: any }[] = [];
        segments: sdAnimationSegmentDTO[] = [];
        noColor: boolean;
    }

    export class sdAnimationSegmentDTO {
        t0: number;
        dto0: any;

        t1: number;
        dto1: any;

        parameters: string[];
    }

    export class updaterBase {
        id: string;
        t0: number;
        t1: number;
        start() { }
        update(t: number) { }
        stop() { }
    }

    export class zUpdater extends updaterBase {
    }

    export class thicknessUpdater extends updaterBase {
        sd: sdFields1;
        thickness0: number;
        thickness1: number;

        constructor(
            sd: sdFields1,
            thickness0: number,
            thickness1: number,
        ) {
            super();
            this.sd = sd;
            this.thickness0 = thickness0;
            this.thickness1 = thickness1;
            if (!(this.sd instanceof sdFields1))
                throw new Error('wrong sd type');
        }

        override update(t: number): void {
            let r = (t - this.t0) / (this.t1 - this.t0);
            this.sd.setThickness(mix(this.thickness0, this.thickness1, r));
        }

        override stop(): void {
            this.sd.setThickness(this.thickness1);
        }
    }

    export class redMaterialUpdater extends updaterBase {
        sd: signedDistance;
        constructor(sd: signedDistance) {
            super();
            this.sd = sd;
        }
    }

    export class profileUpdater {
    }

    export class cameraUpdater {
    }

    export class lightUpdater {
    }


}