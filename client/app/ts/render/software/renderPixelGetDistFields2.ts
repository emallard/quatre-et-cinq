module qec {

    export class renderPixelGetDistFields2 {
        private tmpBoundingBox = vec3.create();
        private tmp = vec3.create();
        private tmp2 = vec3.create();
        private color = vec4.create();

        getDistFields1(hd: sdFields1): distUnionCallBacks {

            return new distUnionCallBacks(
                hd,
                pos => this.getDistBoundingBox(pos, hd.boundingBox),
                () => 2,
                (posWorld, posLocal) => {
                    //return this.getDistBoundingBox(posLocal, hd.boundingBox);
                    let d0 = this.getDistTop(hd.top, posLocal);
                    let dUpperPlane = posLocal[2] - (2 * hd.boundingBox[2]);
                    let dLowerPlane = -posLocal[2];
                    return Math.max(d0, dUpperPlane, dLowerPlane);

                    if (d0 > 0) {
                        if (dUpperPlane > 0) {
                            return Math.sqrt(d0 * d0 + dUpperPlane * dUpperPlane);
                        }
                        else if (dLowerPlane > 0) {

                            return Math.sqrt(d0 * d0 + dLowerPlane * dLowerPlane);
                        }
                        return d0;
                    }
                    else {
                        if (dUpperPlane > 0) {
                            return dUpperPlane;
                        }
                        if (dLowerPlane > 0) {
                            return dLowerPlane;
                        }
                        else
                            return Math.max(d0, dUpperPlane, dLowerPlane);
                    }
                },
                (posWorld, posLocal, col) => hd.material.getColor(col)
            );
        }

        getDistFields2(hd: sdFields2): distUnionCallBacks {

            return new distUnionCallBacks(
                hd,
                pos => this.getDistBoundingBox(pos, hd.boundingBox),
                () => 2,
                (posWorld, posLocal) => {
                    //return this.getDistBoundingBox(posLocal, hd.boundingBox);
                    let d0 = this.getDistTop(hd.top, posLocal);
                    let originToPointX = posLocal[0] - hd.profileOrigin[0];
                    let originToPointY = posLocal[1] - hd.profileOrigin[1];

                    // Axis:
                    let dotProduct = originToPointX * hd.profileAxis[0] + originToPointY * hd.profileAxis[1];
                    let d1 = this.getDistProfile(hd.profile, posLocal, dotProduct);
                    return Math.max(d0, d1);
                },
                (posWorld, posLocal, col) => hd.material.getColor(col)
            );
        }


        getDistFields2Radial(hd: sdFields2Radial): distUnionCallBacks {

            return new distUnionCallBacks(
                hd,
                pos => this.getDistBoundingBox(pos, hd.boundingBox),
                () => 2,
                (posWorld, posLocal) => {
                    //return this.getDistBoundingBox(posLocal, hd.boundingBox);
                    let d0 = this.getDistTop(hd.top, posLocal);

                    // project point on axis to compute
                    let originToPointX = posLocal[0] - hd.center[0];
                    let originToPointY = posLocal[1] - hd.center[1];

                    // Axis:
                    let length = Math.sqrt(originToPointX * originToPointX + originToPointY * originToPointY);
                    let d1 = this.getDistProfile(hd.profile, posLocal, length);

                    return Math.max(d0, d1);
                },
                (posWorld, posLocal, col) => hd.material.getColor(col)
            );
        }

        getDistFields2Border(hd: sdFields2Border): distUnionCallBacks {

            return new distUnionCallBacks(
                hd,
                pos => this.getDistBoundingBox(pos, hd.boundingBox),
                () => 2,
                (posWorld, posLocal) => {
                    //return this.getDistBoundingBox(posLocal, hd.boundingBox);
                    let d0 = this.getDistTop(hd.top, posLocal);

                    let distanceFromTop = posLocal[2] - hd.thickness;
                    let d1 = this.getDistBorder(hd.border, d0, distanceFromTop);

                    let dUpperPlane = posLocal[2] - (2 * hd.boundingBox[2]);
                    let dLowerPlane = -posLocal[2];
                    return Math.max(d1, dUpperPlane, dLowerPlane);
                },
                (posWorld, posLocal, col) => hd.material.getColor(col)
            );
        }

        getDistFields2ProfileBorder(hd: sdFields2ProfileBorder): distUnionCallBacks {

            return new distUnionCallBacks(
                hd,
                pos => this.getDistBoundingBox(pos, hd.boundingBox),
                () => 2,
                (posWorld, posLocal) => {
                    //return this.getDistBoundingBox(posLocal, hd.boundingBox);
                    let d0 = this.getDistTop(hd.top, posLocal);

                    // project point on axis to compute
                    let originToPointX = posLocal[0] - hd.profileOrigin[0];
                    let originToPointY = posLocal[1] - hd.profileOrigin[1];

                    // Axis:
                    let dotProduct = originToPointX * hd.profileAxis[0] + originToPointY * hd.profileAxis[1];

                    let dTop = this.getDistProfile2(hd.profileTopBottom.profileTopSprite, hd.profileTopBottom.profileBounds, posLocal, dotProduct);
                    let dBottom = this.getDistProfile2(hd.profileTopBottom.profileBottomSprite, hd.profileTopBottom.profileBounds, posLocal, dotProduct);

                    let d1 = 0;
                    if (Math.abs(dTop) < Math.abs(dBottom)) {
                        d1 = this.getDistBorder(hd.border, d0, dTop);
                    }
                    else {
                        d1 = dBottom;
                    }


                    return Math.max(d0, d1);
                },
                (posWorld, posLocal, col) => hd.material.getColor(col)
            );
        }

        getDistTop(top: partTop, p: Float32Array): number {
            let u = (p[0] - top.topBounds[0]) / (top.topBounds[2] - top.topBounds[0]);
            let v = (p[1] - top.topBounds[1]) / (top.topBounds[3] - top.topBounds[1]);
            return this.getFieldDistanceWithSprite(top.topSprite.bigTexture, u, v, top.topSprite.bounds);
        }

        getDistTop2(topSprite: textureSprite, topBounds: Float32Array, p: Float32Array): number {
            let u = (p[0] - topBounds[0]) / (topBounds[2] - topBounds[0]);
            let v = (p[1] - topBounds[1]) / (topBounds[3] - topBounds[1]);
            return this.getFieldDistanceWithSprite(topSprite.bigTexture, u, v, topSprite.bounds);
        }

        getDistProfile(profile: partProfile, p: Float32Array, length: number) {
            let u2 = (length - profile.profileBounds[0]) / (profile.profileBounds[2] - profile.profileBounds[0]);
            let v2 = (p[2] - profile.profileBounds[1]) / (profile.profileBounds[3] - profile.profileBounds[1]);
            return this.getFieldDistanceWithSprite(profile.profileSprite.bigTexture, u2, v2, profile.profileSprite.bounds)
        }

        getDistProfile2(sprite: textureSprite, profileBounds: Float32Array, p: Float32Array, length: number) {
            let u2 = (length - profileBounds[0]) / (profileBounds[2] - profileBounds[0]);
            let v2 = (p[2] - profileBounds[1]) / (profileBounds[3] - profileBounds[1]);
            return this.getFieldDistanceWithSprite(sprite.bigTexture, u2, v2, sprite.bounds)
        }

        getDistBorder(b: partBorder, d0: number, distanceFromTop: number): number {
            let u2 = (d0 - (-b.borderBounds[2])) / ((-b.borderBounds[0]) - (-b.borderBounds[2]));
            let v2 = (distanceFromTop - (-b.borderBounds[3])) / ((-b.borderBounds[1]) - (-b.borderBounds[3]));
            return this.getFieldDistanceWithSprite(b.borderSprite.bigTexture, u2, v2, b.borderSprite.bounds);
        }

        private getFieldDistanceWithSprite(field: floatTexture, u: number, v: number, spriteBounds: Float32Array) {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);

            let u2 = mix(spriteBounds[0], spriteBounds[2], u);
            let v2 = mix(spriteBounds[1], spriteBounds[3], v);
            return this.getFieldDistance(field, u2, v2);
        }

        private getFieldDistance(field: floatTexture, u: number, v: number) {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);
            texture2D(field, u, v, this.color);
            return this.color[0];
        }


        getDistBoundingBox(pos: Float32Array, halfSize: Float32Array) {
            let dx = Math.abs(pos[0]) - halfSize[0];
            let dy = Math.abs(pos[1]) - halfSize[1];
            let dz = Math.abs(pos[2] - halfSize[2]) - halfSize[2];
            let mc = Math.max(dx, dy, dz);

            let t = this.tmp2;
            t[0] = Math.max(dx, 0);
            t[1] = Math.max(dy, 0);
            t[2] = Math.max(dz, 0);

            return Math.min(mc, 0) + vec3.length(t);
        }

    }
}