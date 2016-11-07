module qec {
    
    export class sdBoxDTO {
        type : string = 'sdBoxDTO';
        halfSize : number[];
        material: materialDTO;
        transform:number[];
    }

    export class sdBox implements signedDistance, canCreate<sdBoxDTO>
    {
        halfSize = vec3.create();
        private tmp = vec3.create();
        private tmpPos = vec3.create();
        material = new material();
        inverseTransform = mat4.create();

        createFrom(dto:sdBoxDTO)
        {
            vec3FromArray(this.halfSize, dto.halfSize);
            this.material.createFrom(dto.material)
            mat4.invert(this.inverseTransform, new Float32Array(dto.transform));    
        }

        setHalfSize(sx:number, sy:number, sz:number)
        {
            vec3.set(this.halfSize, sx, sy, sz);
        }

        transformedRd = vec3.create();
        aabb = vec3.create();
        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            vec3.transformMat4(this.transformedRd, rd, this.inverseTransform);

            if (raybox.inbox(this.aabb, this.tmp, 0))
                return this.getDist(pos, boundingBox, debug);

            var t = raybox.intersection(this.aabb, this.tmp, rd, debug);
            if (debug) console.log('tttt ' + t);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);

            return t;
            
        }


        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            vec3.transformMat4(this.tmpPos, pos, this.inverseTransform);
            
            var d0 = Math.abs(this.tmpPos[0]) - this.halfSize[0];
            var d1 = Math.abs(this.tmpPos[1]) - this.halfSize[1];
            var d2 = Math.abs(this.tmpPos[2]) - this.halfSize[2];
            var mc = Math.max(d0, d1, d2);

            var t = this.tmp;
            t[0] = Math.max(d0, 0);
            t[1] = Math.max(d1, 1);
            t[2] = Math.max(d2, 2);

            return Math.min(mc, vec3.length(t));
        }

        getMaterial(pos: Float32Array):material
        {
            return this.material
        }

        getInverseTransform(out:Float32Array)
        {
            mat4.copy(out, this.inverseTransform);
        }

        getBoundingBox(out: Float32Array)
        {
            vec3.copy(out, this.halfSize);
        }
    }
}