module qec {


    export class sdFields1DTO {
        static TYPE: string = 'sdFields1DTO';
        type: string = sdFields1DTO.TYPE;
        svgId: string;
        top: partTopDTO;
        thickness: number;
        material: materialDTO;
        transform: Float32Array;
    }


    export class sdFields1 implements iTop, signedDistance {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        transform = mat4.create();
        inverseTransform = mat4.identity(mat4.create());
        material = new material();

        boundingBox: Float32Array;

        thickness: number;

        top: partTop = new partTop();

        createFrom(dto: sdFields1DTO): sdFields1 {
            this.svgId = dto.svgId;
            this.top.createFrom(dto.top);
            this.thickness = dto.thickness;
            this.material.createFrom(dto.material);
            mat4.copy(this.transform, dto.transform);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            this.updateBoundingBox();
            return this;
        }

        setThickness(thickness: number) {
            this.thickness = thickness;
            this.updateBoundingBox();
        }

        updateBoundingBox() {
            this.boundingBox = new Float32Array([
                0.5 * (this.top.topBounds[2] - this.top.topBounds[0]),
                0.5 * (this.top.topBounds[3] - this.top.topBounds[1]),
                0.5 * (this.thickness)]);
        }

        getDist3(minDist: number, pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            return 6666;
            /*
            //vec3.set(this.tmp, 68, 156, 0);

            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            this.tmp[2] -= 0.5*(this.thickness)
            let boxDist = this.sdBox.getDist(this.tmp, false, false);
            if (boxDist > minDist)
                return minDist;

            if (boxDist > 2)
                return boxDist;


            this.debug = debug;
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            var p = this.tmp;
            
            //if (this.debug)
            //    console.log('boundingCenterAndHalfSize : ' + float32ArrayToString(this.boundingCenterAndHalfSize));

            if (boundingBox)
            {
                var distToBbox = this.sdBox.getDist(p, false,debug);
                return distToBbox;
            }
            var d = 0;

            var u = (p[0] - this.topBounds[0]) / (this.topBounds[2] - this.topBounds[0]);
            var v = (p[1] - this.topBounds[1]) / (this.topBounds[3] - this.topBounds[1]);
            var d0 = this.getFieldDistance(this.topTexture, u, v);
            d = d0;
                        
            var dToUpperPlane = p[2] - this.thickness;
            var dToLowerPlane = 0 - p[2];
            if (dToUpperPlane > d) d = dToUpperPlane;
            if (dToLowerPlane > d) d = dToLowerPlane;
            
            return d;
            */
        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number { return 66666; }

        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number { return 66666; }

        getMaterial(pos: Float32Array): material {
            return this.material
        }

        getInverseTransform(out: Float32Array) {
            return this.inverseTransform;
        }

        getTransform(out: Float32Array) {
            mat4.copy(out, this.transform);
        }

        getBounds(min: Float32Array, max: Float32Array) {
            for (let i = 0; i < 2; ++i) {
                min[i] = -this.boundingBox[i];
                max[i] = this.boundingBox[i];
            }
            min[2] = 0;
            max[2] = this.boundingBox[2] * 2;
        }
    }
}