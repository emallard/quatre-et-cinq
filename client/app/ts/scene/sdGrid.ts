module qec {
    
    export class sdGridDTO {
        type : string = 'sdGridDTO';
        size : number;
        thickness:number;
        material: materialDTO;
        
    }

    export class sdGrid implements signedDistance, canCreate<sdGridDTO>
    {
        material = new material();
        size:number;
        thickness:number;
        d = vec3.create();
        mod = vec3.create();

        createFrom(dto:sdGridDTO)
        {
            this.size = dto.size;    
            this.thickness = dto.thickness;
            this.material.createFrom(dto.material)
        }

        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return 1000;            
        }
        

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            for (var i = 0; i < 3; ++i)
            {
                this.d[i] = 0.5*this.size - Math.abs( fmod(pos[i], this.size) - 0.5*this.size );
            }    
            var dMin = Math.min(this.d[0], this.d[1], this.d[2]);
            
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