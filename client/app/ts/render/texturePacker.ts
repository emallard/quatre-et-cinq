module qec 
{

    export class textureSprite
    {
        originalTexture:floatTexture;
        bigTexture: floatTexture;
        bounds = vec4.create(); // bounds between 0 and 1
    }

    export class texturePacker
    {
        allBigTextures: floatTexture[] = [];
        allSprites : textureSprite[] = [];

        repackMode = 3;

        getSprite(texture:floatTexture) : textureSprite
        {
            var found = this.allSprites.find(t => t.originalTexture == texture);
            return found;
        }

        getTextureIndex(texture:floatTexture) : number
        {
            var found = this.allBigTextures.indexOf(texture);
            return found;
        }

        repackSdRec(rootSignedDistance:signedDistance)
        {
            var floatTextures:floatTexture[] = [];
            var expl = new hardwareSignedDistanceExplorer();
            expl.explore(rootSignedDistance);
            expl.array.forEach(hsd => {
                var sd:signedDistance = hsd.sd;
                if (sd instanceof sdFields)
                {
                    floatTextures.push(sd.topTexture, sd.profileTexture);
                }
            });
            this.repack(floatTextures);
        }

        repack(floatTextures:floatTexture[])
        {
            if (this.repackMode == 0)
                this.repack0(floatTextures);
            else if (this.repackMode == 1)
                this.repack1(floatTextures);
            else if (this.repackMode == 2)
                this.repack2(floatTextures);
            else if (this.repackMode == 3)
                this.repack3(floatTextures);
        }

        repack0(floatTextures:floatTexture[])
        {
            this.allBigTextures = [];
            this.allSprites = [];

            for (var i=0; i < floatTextures.length; ++i)
            {
                var texture = floatTextures[i];

                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = texture;
                vec4.set(sprite.bounds, 0, 0, 1, 1);
                this.allSprites.push(sprite);

                this.allBigTextures.push(texture);

                console.log('sprite pushed #' + i + ' ' + vec4.str(sprite.bounds));
            }
        }

        repack1(floatTextures:floatTexture[])
        {

            console.log('repack mode 1 ' + floatTextures.length + ' textures');

            this.allBigTextures = [];
            this.allSprites = [];

            for (var i=0; i < floatTextures.length; ++i)
            {
                var texture = floatTextures[i];
                var bigTexture = new floatTexture(); 
                bigTexture.width = 400;
                bigTexture.height = 400;
                bigTexture.data = new Float32Array(bigTexture.width *  bigTexture.height * 4);
                
                for (var x=0; x < texture.width; x++)
                {
                    for (var y=0; y < texture.height; y++)
                    {
                        var q = y * texture.width + x;
                        var qb = y * (bigTexture.width) + x;
                        bigTexture.data[4*qb + 0] = texture.data[4*q + 0];
                        bigTexture.data[4*qb + 1] = texture.data[4*q + 1];
                        bigTexture.data[4*qb + 2] = texture.data[4*q + 2];
                        bigTexture.data[4*qb + 3] = texture.data[4*q + 3];
                    }
                }

                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = bigTexture;
                
                var xMax = texture.width / bigTexture.width;
                var yMax = texture.height / bigTexture.height;
                
                var offsetX = 1/bigTexture.width;
                var offsetY = 1/bigTexture.height;
                
                vec4.set(sprite.bounds, 0, 0, xMax-offsetX, yMax-offsetY);

                this.allSprites.push(sprite);

                this.allBigTextures.push(bigTexture);

                console.log('sprite pushed #' + i + ' ' + vec4.str(sprite.bounds));
            }
        }

        repack2(floatTextures:floatTexture[])
        {

            console.log('repack mode 2 ' + floatTextures.length + ' textures');
            this.allBigTextures = [];
            this.allSprites = [];

            var w = 400;//floatTextures[0].width;
            var h = 400;//floatTextures[0].height;
            
            var bigTexture = new floatTexture();
            bigTexture.width = w * floatTextures.length;
            bigTexture.height = h;
            bigTexture.data = new Float32Array(bigTexture.width *  bigTexture.height * 4);
            
            for (var i=0; i < floatTextures.length; ++i)
            {
                var texture = floatTextures[i];
                
                for (var x=0; x < texture.width; x++)
                {
                    for (var y=0; y < texture.height; y++)
                    {
                        var q = y * texture.width + x;
                        var qb = y * (bigTexture.width) + (i*w + x);
                        bigTexture.data[4*qb + 0] = texture.data[4*q + 0];
                        bigTexture.data[4*qb + 1] = texture.data[4*q + 1];
                        bigTexture.data[4*qb + 2] = texture.data[4*q + 2];
                        bigTexture.data[4*qb + 3] = texture.data[4*q + 3];
                    }
                }

                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = bigTexture;
                
                // sprite bounds
                var xMin = i/(floatTextures.length);
                var yMin = 0;
                var xMax = (i + (texture.width / 400)) / floatTextures.length;
                var yMax = (texture.height / 400);
                
                var offsetX = 1/bigTexture.width;
                var offsetY = 1/bigTexture.height;
                vec4.set(sprite.bounds, xMin + offsetX, yMin + offsetY, xMax - offsetX, yMax - offsetY);
                this.allSprites.push(sprite);

                //console.log('sprite pushed #' + i + ' ' + vec4.str(sprite.bounds));
            }

            this.allBigTextures.push(bigTexture);
        }


        repack3(floatTextures:floatTexture[])
        {

            console.log('repack mode 3 ' + floatTextures.length + ' textures');
            this.allBigTextures = [];
            this.allSprites = [];

            var w = 400;//floatTextures[0].width;
            var h = 400;//floatTextures[0].height;
            
            var indexInFloatTextures = 0;
            var maxSpriteInBigTexture = 10;
            while (indexInFloatTextures < floatTextures.length)
            {
                var spriteCountInBigTexture = Math.min(maxSpriteInBigTexture, floatTextures.length - indexInFloatTextures);
                var bigTexture = new floatTexture();
                bigTexture.width = w * spriteCountInBigTexture;
                bigTexture.height = h;
                bigTexture.data = new Float32Array(bigTexture.width *  bigTexture.height * 4);
                this.allBigTextures.push(bigTexture);
                indexInFloatTextures += spriteCountInBigTexture;

                console.log('bigTexture created for ' + spriteCountInBigTexture + ' sprites');
            }

            var bigTextureIndex = 0;
            var spriteIndex = 0;
            for (var i=0; i < floatTextures.length; ++i)
            {
                var texture = floatTextures[i];
                var bigTexture = this.allBigTextures[bigTextureIndex];
                
                for (var x=0; x < texture.width; x++)
                {
                    for (var y=0; y < texture.height; y++)
                    {
                        var q = y * texture.width + x;
                        var qb = y * (bigTexture.width) + (spriteIndex*w + x);
                        bigTexture.data[4*qb + 0] = texture.data[4*q + 0];
                        bigTexture.data[4*qb + 1] = texture.data[4*q + 1];
                        bigTexture.data[4*qb + 2] = texture.data[4*q + 2];
                        bigTexture.data[4*qb + 3] = texture.data[4*q + 3];
                    }
                }

                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = bigTexture;
                
                // sprite bounds
                var xMin = (spriteIndex * 400)/(bigTexture.width);
                var yMin = 0;
                var xMax = (spriteIndex * 400 + texture.width) / bigTexture.width;
                var yMax = (texture.height / bigTexture.height);
                
                var offsetX = 1/bigTexture.width;
                var offsetY = 1/bigTexture.height;
                vec4.set(sprite.bounds, xMin + offsetX, yMin + offsetY, xMax - offsetX, yMax - offsetY);
                this.allSprites.push(sprite);
                //console.log('sprite pushed #' + bigTextureIndex + '/' + spriteIndex + ' ' + vec4.str(sprite.bounds));


                spriteIndex++;
                if (spriteIndex >= maxSpriteInBigTexture)
                {
                    spriteIndex = 0;
                    bigTextureIndex++;
                }
            }

        }


        

        debugInfoInBody(scale:number)
        {
            this.allBigTextures.forEach(t => 
            {
                var canvas = document.createElement('canvas');
                textureDebugInCanvas(t ,0 ,scale, canvas);
                document.body.appendChild(canvas);
            });
        }
    }
}