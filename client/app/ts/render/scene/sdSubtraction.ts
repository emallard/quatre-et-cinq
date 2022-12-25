module qec {

    export class sdSubtractionDTO {
        type: string;
        a: any;
        b: any;
    }

    export class sdSubtraction implements signedDistance {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        array: signedDistance[] = [];

        createFrom(dto: sdSubtractionDTO) {
            this.array[0] = <signedDistance>dto.a;
            this.array[1] = <signedDistance>dto.b;
        }

        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number {
            var d = this.array[0].getDist(pos, boundingBox, debug);
            var l = this.array.length;
            for (var i = 1; i < l; ++i) {
                d = Math.max(d, -this.array[i].getDist2(pos, rd, boundingBox, debug));
            }
            //var d = Math.max(-this.array[0].getDist(pos, debug), this.array[1].getDist(pos, debug));
            return d;
        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            var d = this.array[0].getDist(pos, boundingBox, debug);
            var l = this.array.length;
            for (var i = 1; i < l; ++i) {
                d = Math.max(d, -this.array[i].getDist(pos, boundingBox, debug));
            }
            //var d = Math.max(-this.array[0].getDist(pos, debug), this.array[1].getDist(pos, debug));
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