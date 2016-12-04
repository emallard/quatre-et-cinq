module qec {
    
    export class sdGrid2DTO {
        type : string = 'sdGrid2DTO';
        size : number;
        thickness:number;
        material: materialDTO;
        
    }

    export class sdGrid2 implements signedDistance, canCreate<sdGrid2DTO>
    {
        material = new material();
        size:number;
        thickness:number;
        d = vec3.create();
        mod = vec3.create();

        createFrom(dto:sdGrid2DTO)
        {
            this.size = dto.size;    
            this.thickness = dto.thickness;
            this.material.createFrom(dto.material)
        }

        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return 1000;            
        }

                sqrLen(x:number, y:number):number
        {
            return x*x + y*y;
        }
        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            // abs modulo
            for (var i = 0; i < 3; ++i)
            {
                this.mod[i] = Math.abs( fmod(pos[i], this.size) - 0.5*this.size);
            }

            var s0 = this.sqrLen(this.mod[1], this.mod[2]);
            var s1 = this.sqrLen(this.mod[0], this.mod[2]);
            var s2 = this.sqrLen(this.mod[0], this.mod[1]);

            var dMin = Math.sqrt(Math.min(s0, s1, s2));
            
            return dMin - this.thickness;
        }

        getMaterial(pos: Float32Array):material
        {
            return this.material;
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