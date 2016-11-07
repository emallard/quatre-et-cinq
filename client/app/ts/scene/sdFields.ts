module qec {


    export class sdFieldsDTO
    {
        type:string;
        topImage:scImageDTO;
        topBounds:number[];
        profileImage:scImageDTO;
        profileBounds:number[];
        material: materialDTO;
        transform:Float32Array;
    }


    export class sdFields implements signedDistance, canCreate<sdFieldsDTO>
    {
        topDfCanvas = new distanceFieldCanvas();
        profileDfCanvas = new distanceFieldCanvas();


        material = new material();
        topTexture:floatTexture;
        topBounds:Float32Array;
        profileTexture:floatTexture;
        profileBounds:Float32Array;
        boundingCenterAndHalfSize:Float32Array;

        private sdBox:sdBox;
        private debug:boolean;

        inverseTransform = mat4.identity(mat4.create());
        private tmp = vec3.create();

        createFrom(dto:sdFieldsDTO)
        {
            this.topBounds = new Float32Array(dto.topBounds);
            this.profileBounds = new Float32Array(dto.profileBounds);

            // crée la float texture            
            var topImage = dto.topImage['__instance'].image;
            var profileImage = dto.profileImage['__instance'].image;
/*
            console.log(JSON.stringify(dto.topImage));
            console.log(profileImage);
*/
            var margin = 0.05;
            this.topDfCanvas.drawUserCanvasForTop(topImage, this.topBounds, margin);
            this.profileDfCanvas.drawUserCanvasForProfile(profileImage, this.profileBounds, margin);

            this.topDfCanvas.update();
            this.profileDfCanvas.update();

/*
            this.topDfCanvas.debugInfoInCanvas();
            this.profileDfCanvas.debugInfoInCanvas();

            $('.debug').append(this.topDfCanvas.canvas);
            $('.debug').append(this.profileDfCanvas.canvas);
*/
            this.init(this.topDfCanvas.floatTexture,
                      new Float32Array(this.topDfCanvas.totalBounds),
                      this.profileDfCanvas.floatTexture,
                      new Float32Array(this.profileDfCanvas.totalBounds));

            this.material.createFrom(dto.material);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);
        }

        init( 
            topTexture: floatTexture,
            topBounds:Float32Array,
            profileTexture: floatTexture,
            profileBounds:Float32Array)
        {
            this.topTexture = topTexture;
            this.topBounds = new Float32Array(topBounds);
            this.profileTexture = profileTexture;
            this.profileBounds = new Float32Array(profileBounds);
        

            this.boundingCenterAndHalfSize = new Float32Array(6);
            this.boundingCenterAndHalfSize[0] = 0;
            this.boundingCenterAndHalfSize[1] = 0;
            this.boundingCenterAndHalfSize[2] = 0.5*(this.profileBounds[3]+this.profileBounds[1]);

            this.boundingCenterAndHalfSize[3] = 0.5*(this.topBounds[2] - this.topBounds[0]);
            this.boundingCenterAndHalfSize[4] = 0.5*(this.topBounds[3] - this.topBounds[1]);
            this.boundingCenterAndHalfSize[5] = 0.5*(this.profileBounds[3] - this.profileBounds[1]);

            this.sdBox = new sdBox();
            this.sdBox.setHalfSize(
                this.boundingCenterAndHalfSize[3] - 0.1, 
                this.boundingCenterAndHalfSize[4] - 0.1, 
                this.boundingCenterAndHalfSize[5] - 0.1);
            /*
            if (boundingHalfSize == null)
                boundingHalfSize = vec3.fromValues(100,100,100);
            this.sdBox = new sdBox();

            console.log(vec3.str(boundingHalfSize));
            this.sdBox.setHalfSize(boundingHalfSize[0], boundingHalfSize[1], boundingHalfSize[2]);
            */


            //this.getDist(vec3.fromValues(0, 0, 0.05), true);
        }
        
        getBoundingBox(out: Float32Array)
        {
            var sx = 0.5*(this.topBounds[2] - this.topBounds[0]);
            var sy = 0.5*(this.topBounds[3] - this.topBounds[1]);
            var sz = 0.5*(this.profileBounds[3] - this.profileBounds[1]);
            vec3.set(out, sx, sy, sz);
        }

        transformedRd = vec3.create();
        aabb = vec3.create();
        dist2Pos = vec3.create();
        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.dist2Pos, pos, this.inverseTransform);
            vec3.transformMat4(this.transformedRd, rd, this.inverseTransform);
            this.dist2Pos[2] -= 0.5*(this.profileBounds[3]+this.profileBounds[1]);
         
            if (raybox.inbox(this.aabb, this.dist2Pos, 0))
                return this.getDist(pos, boundingBox, debug);

            var t = raybox.intersection(this.aabb, this.dist2Pos, rd, debug);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            
            return t;
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            this.debug = debug;
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            var p = this.tmp;
            
            if (this.debug)
                console.log('boundingCenterAndHalfSize : ' + float32ArrayToString(this.boundingCenterAndHalfSize));

            if (boundingBox)
            {
                var pz = 0.5*(this.profileBounds[3]+this.profileBounds[1]);
                
                var sx = -0.1 + 0.5*(this.topBounds[2] - this.topBounds[0]);
                var sy = -0.1 + 0.5*(this.topBounds[3] - this.topBounds[1]);
                var sz = -0.1 + 0.5*(this.profileBounds[3] - this.profileBounds[1]);

                this.sdBox.halfSize[0] = sx;
                this.sdBox.halfSize[1] = sy;
                this.sdBox.halfSize[2] = sz;

                
                p[2] -= pz;
                var distToBbox = this.sdBox.getDist(p, false,debug);
                //if (distToBbox > 0.2)
                //    return distToBbox;
                p[2] += pz;
                
                return distToBbox;
            }

            var u = (p[0] - this.topBounds[0]) / (this.topBounds[2] - this.topBounds[0]);
            var v = (p[1] - this.topBounds[1]) / (this.topBounds[3] - this.topBounds[1]);
            var d = this.getFieldDistance(this.topTexture, u, v);
            
            var u2 = (d - this.profileBounds[0]) / (this.profileBounds[2] - this.profileBounds[0]);
            var v2 = (p[2] - this.profileBounds[1]) / (this.profileBounds[3] - this.profileBounds[1]); 
            var d2 = this.getFieldDistance(this.profileTexture, u2, v2);
            
            if (this.debug)
            {
                //console.log('profileBounds ' + vec4.str(this.profileBounds));
                console.log(' uv : [' +  u.toFixed(3) + ' , ' + v.toFixed(3) + ']');
                console.log(d.toFixed(2));
                console.log(' uv2 : [' +  u2.toFixed(3) + ' , ' + v2.toFixed(3) + ']');
                console.log(d2.toFixed(2));
            }

            return d2;
            
        }

        private color = vec4.create();
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