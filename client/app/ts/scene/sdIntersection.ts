module qec{

    export class sdIntersectionDTO
    {
        type:string;
        a : any;
        b : any;
    }

    export class sdIntersection implements signedDistance, canCreate<sdUnionDTO>
    {
        array : signedDistance[] = [];

        createFrom(dto:sdIntersectionDTO)
        {
            this.array[0] = <signedDistance> dto.a;
            this.array[1] = <signedDistance> dto.b;
        }


        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            var d = 66666;
            var l = this.array.length;
            for (var i=0; i < l; ++i)
                d = Math.max(d, this.array[i].getDist2(pos, rd, boundingBox, debug));

            return d;
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            var d = 0;
            var l = this.array.length;
            for (var i=0; i < l; ++i)
                d = Math.max(d, this.array[i].getDist(pos, boundingBox, debug));
            
            return d;
        }


        getMaterial(pos: Float32Array)
        {
            var min = 666;
            var minMat:material;
            var l = this.array.length;
            for (var i=0; i < l; ++i)
            {
                if (this.array[i].getDist(pos, false, false) < min)
                {
                    minMat = this.array[i].getMaterial(pos);
                }
            }
            return minMat;
        }

        getInverseTransform(out:Float32Array)
        {
            mat4.identity(out);
        }

        getBoundingBox(out: Float32Array)
        {
            vec3.set(out, 100, 100, 100);
        }
    }
}