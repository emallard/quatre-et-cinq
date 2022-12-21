module qec {


    export class sdFields2RadialDTO
    {
        static TYPE:string = 'sdFields2RadialDTO';
        type:string = sdFields2RadialDTO.TYPE;
        top:partTopDTO;
        profile:partProfileDTO;
        center: number[];
        radius:number;

        material: materialDTO;
        transform:Float32Array;
    }


    export class sdFields2Radial implements signedDistance, iTop, iProfile
    {
        uniqueName:string = uniqueName.new();

        transform = mat4.create();
        inverseTransform = mat4.identity(mat4.create());
        material = new material();
        top:partTop = new partTop();
        profile:partProfile = new partProfile();

        center:Float32Array;
        radius:number;

        boundingBox: Float32Array;

        createFrom(dto:sdFields2RadialDTO)
        {
            this.top.createFrom(dto.top);
            this.profile.createFrom(dto.profile);
            this.center = new Float32Array(dto.center);
            this.radius = dto.radius;

            this.material.createFrom(dto.material);
            mat4.copy(this.transform, dto.transform);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            this.boundingBox = new Float32Array([
                0.5*(this.top.topBounds[2] - this.top.topBounds[0]), 
                0.5*(this.top.topBounds[3] - this.top.topBounds[1]), 
                0.5*(this.profile.profileBounds[3] - this.profile.profileBounds[1])]);
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