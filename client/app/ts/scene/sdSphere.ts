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

        getBoundingBox(out: Float32Array[])
        {
            vec3.set(out[0], -this.radius, -this.radius, -this.radius);
            vec3.set(out[1], this.radius, this.radius, this.radius);
        }

        transformedRay = new Ray();
        transformedRd = vec3.create();
        aabb:Float32Array[] = [vec3.create(), vec3.create()];

        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            vec3TransformMat4RotOnly(this.transformedRd, rd, this.inverseTransform);
            makeRay(this.transformedRay, this.tmp, this.transformedRd);
            
            /*
            if (raybox.inbox(this.aabb, this.tmp, 0))
                return this.getDist(this.tmp, boundingBox, debug);
            */

            var t = raybox.intersection(this.transformedRay, this.aabb, debug);
            if (debug) 
            {
                console.log(vec3.str(this.transformedRay.origin));
                console.log(vec3.str(this.transformedRay.direction));
                console.log('tttt ' + t);
            }

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

    }
}