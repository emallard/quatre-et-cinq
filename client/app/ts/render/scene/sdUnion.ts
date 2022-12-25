module qec {

    export class sdUnionDTO {
        static TYPE: string = 'sdUnionDTO';
        type: string = sdUnionDTO.TYPE;
        array: any[];
    }

    export class sdUnion implements signedDistance, canCreate<sdUnionDTO>
    {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        array: signedDistance[] = [];
        inverseTransform = mat4.identity(mat4.create());

        createFrom(dto: sdUnionDTO) {
            this.array = dto.array.map(x => <signedDistance>(x['__instance']));
        }


        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number {
            var d = 66666;
            var l = this.array.length;
            for (var i = 0; i < l; ++i)
                d = Math.min(d, this.array[i].getDist2(pos, rd, boundingBox, debug));

            return d;
        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            throw new Error("Not Implemented");
            /*
            var d = 66666;
            var l = this.array.length;
            for (var i = 0; i < l; ++i) {
                //let distBB = (<sdFields2> this.array[i]).getDistToBoundingBox(pos);
                //if (distBB < d)
                //    d = Math.min(d, this.array[i].getDist(pos, boundingBox, debug));
                d = (<sdFields2>this.array[i]).getDist3(d, pos, boundingBox, debug);
            }

            return d;
            */
        }

        newMaterial = new material();
        getMaterial(pos: Float32Array) {
            this.newMaterial.diffuse[0] = 72 / 255;
            this.newMaterial.diffuse[1] = 145 / 255;
            this.newMaterial.diffuse[2] = 243 / 255;
            return this.newMaterial;
            var min = 666;
            var minMat: material;
            var l = this.array.length;
            for (var i = 0; i < l; ++i) {
                var distI = this.array[i].getDist(pos, false, false);
                if (distI < min) {
                    min = distI;
                    minMat = this.array[i].getMaterial(pos);
                }
            }
            if (minMat == null)
                return this.newMaterial;
            return minMat;
        }

        getInverseTransform(out: Float32Array) {
            mat4.copy(out, this.inverseTransform);
        }

        getTransform(out: Float32Array) {
            throw new Error("Not Implemented");
        }

        getBounds(min: Float32Array, max: Float32Array) {
            throw new Error("Not Implemented");
        }
    }
}