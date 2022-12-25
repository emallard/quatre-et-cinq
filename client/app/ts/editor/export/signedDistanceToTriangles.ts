module qec {

    export class signedDistanceToTriangles {
        densities: Float32Array;
        icount = 100;
        jcount = 100;
        kcount = 100;

        tmpVec1 = vec3.create();
        tmpVec2 = vec3.create();
        tmpVec3 = vec3.create();
        tmpVecBary = vec3.create();
        tmpVecCross = vec3.create();


        triangles: number[];
        colors: number[];
        normals: number[];

        getBoundingBox(sds: signedDistance[], min: Float32Array, max: Float32Array) {
            vec3.set(min, 666666, 666666, 666666);
            vec3.set(max, -666666, -666666, -666666);

            let tmpMin = vec3.create();
            let tmpMax = vec3.create();
            let tmpTransform = mat4.create();

            let point = vec3.create();

            // find bounding boxes
            for (let s of sds) {
                s.getBounds(tmpMin, tmpMax);
                s.getTransform(tmpTransform);

                vec3.transformMat4(point, tmpMin, tmpTransform);

                for (let i = 0; i < 3; i++) {
                    min[i] = Math.min(min[i], point[i]);
                    max[i] = Math.max(max[i], point[i]);
                }

                vec3.transformMat4(point, tmpMax, tmpTransform);

                for (let i = 0; i < 3; i++) {
                    min[i] = Math.min(min[i], point[i]);
                    max[i] = Math.max(max[i], point[i]);
                }
            }
        }

        computeAdaptative(sds: signedDistance[]) {

            let min = vec3.create();
            let max = vec3.create();
            this.getBoundingBox(sds, min, max);

            let getDistGenerator = new renderPixelGetDist();
            let getDist = getDistGenerator.generateGetDist(sds);


        }

        compute(sds: signedDistance[], icount: number, jcount: number, kcount: number, multiplier: number): void {
            let min = vec3.create();
            let max = vec3.create();
            this.getBoundingBox(sds, min, max);
            this.computeBase(sds, min, max, icount, jcount, kcount, multiplier);
        }

        computeBase(sds: signedDistance[], min: Float32Array, max: Float32Array, icount: number, jcount: number, kcount: number, multiplier: number): void {
            this.icount = icount;
            this.jcount = jcount;
            this.kcount = kcount;

            this.triangles = [];
            this.colors = [];
            this.normals = [];

            this.densities = new Float32Array(this.icount * this.jcount * this.kcount);
            //let diffuses = new Float32Array(3*100*100*50);

            //let sdUni:sdUnion = new sdUnion();
            //sds.forEach(x=>sdUni.array.push(x));

            let getDistGenerator = new renderPixelGetDist();
            let getDist = getDistGenerator.generateGetDist(sds);
            let getColor = getDistGenerator.generateGetColor(sds);

            let pos = vec3.create();
            let diffuse = vec3.create();

            console.log('export bounding box : ' + float32ArrayToString(min) + " " + float32ArrayToString(max));

            for (let i = 0; i < this.icount; ++i) {
                console.log('' + i + '/' + (this.icount - 1));
                let ri = i / (this.icount - 1);
                for (let j = 0; j < this.jcount; ++j) {
                    let rj = j / (this.jcount - 1);
                    for (let k = 0; k < this.kcount; ++k) {
                        let rk = k / (this.kcount - 1);

                        pos[0] = (1 - ri) * min[0] + ri * max[0];
                        pos[1] = (1 - rj) * min[1] + rj * max[1];
                        pos[2] = (1 - rk) * min[2] + rk * max[2];

                        let d = getDist(pos);

                        let q = this.getq(i, j, k);
                        this.densities[q] = d;
                    }
                }
            }

            //console.log(densities[this.getq(5,5,5)] + '=' + d.toFixed(3));

            let mc = new marchingCubes();
            let nn = vec3.fromValues(1, 0, 0);

            let bsx = (max[0] - min[0]) / (this.icount - 1);
            let bsy = (max[1] - min[1]) / (this.jcount - 1);
            let bsz = (max[2] - min[2]) / (this.kcount - 1);

            for (let i = 0; i < this.icount - 1; ++i) {
                console.log('' + i + '/' + (this.icount - 1));
                for (let j = 0; j < this.jcount - 1; ++j) {
                    for (let k = 0; k < this.kcount - 1; ++k) {
                        let q1 = this.getq(i, j, k);
                        let q2 = this.getq(i + 1, j, k);
                        let q3 = this.getq(i, j + 1, k);
                        let q4 = this.getq(i + 1, j + 1, k);
                        let q5 = this.getq(i, j, k + 1);
                        let q6 = this.getq(i + 1, j, k + 1);
                        let q7 = this.getq(i, j + 1, k + 1);
                        let q8 = this.getq(i + 1, j + 1, k + 1);

                        mc.polygonize(
                            this.densities[q1], this.densities[q2], this.densities[q3], this.densities[q4],
                            this.densities[q5], this.densities[q6], this.densities[q7], this.densities[q8],
                            nn, nn, nn, nn, nn, nn, nn, nn, 0);

                        for (let pi = 0; pi < mc.posArrayLength;) {
                            vec3.set(this.tmpVec1, bsx * (i + mc.posArray[pi++]), bsy * (j + mc.posArray[pi++]), bsz * (k + mc.posArray[pi++]));
                            vec3.set(this.tmpVec2, bsx * (i + mc.posArray[pi++]), bsy * (j + mc.posArray[pi++]), bsz * (k + mc.posArray[pi++]));
                            vec3.set(this.tmpVec3, bsx * (i + mc.posArray[pi++]), bsy * (j + mc.posArray[pi++]), bsz * (k + mc.posArray[pi++]));

                            // get material at barycentre
                            vec3.add(this.tmpVecBary, this.tmpVec2, this.tmpVec3);
                            vec3.add(this.tmpVecBary, this.tmpVecBary, this.tmpVec1);
                            vec3.scale(this.tmpVecBary, this.tmpVecBary, 1 / 3);
                            this.tmpVecBary[0] += min[0];
                            this.tmpVecBary[1] += min[1];
                            this.tmpVecBary[2] += min[2];

                            getColor(this.tmpVecBary, diffuse);
                            this.colors.push(diffuse[0], diffuse[1], diffuse[2]);

                            this.triangles.push(multiplier * this.tmpVec1[0], multiplier * this.tmpVec1[1], multiplier * this.tmpVec1[2]);
                            this.triangles.push(multiplier * this.tmpVec3[0], multiplier * this.tmpVec3[1], multiplier * this.tmpVec3[2]);
                            this.triangles.push(multiplier * this.tmpVec2[0], multiplier * this.tmpVec2[1], multiplier * this.tmpVec2[2]);

                            vec3.subtract(this.tmpVec3, this.tmpVec3, this.tmpVec1);
                            vec3.subtract(this.tmpVec2, this.tmpVec2, this.tmpVec1);
                            vec3.normalize(this.tmpVec3, this.tmpVec3);
                            vec3.normalize(this.tmpVec2, this.tmpVec2);
                            vec3.cross(this.tmpVecCross, this.tmpVec3, this.tmpVec2);
                            //vec3.normalize(this.tmpVecCross, this.tmpVecCross);

                            this.normals.push(this.tmpVecCross[0], this.tmpVecCross[1], this.tmpVecCross[2]);
                        }
                    }
                }
            }
        }


        private getq(i: number, j: number, k: number): number {
            return i + j * this.icount + k * this.icount * this.jcount;
        }
    }
}