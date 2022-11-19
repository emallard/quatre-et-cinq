module qec {


    export class sdFields2DTO
    {
        static TYPE:string = 'sdFields2DTO';
        type:string = sdFields2DTO.TYPE;
        topImage:scImageDTO;
        topBounds:number[];
        
        profileOrigin: number[];
        profileAxis: number[];
        profileImage:scImageDTO;
        profileBounds: number[];

        material: materialDTO;
        transform:Float32Array;
    }


    export class sdFields2 implements signedDistance, canCreate<sdFields2DTO>
    {
        topDfCanvas = new distanceFieldCanvas();
        profileDfCanvas = new distanceFieldCanvas();

        material = new material();
        topTexture:floatTexture;
        topSpriteBounds:Float32Array;
        topBounds:Float32Array;
        
        profileTexture:floatTexture;
        profileSpriteBounds:Float32Array;
        profileBounds:Float32Array;
        
        profileOrigin:Float32Array;
        profileAxis:Float32Array;
        
        private sdBox:sdBox;
        private debug:boolean;

        inverseTransform = mat4.identity(mat4.create());
        private tmp = vec3.create();

        thickness:number;

        createFrom(dto:sdFields2DTO)
        {
            this.topBounds = new Float32Array(dto.topBounds);
            //this.profileBounds = new Float32Array(dto.profileBounds);
            //this.thickness = dto.thickness;
            this.profileOrigin = new Float32Array(dto.profileOrigin);
            this.profileAxis = new Float32Array(dto.profileAxis);
            vec2.normalize(this.profileAxis, this.profileAxis);
            this.profileBounds = new Float32Array(dto.profileBounds);

            // crée la float texture            
            var topImage = dto.topImage['__instance'].image;
            var profileImage = dto.profileImage['__instance'].image;
/*
            console.log(JSON.stringify(dto.topImage));
            console.log(profileImage);
*/
            var margin = 2;
            this.topDfCanvas.drawUserCanvasForTop(topImage, this.topBounds, margin);
            this.profileDfCanvas.drawUserCanvasForTop(profileImage, this.profileBounds, margin);

            let showDebug = true;
            if (showDebug)
            {
                {
                    let debugCanvas = document.createElement('canvas');
                    document.body.appendChild(debugCanvas);
                    this.topDfCanvas.debugInfoInExistingCanvas(debugCanvas);
                }
                {
                    let debugCanvas = document.createElement('canvas');
                    document.body.appendChild(debugCanvas);
                    this.profileDfCanvas.debugInfoInExistingCanvas(debugCanvas);
                }
            }

            this.topDfCanvas.update();
            this.profileDfCanvas.update();

/*
            this.topDfCanvas.debugInfoInCanvas();
            this.profileDfCanvas.debugInfoInCanvas();

            $('.debug').append(this.topDfCanvas.canvas);
            $('.debug').append(this.profileDfCanvas.canvas);
*/

            this.thickness = this.profileBounds[3];
            this.init(this.topDfCanvas.floatTexture,
                      vec4.fromValues(0,0,1,1),
                      new Float32Array(this.topDfCanvas.totalBounds),
                      this.profileDfCanvas.floatTexture,
                      vec4.fromValues(0,0,1,1),
                      new Float32Array(this.profileDfCanvas.totalBounds));

            this.material.createFrom(dto.material);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);
        }

        init( 
            topTexture: floatTexture,
            topSpriteBounds: Float32Array,
            topBounds:Float32Array,
            profileTexture: floatTexture,
            profileSpriteBounds: Float32Array,
            profileBounds:Float32Array)
        {
            this.topTexture = topTexture;
            this.topBounds = new Float32Array(topBounds);
            this.topSpriteBounds = new Float32Array(topSpriteBounds);
            
            this.profileTexture = profileTexture;
            this.profileBounds = new Float32Array(profileBounds);
            this.profileSpriteBounds = new Float32Array(profileSpriteBounds);
            
            this.sdBox = new sdBox();
            this.sdBox.setHalfSize(
                0.5*(this.topBounds[2] - this.topBounds[0]), 
                0.5*(this.topBounds[3] - this.topBounds[1]), 
                this.profileBounds[3]);
            mat4.identity(this.sdBox.inverseTransform);
            /*
            if (boundingHalfSize == null)
                boundingHalfSize = vec3.fromValues(100,100,100);
            this.sdBox = new sdBox();

            console.log(vec3.str(boundingHalfSize));
            this.sdBox.setHalfSize(boundingHalfSize[0], boundingHalfSize[1], boundingHalfSize[2]);
            */

            //this.getDist(vec3.fromValues(0, 0, 0.05), true);
        }
        
        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            throw new Error('not implemented');
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            //vec3.set(this.tmp, 68, 156, 0);


            this.debug = debug;
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            var p = this.tmp;
            
            //if (this.debug)
            //    console.log('boundingCenterAndHalfSize : ' + float32ArrayToString(this.boundingCenterAndHalfSize));

            if (boundingBox)
            {
                var distToBbox = this.sdBox.getDist(p, false,debug);
                return distToBbox;
            }
            var d = 0;

            var u = (p[0] - this.topBounds[0]) / (this.topBounds[2] - this.topBounds[0]);
            var v = (p[1] - this.topBounds[1]) / (this.topBounds[3] - this.topBounds[1]);
            var d0 = this.getFieldDistanceWithSprite(this.topTexture, u, v, this.topSpriteBounds);
            d = d0;
            
            //return d;
            
            /*
            var d1 = Math.sqrt(p[1]*p[1] + p[2]*p[2]) - 1;
            var d2 = - (Math.sqrt(p[1]*p[1] + p[2]*p[2]) - 0.8);

            if (d1 > d) d = d1;
            if (d2 > d) d = d2;
            */                
            //var u2 = p[1] + 1;
            
            // project point on axis to compute
            
            let originToPointX = p[0]-this.profileOrigin[0];
            let originToPointY = p[1]-this.profileOrigin[1];
            let dotProduct = originToPointX*this.profileAxis[0] + originToPointY*this.profileAxis[1];

            var u2 = (dotProduct - this.profileBounds[0]) / (this.profileBounds[2] - this.profileBounds[0]);
            var v2 = (p[2] - this.profileBounds[1]) / (this.profileBounds[3] - this.profileBounds[1]);
            var d3 = this.getFieldDistanceWithSprite(this.profileTexture, u2, v2, this.profileSpriteBounds)
            if (d3 > d) d = d3;
            
            /*            
            var dToUpperPlane = p[2] - this.thickness;
            var dToLowerPlane = 0 - p[2];
            if (dToUpperPlane > d) d = dToUpperPlane;
            if (dToLowerPlane > d) d = dToLowerPlane;
            */

            return d;
            
            // return d;
            /*
            var u2 = (d - this.profileBounds[0]) / (this.profileBounds[2] - this.profileBounds[0]);
            var v2 = (p[2] - this.profileBounds[1]) / (this.profileBounds[3] - this.profileBounds[1]); 
            var d2 = this.getFieldDistanceWithSprite(this.profileTexture, u2, v2, this.profileSpriteBounds);
            
            if (this.debug)
            {
                //console.log('profileBounds ' + vec4.str(this.profileBounds));
                console.log(' uv : [' +  u.toFixed(3) + ' , ' + v.toFixed(3) + ']');
                console.log(d.toFixed(2));
                console.log(' uv2 : [' +  u2.toFixed(3) + ' , ' + v2.toFixed(3) + ']');
                console.log(d2.toFixed(2));
            }

            return d2;
            */
            
        }

        private color = vec4.create();

        private getFieldDistanceWithSprite(field:floatTexture, u:number, v:number, spriteBounds:Float32Array)
        {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);

            var u2 = mix(spriteBounds[0], spriteBounds[2], u);
            var v2 = mix(spriteBounds[1], spriteBounds[3], v);
            return this.getFieldDistance(field, u2, v2);
        }

        private getFieldDistance(field:floatTexture, u:number, v:number)
        {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);
            texture2D(field, u, v, this.color);
            if (this.debug) {
                //console.log('uv : ' , u, v);
                //console.log(this.color[0].toFixed(2) ,' at xy : [' +  (u * (field.width-1)).toFixed(1) + ',' + (v * (field.height-1)).toFixed(1));
            }
            return this.color[0];
        }

        getMaterial(pos:Float32Array):material
        {
            return this.material
        }

        getInverseTransform(out:Float32Array)
        {
            mat4.copy(out, this.inverseTransform);
        }
    }
}