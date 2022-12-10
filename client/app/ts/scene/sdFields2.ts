module qec {


    export class sdFields2DTO
    {
        static TYPE:string = 'sdFields2DTO';
        type:string = sdFields1DTO.TYPE;
        topImage:scImageDTO;
        topBounds:number[];
        
        profileImage:scImageDTO;
        profileBounds:number[];

        profileOrigin: number[];
        profileAxis: number[];

        material: materialDTO;
        transform:Float32Array;
    }

    
    export class sdFields2 implements signedDistance, iTop, iProfile
    {
        uniqueName:string = uniqueName.new();

        transform:Float32Array;
        inverseTransform = mat4.identity(mat4.create());
        material = new material();
        topSrc:string;
        topBounds:Float32Array;
        topUpdated:boolean;

        profileSrc:string;
        profileBounds:Float32Array;
        profileOrigin:Float32Array;
        profileAxis:Float32Array;
        profileUpdated:boolean;

        boundingBox: Float32Array;

        topTexture:floatTexture;
        topTextureUpdated:boolean;

        profileTexture:floatTexture;
        profileTextureUpdated:boolean;

        // after texture packer
        topSprite:textureSprite;
        profileSprite:textureSprite;


        createFrom(dto:sdFields2DTO)
        {
            this.topBounds = new Float32Array(dto.topBounds);
            this.topSrc = dto.topImage.src;
            this.profileSrc = dto.profileImage.src;
            this.profileBounds = new Float32Array(dto.profileBounds);
            this.profileOrigin = new Float32Array(dto.profileOrigin);
            this.profileAxis = new Float32Array(dto.profileAxis);
            vec2.normalize(this.profileAxis, this.profileAxis);

            this.material.createFrom(dto.material);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            this.boundingBox = new Float32Array([
                0.5*(this.topBounds[2] - this.topBounds[0]), 
                0.5*(this.topBounds[3] - this.topBounds[1]), 
                0.5*(this.profileBounds[3] - this.profileBounds[1])]);

            // update flag
            this.topUpdated = true;
            this.profileUpdated = true;
        }

        getDist3(minDist:number, pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return 6666;
            /*
            //vec3.set(this.tmp, 68, 156, 0);

            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            this.tmp[2] -= 0.5*(this.thickness)
            let boxDist = this.sdBox.getDist(this.tmp, false, false);
            if (boxDist > minDist)
                return minDist;

            if (boxDist > 2)
                return boxDist;


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
            var d0 = this.getFieldDistance(this.topTexture, u, v);
            d = d0;
                        
            var dToUpperPlane = p[2] - this.thickness;
            var dToLowerPlane = 0 - p[2];
            if (dToUpperPlane > d) d = dToUpperPlane;
            if (dToLowerPlane > d) d = dToLowerPlane;
            
            return d;
            */
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number {return 66666;}

        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number {return 66666;}
        
        getMaterial(pos:Float32Array):material
        {
            return this.material
        }

        getInverseTransform(out: Float32Array)
        {
            return this.inverseTransform;
        }
    }
}