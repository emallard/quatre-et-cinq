
module qec {

    export class updater {
        texturePacker: texturePacker;
        needRepack: boolean;
        debugInfoInCanvas = false;

        constructor() {
            this.texturePacker = new texturePacker();
        }

        update(array: signedDistance[], done: () => void) {
            //console.log('updater.update');
            this.updateImages(array, () => {
                if (this.needRepack) {
                    this.needRepack = false;
                    this.updateSprites(array);
                }
                done();
            });
        }

        updateImages(array: signedDistance[], done: () => void) {
            let run = new runAll();
            for (let sd of array) {
                if (instanceOfTop(sd)) {
                    let captured = <iTop>sd;
                    run.push(x => this.updateTop(captured, x));
                }
                if (instanceOfProfile(sd)) {
                    let captured = <iProfile>sd;
                    run.push(x => this.updateProfile(captured, x));
                }
                if (instanceOfProfileTopBottom(sd)) {
                    let captured = <iProfileTopBottom>sd;
                    run.push(x => this.updateProfileTopBottom(captured, x));
                }
                if (instanceOfBorder(sd)) {
                    let captured = <iBorder>sd;
                    run.push(x => this.updateBorder(captured, x));
                }
            }
            run.run(done);
        }

        updateSprites(array: signedDistance[]) {
            console.log('updater.updateSprites');
            let allSprites: textureSprite[] = [];
            for (let sd of array) {
                if (instanceOfTop(sd)) {
                    let top = sd.top;
                    top.topSprite = new textureSprite();
                    top.topSprite.originalTexture = top.topTexture;
                    allSprites.push(top.topSprite);
                }
                if (instanceOfProfile(sd)) {
                    let profile = sd.profile;
                    profile.profileSprite = new textureSprite();
                    profile.profileSprite.originalTexture = profile.profileTexture;
                    allSprites.push(profile.profileSprite);
                }
                if (instanceOfProfileTopBottom(sd)) {
                    let profile = sd.profileTopBottom;
                    {
                        profile.profileTopSprite = new textureSprite();
                        profile.profileTopSprite.originalTexture = profile.profileTopTexture;
                        allSprites.push(profile.profileTopSprite);
                    }
                    {
                        profile.profileBottomSprite = new textureSprite();
                        profile.profileBottomSprite.originalTexture = profile.profileBottomTexture;
                        allSprites.push(profile.profileBottomSprite);
                    }
                }
                if (instanceOfBorder(sd)) {
                    let b = sd.border;
                    b.borderSprite = new textureSprite();
                    b.borderSprite.originalTexture = b.borderTexture;
                    allSprites.push(b.borderSprite);
                }
            }
            this.texturePacker.repack(allSprites);
        }

        updateTop(sd: iTop, done: () => void) {
            let top = sd.top;
            if (top.topUpdated) {
                console.log('update top ' + sd.uniqueName);

                top.topUpdated = false;
                this.needRepack = true;

                var margin = 2;

                // load image
                let img = new Image();
                img.onload = () => {
                    let topDfCanvas = new distanceFieldCanvas();
                    topDfCanvas.drawUserCanvasForTop(img, top.topBounds, margin);
                    topDfCanvas.update();

                    vec4.copy(top.topBounds, topDfCanvas.totalBounds);

                    if (this.debugInfoInCanvas) {
                        topDfCanvas.debugInfoInCanvas();
                        document.body.append(topDfCanvas.canvas);
                    }

                    top.topTexture = topDfCanvas.floatTexture;
                    top.topTextureUpdated = true;
                    done();
                };
                img.src = top.topSrc;
            }
            else {
                done();
            }
        }

        updateProfile(sd: iProfile, done: () => void) {
            let profile = sd.profile;
            if (profile.profileUpdated) {
                console.log('update profile' + sd.uniqueName);

                profile.profileUpdated = false;
                this.needRepack = true;

                var margin = 2;

                // load image
                let img = new Image();
                img.onload = () => {
                    let topDfCanvas = new distanceFieldCanvas();
                    topDfCanvas.drawUserCanvasForTop(img, profile.profileBounds, margin);
                    topDfCanvas.update();

                    vec4.copy(profile.profileBounds, topDfCanvas.totalBounds);

                    if (this.debugInfoInCanvas) {
                        topDfCanvas.debugInfoInCanvas();
                        document.body.append(topDfCanvas.canvas);
                    }

                    profile.profileTexture = topDfCanvas.floatTexture;
                    profile.profileTextureUpdated = true;
                    done();
                };
                img.src = profile.profileSrc;
            }
            else {
                done();
            }
        }

        updateProfileTopBottom(sd: iProfileTopBottom, done: () => void) {
            let profile = sd.profileTopBottom;
            if (profile.profileUpdated) {
                console.log('update profile top-bottom' + sd.uniqueName);

                profile.profileUpdated = false;
                this.needRepack = true;

                var margin = 2;

                // load image
                let img = new Image();
                img.onload = () => {
                    {
                        let topDfCanvas = new distanceFieldCanvas();
                        topDfCanvas.drawUserCanvasForProfileTop(img, profile.profileBounds, margin);
                        topDfCanvas.update();

                        // to be done only once
                        // vec4.copy(profile.profileBounds, topDfCanvas.totalBounds);

                        if (this.debugInfoInCanvas) {
                            topDfCanvas.debugInfoInCanvas();
                            document.body.append(topDfCanvas.canvas);
                        }

                        profile.profileTopTexture = topDfCanvas.floatTexture;
                    }
                    {
                        let topDfCanvas = new distanceFieldCanvas();
                        topDfCanvas.drawUserCanvasForProfileBottom(img, profile.profileBounds, margin);
                        topDfCanvas.update();

                        vec4.copy(profile.profileBounds, topDfCanvas.totalBounds);

                        if (this.debugInfoInCanvas) {
                            topDfCanvas.debugInfoInCanvas();
                            document.body.append(topDfCanvas.canvas);
                        }

                        profile.profileBottomTexture = topDfCanvas.floatTexture;
                    }
                    profile.profileTextureUpdated = true;

                    done();
                };
                img.src = profile.profileSrc;
            }
            else {
                done();
            }
        }

        updateBorder(sd: iBorder, done: () => void) {
            let b = sd.border;
            if (b.borderUpdated) {
                console.log('update border' + sd.uniqueName);

                b.borderUpdated = false;
                this.needRepack = true;

                var margin = 2;

                // load image
                let img = new Image();
                img.onload = () => {
                    let topDfCanvas = new distanceFieldCanvas();
                    topDfCanvas.drawUserCanvasForBorder(img, b.borderBounds, margin);
                    topDfCanvas.update();

                    vec4.copy(b.borderBounds, topDfCanvas.totalBounds);

                    if (this.debugInfoInCanvas) {
                        topDfCanvas.debugInfoInCanvas();
                        document.body.append(topDfCanvas.canvas);
                    }

                    b.borderTexture = topDfCanvas.floatTexture;
                    b.borderTextureUpdated = true;
                    done();
                };
                img.src = b.borderSrc;
            }
            else {
                done();
            }
        }
    }
}