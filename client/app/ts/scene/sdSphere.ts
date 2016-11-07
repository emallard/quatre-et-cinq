module qec {

    export type sdSphereDTO = sdSphereDTO1 | sdSphereDTO2;

    export interface sdSphereDTO1
    {
        type:string;
        radius:number;
        material:materialDTO;
    }

    export interface sdSphereDTO2
    {
        type:string;
        radius:number
        transform:number[];
        material:materialDTO;
    }


    export class sdSphere implements signedDistance, canCreate<sdSphereDTO>
    {
        material = new material();
        radius:number = 1;
        inverseTransform = mat4.create();
        tmp = vec3.create();

        createFrom(dto:sdSphereDTO)
        {
            this.material.createFrom(dto.material);
            this.radius = dto.radius;
           
            var transform = (<any>dto).transform;
            if (!transform)
                mat4.identity(this.inverseTransform);
            else
                mat4.invert(this.inverseTransform, new Float32Array(transform));
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
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            
            return t;
        }


        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            return vec3.length(this.tmp) - this.radius;
        }

        getMaterial(pos: Float32Array)
        {
            return this.material
        }


        getInverseTransform(out:Float32Array)
        {
            mat4.copy(out, this.inverseTransform);
        }

        getBoundingBox(out: Float32Array)
        {
            vec3.set(out, this.radius, this.radius, this.radius);
        }
    }
}