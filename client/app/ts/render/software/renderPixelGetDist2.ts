module qec {

    export class renderPixelGetDist2 {
        getDistFields = new renderPixelGetDistFields();
        getDistFields2 = new renderPixelGetDistFields2();
        getDistPrimitives = new renderPixelGetDistPrimitives();

        generateGetDistAndGetColor(sd: signedDistance):
            [(pos: Float32Array) => number, (pos: Float32Array, col: Float32Array) => void] {
            let c = this.getDistUnionCallBacks(sd);
            return [p => c.dist(p, null), (p, out) => c.color(p, null, out)];
        }

        getDistUnionCallBacks(sd: signedDistance): distUnionCallBacks {

            if (sd instanceof sdFields1)
                return this.getDistFields2.getDistFields1(sd);
            else if (sd instanceof sdFields2)
                return this.getDistFields2.getDistFields2(sd);
            else if (sd instanceof sdFields2Radial)
                return this.getDistFields2.getDistFields2Radial(sd);
            else if (sd instanceof sdFields2Border)
                return this.getDistFields2.getDistFields2Border(sd);
            else if (sd instanceof sdFields2ProfileBorder)
                return this.getDistFields2.getDistFields2ProfileBorder(sd);
            //else if (sd instanceof sdFields2Skeleton)
            //    return this.getDistFields2.getDistFields2Skeleton(sd);

            else if (sd instanceof sdSubtraction) {
                let tmpA = vec3.create();
                let tmpB = vec3.create();

                let callbacksA = this.getDistUnionCallBacks(sd.A);
                let callbacksB = this.getDistUnionCallBacks(sd.B);
                return new distUnionCallBacks(
                    sd,
                    callbacksA.distToBoundingVolume,
                    callbacksA.distToBeMorePrecise,
                    (posWorld, posLocal) => {
                        vec3.transformMat4(tmpA, posWorld, callbacksA.sd.inverseTransform);
                        vec3.transformMat4(tmpB, posWorld, callbacksB.sd.inverseTransform);
                        let dB = callbacksB.dist(posWorld, tmpB);
                        let dA = callbacksA.dist(posWorld, tmpA);
                        return Math.max(dA, -dB)
                        //return dB;
                        //return Math.min(dA, dB);
                    },
                    callbacksA.color
                );
            }

            else if (sd instanceof sdUnion) {
                let callbacks = sd.array.map(x => this.getDistUnionCallBacks(x));

                let tmp = vec3.create();
                // compute bounding box
                return new distUnionCallBacks(
                    sd,
                    pos => this.getDistPrimitives.getDistBoundingBox(pos, sd.boundingBox),
                    () => Infinity,
                    (posWorld, posLocal) => {
                        let d = 666666;
                        for (let c of callbacks) {

                            if (c.sd['zMirror'] == true) {
                                let blah = 0;
                            }

                            vec3.transformMat4(tmp, posWorld, c.sd.inverseTransform);
                            let distToBeMorePrecise = c.distToBeMorePrecise();
                            let distToBbox = c.distToBoundingVolume(tmp);
                            if (distToBbox < d || distToBeMorePrecise == Infinity) {

                                if (d != 666666) {
                                    let blah = 0;
                                }
                                if (distToBbox > distToBeMorePrecise) {
                                    d = distToBbox;
                                }
                                else {
                                    let d0 = c.dist(posWorld, tmp);
                                    //let d1 = Math.max(distToBbox, d0);
                                    d = Math.min(d, d0);
                                }
                            }
                        }
                        return d;
                    },
                    (posWorld, posLocal: Float32Array, outCol: Float32Array) => {
                        let d = 666666;
                        for (let c of callbacks) {
                            vec3.transformMat4(tmp, posWorld, c.sd.inverseTransform);
                            let distToBbox = c.distToBoundingVolume(tmp);
                            let distToBeMorePrecise = c.distToBeMorePrecise();
                            if (distToBbox < d || distToBeMorePrecise == Infinity) {
                                if (distToBbox > c.distToBeMorePrecise()) {
                                    d = distToBbox;
                                }
                                else {
                                    let d0 = c.dist(posWorld, tmp);
                                    //let d1 = Math.max(distToBbox, d0);
                                    if (d0 < d) {
                                        c.color(posWorld, tmp, outCol);
                                        d = d0;
                                    }
                                }
                            }

                        }
                        return d;
                    },
                );
            }
        }
    }

    export class distUnionCallBacks {

        constructor(
            public sd: signedDistance,
            public distToBoundingVolume: (posLocal: Float32Array) => number,
            public distToBeMorePrecise: () => number,
            public dist: (posWorld: Float32Array, posLocal: Float32Array) => number,
            public color: (posWorld: Float32Array, posLocal: Float32Array, col: Float32Array) => void
        ) { }


    }

    //export class distCallBacks {
    //    boundingBox: Float32Array;
    //    dist: (pos: Float32Array) => number;
    //    color: (pos: Float32Array, col: Float32Array) => void;
    //}
}