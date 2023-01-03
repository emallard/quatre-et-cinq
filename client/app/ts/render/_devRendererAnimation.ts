module qec {

    export class devRendererAnimation {

        isHardware = true;
        isDirectionalLight = false;
        isFullScreen = true;
        recordVideo = false;
        realTime = true;
        realTimeMultiplier = 0.1;

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

            this.renderSettings.sd = loadedOjects.filter((x: any) => instanceOfSignedDistance(x));
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
            console.log(`transitions : t=${this.t}`);

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
                parameters.push('redMaterial');

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
        start(done: () => void) { done(); }
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

        override start(done: () => void): void {
            this.sd.getMaterial(null).setDiffuse(1, 0.5, 0.5);
            done();
        }

        override stop(): void {
            this.sd.getMaterial(null).setDiffuse(1, 1, 1);
        }
    }

    export class profileUpdater extends updaterBase {
        sd: sdFields2;

        dto0: partProfileDTO;
        dto1: partProfileDTO;

        df0: distanceFieldCanvas;
        df1: distanceFieldCanvas;
        df: distanceFieldCanvas;

        constructor(
            sd: sdFields2,
            dto0: partProfileDTO,
            dto1: partProfileDTO
        ) {
            super();
            this.sd = sd;
            this.dto0 = dto0;
            this.dto1 = dto1;
            if (this.dto0 == null || this.dto0.profileSrc == null || this.dto0.profileBounds == null)
                throw new Error('wrong dto0 type');
            if (this.dto1 == null || this.dto1.profileSrc == null || this.dto1.profileBounds == null)
                throw new Error('wrong dto1 type');
            if (!(this.sd instanceof sdFields2))
                throw new Error('wrong sd type');
        }

        margin = 2;
        debugInfoInCanvas = true;
        debugCanvas: HTMLCanvasElement;

        override start(done: () => void): void {

            this.df0 = new distanceFieldCanvas();
            this.df1 = new distanceFieldCanvas();
            this.df = new distanceFieldCanvas();

            if (this.debugInfoInCanvas) {
                this.debugCanvas = document.createElement('canvas');
                document.body.append(this.debugCanvas);
            }

            this.df0.drawSrcForTop(this.dto0.profileSrc, new Float32Array(this.dto0.profileBounds), this.margin,
                () => {
                    this.df.drawSrcForTop(this.dto0.profileSrc, new Float32Array(this.dto0.profileBounds), this.margin,
                        () => {
                            this.df1.drawSrcForTop(this.dto1.profileSrc, new Float32Array(this.dto1.profileBounds), this.margin,
                                () => {
                                    this.createSegments();
                                    done();
                                });
                        });
                });
            //}
            //else {
            //    let swap = this.df0;
            //    this.df0 = this.df1;
            //    this.df1 = swap;
            //    this.start2(done);
            //}
        }

        columns: number[];

        createSegments(): void {
            this.columns = [];

            let w = this.df1.canvas.width;
            let h = this.df1.canvas.height;
            let ctx0 = this.df0.canvas.getContext('2d');
            let ctx1 = this.df1.canvas.getContext('2d');
            let data0 = ctx0.getImageData(0, 0, w, h);
            let data1 = ctx1.getImageData(0, 0, w, h);

            for (let i = 0; i < w; i++) {
                let [s0, e0] = this.getColumnSegment(data0, i);
                let [s1, e1] = this.getColumnSegment(data1, i);

                let m0 = (e0 + s0) / 2;
                let m1 = (e1 + s1) / 2;

                this.columns.push(m0, m0 - s0, m1, m1 - s1);
            }
        }

        getColumnSegment(data: ImageData, i: number): [number, number] {
            let start = -1;
            let end = -1;
            for (let j = 0; j < data.height; j++) {
                let q = (data.width * j + i) * 4;
                let alpha = data.data[q + 3];
                if (alpha > 0 && start == -1)
                    start = j;
                if (alpha == 0 && start != -1) {
                    end = j;
                    break;
                }
            }
            return [start, end];
        }


        override update(t: number): void {

            let r = (t - this.t0) / (this.t1 - this.t0);

            let ctx = this.df.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.df.canvas.width, this.df.canvas.height);

            let imageData = ctx.getImageData(0, 0, this.df.canvas.width, this.df.canvas.height);
            let data = imageData.data;

            for (let i = 0; i < imageData.width; i++) {
                let m0 = this.columns[4 * i + 0];
                let h0 = this.columns[4 * i + 1];
                let m1 = this.columns[4 * i + 2];
                let h1 = this.columns[4 * i + 3];

                if (m0 == -1)
                    continue;

                let m = mix(m0, m1, r);
                let h = mix(h0, h1, r);
                for (let j = Math.floor(m - h); j < Math.ceil(m + h); ++j) {
                    let q = (j * imageData.width + i) * 4;
                    data[q + 0] = 0;
                    data[q + 1] = 0;
                    data[q + 2] = 0;
                    data[q + 3] = 255;
                }
            }
            ctx.putImageData(imageData, 0, 0);

            this.df.computeDistanceFromCanvas(this.df.distanceField.halfSize[0], this.df.distanceField.halfSize[1]);
            this.df.update();
            this.sd.profile.profileTexture = this.df.floatTexture;
            this.sd.profile.profileTextureUpdated = true;

            if (this.debugInfoInCanvas)
                this.df.debugInfoInExistingCanvas(this.debugCanvas);
        }

        override stop(): void {
            if (this.df0 != null && this.df1 != null)
                this.df.floatTexture = this.df1.floatTexture;
        }
    }

    export class cameraUpdater {

    }

    export class lightUpdater {
    }


}