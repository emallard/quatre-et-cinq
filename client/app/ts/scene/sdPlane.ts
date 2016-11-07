module qec {
    
    export class sdPlaneDTO {
        type : string = 'sdPlaneDTO';
        normal : number[];
        material: materialDTO;
    }

    export class sdPlane implements signedDistance, canCreate<sdPlaneDTO>
    {
        material = new material();
        normal = vec3.set(vec3.create(), 0, 0, 1);
        private tmp = vec3.create();

        createFrom(dto:sdPlaneDTO)
        {
            vec3FromArray(this.normal, dto.normal);
            vec3.normalize(this.normal, this.normal);
            this.material.createFrom(dto.material)
        }

        transformedRd = vec3.create();
        aabb = vec3.create();
        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            this.getBoundingBox(this.aabb);

            if (raybox.inbox(this.aabb, pos, 0))
                return this.getDist(pos, boundingBox, debug);

            var t = raybox.intersection(this.aabb, pos, rd, debug);
            if (debug) console.log('tttt ' + t);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);

            return t;
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return vec3.dot(pos, this.normal);
        }

        getMaterial(pos: Float32Array)
        {
            return this.material
        }


        getInverseTransform(out:Float32Array)
        {
            mat4.identity(out);
        }

        getBoundingBox(out: Float32Array)
        {
            vec3.set(out, 1000, 1000, 0.001);
        }
    }
}