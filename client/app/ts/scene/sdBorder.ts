module qec{

    export class sdBorderDTO
    {
        type:string;
        sd : any;
        borderIn:number;
        borderOut:number;
    }

    export class sdBorder implements signedDistance
    {
        sd : signedDistance;
        borderIn:number;
        borderOut:number;

        createFrom(dto:sdBorderDTO)
        {
            this.sd = <signedDistance> (dto.sd['__instance']);
            this.borderIn = dto.borderIn;
            this.borderOut = dto.borderOut;
        }

        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return 1000;
            /*
            var d = this.array[0].getDist(pos, boundingBox, debug);
            var l = this.array.length;
            for (var i=1; i < l; ++i)
            {
                d = Math.max(d, -this.array[i].getDist2(pos, rd, boundingBox, debug));
            }
            //var d = Math.max(-this.array[0].getDist(pos, debug), this.array[1].getDist(pos, debug));
            return d;
            */
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            var d = this.sd.getDist(pos, boundingBox, debug);
            
            if (d < 0)//d < -this.borderIn)
            {
                return -d - this.borderIn;
            }
            else //if (d > this.borderOut)
            {
                return d - this.borderOut;
            }
            
            //return d - this.borderOut;
        }

        getMaterial(pos: Float32Array)
        {
            return this.sd.getMaterial(pos);
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