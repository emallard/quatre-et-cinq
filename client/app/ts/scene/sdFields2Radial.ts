module qec {


    export class sdFields2RadialDTO
    {
        static TYPE:string = 'sdFields2RadialDTO';
        type:string = sdFields2RadialDTO.TYPE;
        topImage:scImageDTO;
        topBounds:number[];
        
        center: number[];
        radius:number;

        profileImage:scImageDTO;
        profileBounds: number[];

        material: materialDTO;
        transform:Float32Array;
    }


    export class sdFields2Radial implements signedDistance, iTop, iProfile
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
        profileUpdated:boolean;

        center:Float32Array;
        radius:number;

        boundingBox: Float32Array;

        topTexture:floatTexture;
        topTextureUpdated:boolean;

        profileTexture:floatTexture;
        profileTextureUpdated:boolean;

        // after texture packer
        topSprite:textureSprite;
        profileSprite:textureSprite;


        createFrom(dto:sdFields2RadialDTO)
        {
            this.topBounds = new Float32Array(dto.topBounds);
            this.topSrc = dto.topImage.src;
            this.profileSrc = dto.profileImage.src;
            this.profileBounds = new Float32Array(dto.profileBounds);
            this.center = new Float32Array(dto.center);
            this.radius = dto.radius;

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

        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            throw new Error('not implemented');
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return this.getDist3(66666, pos, boundingBox, debug);
        }

        getDist3(minDist:number, pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return 666;
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