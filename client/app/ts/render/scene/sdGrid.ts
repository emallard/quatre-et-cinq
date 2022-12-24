module qec {

    export class sdGridDTO {
        static TYPE: string = 'sdGridDTO';
        type: string = sdGridDTO.TYPE;
        size: number;
        thickness: number;
        material: materialDTO;
        transform: Float32Array;
    }

    export class sdGrid implements signedDistance, canCreate<sdGridDTO>
    {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        transform = mat4.create();
        inverseTransform = mat4.identity(mat4.create());

        material = new material();
        size = 0;
        thickness: number;
        d = vec3.create();
        mod = vec3.create();
        boundingBox = vec3.create();

        createFrom(dto: sdGridDTO) {
            //vec3.set(this.size, dto.size, dto.size, dto.size);    
            this.size = dto.size;
            this.thickness = dto.thickness;
            this.material.createFrom(dto.material);

            mat4.copy(this.transform, dto.transform);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            vec3.set(this.boundingBox, this.size * 10, this.size * 10, 0);
        }

        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number {
            return 1000;
        }


        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            return 1000;
            /*
            for (var i = 0; i < 3; ++i)
            {
                this.d[i] = 0.5*this.size[i] - Math.abs( fmod(pos[i], this.size[i]) - 0.5*this.size[i] );
            }    
            var dMin = Math.min(this.d[0], this.d[1], this.d[2]);
            
            return dMin - this.thickness;
            */
        }

        getMaterial(pos: Float32Array): material {
            return this.material;
        }

        getInverseTransform(out: Float32Array) {
            mat4.identity(out);
        }

        getBoundingBox(out: Float32Array) {
            vec3.set(out, 100, 100, 100);
        }
    }
}