/*module qec {
    
    export class sdCylinderDTO {
        type : string = 'sdCylinderDTO';
        material: materialDTO;
        h:number[];
    }

    export class sdCylinder implements signedDistance, canCreate<sdBoxDTO>
    {
        h = vec2.create();
        private tmpPos = vec3.create();
        material = new material();
        inverseTransform = mat4.create();

        createFrom(dto:sdCylinder)
        {
            vec3FromArray(this.h, dto.h);
            this.material.createFrom(dto.material)
            mat4.invert(this.inverseTransform, new Float32Array(dto.transform));    
        }

        setHalfSize(sx:number, sy:number, sz:number)
        {
            vec3.set(this.halfSize, sx, sy, sz);
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            vec3.transformMat4(this.tmpPos, pos, this.inverseTransform);
            
            
            vec2 d = abs(vec2(length(p.xz),p.y)) - h;
            return min(max(d.x,d.y),0.0) + length(max(d,0.0));
            
            return 1;
        }

        getMaterial(pos: Float32Array):material
        {
            return this.material
        }

        getInverseTransform(out:Float32Array)
        {
            mat4.identity(out);
        }

        getBoundingBox(out: Float32Array)
        {
            vec3.copy(out, this.halfSize);
        }
    }
}*/