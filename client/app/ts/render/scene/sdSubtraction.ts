module qec {

    export class sdSubtractionDTO {
        static TYPE: string = 'sdSubtractionDTO';
        type: string = sdSubtractionDTO.TYPE;
        svgId: string;
        a: any;
        b: any;
    }

    export class sdSubtraction implements signedDistance {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();
        transform = mat4.create();
        inverseTransform = mat4.create();

        A: signedDistance;
        B: signedDistance;

        createFrom(dto: sdSubtractionDTO): sdSubtraction {
            this.svgId = dto.svgId;
            this.A = sceneLoader.load(dto.a);
            this.B = sceneLoader.load(dto.b);
            mat4.copy(this.transform, this.A.transform);
            mat4.copy(this.inverseTransform, this.A.inverseTransform);
            return this;
        }

        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number {
            throw new Error();
        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            throw new Error();
        }

        getMaterial(pos: Float32Array): material {
            throw new Error("Not Implemented For Subtraction");
        }

        getInverseTransform(out: Float32Array) {
            mat4.identity(out);
        }

        getBounds(min: Float32Array, max: Float32Array) {
            this.A.getBounds(min, max);
        }
    }
}