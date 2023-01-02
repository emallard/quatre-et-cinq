module qec {

    export class sdIntersectionDTO {
        type: string;
        a: any;
        b: any;
    }

    export class sdIntersection implements signedDistance, canCreate<sdIntersectionDTO>
    {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();
        array: signedDistance[] = [];
        transform = mat4.create();
        inverseTransform = mat4.create();

        createFrom(dto: sdIntersectionDTO) {

            this.array[0] = <signedDistance>(dto.a['__instance']);
            this.array[1] = <signedDistance>(dto.b['__instance']);
        }


        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number {
            var d = 66666;
            var l = this.array.length;
            for (var i = 0; i < l; ++i)
                d = Math.max(d, this.array[i].getDist2(pos, rd, boundingBox, debug));

            return d;
        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            var d = 0;
            var l = this.array.length;
            for (var i = 0; i < l; ++i)
                d = Math.max(d, this.array[i].getDist(pos, boundingBox, debug));

            return d;
        }


        getMaterial(pos: Float32Array) {
            var min = 666;
            var minMat: material;
            var l = this.array.length;
            for (var i = 0; i < l; ++i) {
                if (this.array[i].getDist(pos, false, false) < min) {
                    minMat = this.array[i].getMaterial(pos);
                }
            }
            if (minMat == null)
                return new material();

            return minMat;
        }

        getInverseTransform(out: Float32Array) {
            mat4.identity(out);
        }

        getTransform(out: Float32Array) {
            throw new Error("Not Implemented");
        }

        getBounds(min: Float32Array, max: Float32Array) {
            throw new Error("Not Implemented");
        }
    }
}