
module qec 
{

    export class updater
    {
        texturePacker: texturePacker;
        needRepack: boolean;

        constructor()
        {
            this.texturePacker = new texturePacker();
        }

        update(array:signedDistance[], done: () => void)
        {
            console.log('updater.update');
            this.updateImages(array, () => 
            {
                if (this.needRepack)
                    this.updateSprites(array);
                done();
            });
        }

        updateImages(array:signedDistance[], done: () => void) 
        {
            let run = new runAll();
            for (let sd of array)
            {
                if (sd instanceof sdFields1 
                    || sd instanceof sdFields2
                    || sd instanceof sdFields2Radial)
                {
                    let top = <iTop>sd;
                    run.push(x => this.updateTop(top, x));
                }
                if (sd instanceof sdFields2
                    || sd instanceof sdFields2Radial)
                {
                    let profile = <iProfile>sd;
                    run.push(x => this.updateProfile(profile, x));
                }
            }
            run.run(done);
        }

        updateTop(sd:iTop, done: () => void)
        {
            if (sd.topUpdated)
            {
                console.log('update top ' + sd.uniqueName);

                sd.topUpdated = false;
                this.needRepack = true;

                var margin = 2;

                // load image
                let img = new Image();
                img.onload = () => {
                    let topDfCanvas = new distanceFieldCanvas();                    
                    topDfCanvas.drawUserCanvasForTop(img, sd.topBounds, margin);
                    topDfCanvas.update();

                    vec4.copy(sd.topBounds, topDfCanvas.totalBounds);

                    topDfCanvas.debugInfoInCanvas();
                    document.body.append(topDfCanvas.canvas);

                    sd.topTexture = topDfCanvas.floatTexture;
                    sd.topTextureUpdated = true;
                    done();
                };
                img.src = sd.topSrc;
            }
            else
            {
                done();
            }
        }

        updateProfile(sd:iProfile, done: () => void)
        {
            if (sd.profileUpdated)
            {
                console.log('update profile' + sd.uniqueName);

                sd.profileUpdated = false;
                this.needRepack = true;

                var margin = 2;

                // load image
                let img = new Image();
                img.onload = () => {
                    let topDfCanvas = new distanceFieldCanvas();                    
                    topDfCanvas.drawUserCanvasForTop(img, sd.profileBounds, margin);
                    topDfCanvas.update();

                    vec4.copy(sd.profileBounds, topDfCanvas.totalBounds);

                    topDfCanvas.debugInfoInCanvas();
                    document.body.append(topDfCanvas.canvas);

                    sd.profileTexture = topDfCanvas.floatTexture;
                    sd.profileTextureUpdated = true;
                    done();
                };
                img.src = sd.profileSrc;
            }
            else
            {
                done();
            }
        }
        
        updateSprites(array:signedDistance[])
        {
            let allSprites: textureSprite[] = [];
            for (let sd of array)
            {
                if (sd instanceof sdFields1 
                    || sd instanceof sdFields2 
                    || sd instanceof sdFields2Radial)
                {
                    sd.topSprite = new textureSprite();
                    sd.topSprite.originalTexture = sd.topTexture;
                    allSprites.push(sd.topSprite);
                }
                if ( sd instanceof sdFields2
                    || sd instanceof sdFields2Radial)
                {
                    sd.profileSprite = new textureSprite();
                    sd.profileSprite.originalTexture = sd.profileTexture;
                    allSprites.push(sd.profileSprite);
                }
            }
            this.texturePacker.repack(allSprites);
        }

        
    }
}