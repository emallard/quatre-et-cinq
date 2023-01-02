module qec {

    export class sdUnionDTO {
        static TYPE: string = 'sdUnionDTO';
        type: string = sdUnionDTO.TYPE;
        svgId: string;
        array: any[];
        zMirror?: boolean
    }

    export class sdUnion implements signedDistance, canCreate<sdUnionDTO>
    {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        array: signedDistance[] = [];

        zMirror?: boolean;

        transform = mat4.create();
        inverseTransform = mat4.identity(mat4.create());

        boundingBox: Float32Array;

        createFrom(dto: sdUnionDTO): sdUnion {
            this.svgId = dto.svgId;
            this.zMirror = dto.zMirror;
            this.array = sceneLoader.load(dto.array);
            this.updateBoundingBox();
            return this;
        }

        public updateBoundingBox() {
            let center = vec3.create();
            this.boundingBox = vec3.create();
            //let halfSize = vec3.create();
            boundingBoxes.getBoundingBoxHalfSize(this.array, center, this.boundingBox);

            //let minusCenter = vec3.scale(vec3.create(), center, -1);

            if (this.zMirror == true) {
                mat4.identity(this.transform);
                mat4.translate(this.transform, this.transform, center);
                mat4.scale(this.transform, this.transform, vec3.fromValues(1, 1, -1));

                for (let a of this.array) {
                    //let local = a['localTransform'];
                    //mat4.copy(a.transform, local);
                    //mat4.translate(a.transform, a.transform, vec3.fromValues(0, 0, 30));
                    let zsym = mat4.create();
                    mat4.fromScaling(zsym, vec3.fromValues(1, 1, -1));

                    let trans = mat4.create();
                    mat4.translate(trans, trans, vec3.fromValues(0, 0, 30));

                    mat4.multiply(a.transform, zsym, a.transform);
                    mat4.multiply(a.transform, trans, a.transform);


                    //mat4.scale(a.transform, a.transform, vec3.fromValues(1, 1, -1));
                    mat4.invert(a.inverseTransform, a.transform);
                }
            }

            mat4.invert(this.inverseTransform, this.transform);
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
            for (let i = 0; i < 3; ++i) {
                min[i] = -this.boundingBox[i];
                max[i] = this.boundingBox[i];
            }
        }
    }
}