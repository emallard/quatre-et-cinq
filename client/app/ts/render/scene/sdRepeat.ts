module qec {

    /*
    export class sdRepeatDTO {
        type: string;
        sd: any;
        box: number[];
    }

    export class sdRepeat implements signedDistance {
        svgId: string;
        sd: signedDistance;
        box = vec3.create();
        q = vec3.create();

        createFrom(dto: sdRepeatDTO) {

            this.sd = <signedDistance>(dto.sd['__instance']);
            vec3FromArray(this.box, dto.box);
        }


        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number {
            return 1000;
        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            for (var i = 0; i < 3; ++i) {
                this.q[i] = fmod(pos[i], this.box[i]) - 0.5 * this.box[i];
            }

            return this.sd.getDist(this.q, boundingBox, debug);
        }


        getMaterial(pos: Float32Array) {
            return this.sd.getMaterial(pos);
        }

        getInverseTransform(out: Float32Array) {
            mat4.identity(out);
        }

        getBoundingBox(out: Float32Array) {
            vec3.set(out, 100, 100, 100);
        }
    }
    */
}