module qec {

    export class renderPixelGetDist
    {
        private tmp = vec3.create();
        private tmp2 = vec3.create();
        private color = vec4.create();

        generateGetDist(array:signedDistance[]) : (Float32Array) => number
        {
            console.log('generate get dist');
            let inner: ((Float32Array, number) => number)[] = [];
            for (let sd of array)
            {
                if (sd instanceof sdFields1)
                {
                    let captured:sdFields1 = sd;
                    inner.push((x,y) => this.getDistFields1(captured, x, y));
                }
                else if (sd instanceof sdFields2)
                {
                    let captured:sdFields2 = sd;
                    inner.push((x,y) => this.getDistFields2(captured, x, y));
                }
                else if (sd instanceof sdFields2Radial)
                {
                    let captured:sdFields2Radial = sd;
                    inner.push((x,y) => this.getDistFields2Radial(captured, x, y));
                }
                else
                {
                    throw new Error("Not Implemented");
                }
            }
            return pos => this.getUnionDist(pos, inner);
        }

        getDistFields1(hd: sdFields1, pos:Float32Array, d:number)
        {
            vec3.transformMat4(this.tmp, pos, hd.inverseTransform);
            this.tmp[2] -= 0.5*(hd.thickness)
            let boxDist = this.getDistBoundingBox(this.tmp, hd.boundingBox);

            if (boxDist > d)
                return d;

            if (boxDist > 2)
                return boxDist;

            this.tmp[2] += 0.5*(hd.thickness)
            var p = this.tmp;
            
            
            var u = (p[0] - hd.topBounds[0]) / (hd.topBounds[2] - hd.topBounds[0]);
            var v = (p[1] - hd.topBounds[1]) / (hd.topBounds[3] - hd.topBounds[1]);
            var d0 = this.getFieldDistanceWithSprite(hd.topSprite.bigTexture, u, v, hd.topSprite.bounds);

            var dToUpperPlane = p[2] - hd.thickness;
            var dToLowerPlane = 0 - p[2];

            if (dToUpperPlane > d0) d0 = dToUpperPlane;
            if (dToLowerPlane > d0) d0 = dToLowerPlane;
            
            return d0;
        }

        getDistFields2(hd: sdFields2, pos:Float32Array, d:number)
        {
            vec3.transformMat4(this.tmp, pos, hd.inverseTransform);
            this.tmp[2] -= 0.5*(hd.profileBounds[3] - hd.profileBounds[1])
            let boxDist = this.getDistBoundingBox(this.tmp, hd.boundingBox);

            
            if (boxDist > d)
                return d;

            if (boxDist > 2)
                return boxDist;
            

            this.tmp[2] += 0.5*(hd.profileBounds[3] - hd.profileBounds[1])
            var p = this.tmp;
            
            
            var u = (p[0] - hd.topBounds[0]) / (hd.topBounds[2] - hd.topBounds[0]);
            var v = (p[1] - hd.topBounds[1]) / (hd.topBounds[3] - hd.topBounds[1]);
            var d0 = this.getFieldDistanceWithSprite(hd.topSprite.bigTexture, u, v, hd.topSprite.bounds);


            // project point on axis to compute
            let originToPointX = p[0]-hd.profileOrigin[0];
            let originToPointY = p[1]-hd.profileOrigin[1];

            // Axis:
            let dotProduct = originToPointX*hd.profileAxis[0] + originToPointY*hd.profileAxis[1];
            let u2 = (dotProduct - hd.profileBounds[0]) / (hd.profileBounds[2] - hd.profileBounds[0]);
            let v2 = (p[2] - hd.profileBounds[1]) / (hd.profileBounds[3] - hd.profileBounds[1]);
            let d1 = this.getFieldDistanceWithSprite(hd.profileSprite.bigTexture, u2, v2, hd.profileSprite.bounds)

            return Math.min(d, Math.max(d1, boxDist));
        }

        getDistFields2Radial(hd: sdFields2Radial, pos:Float32Array, d:number)
        {
            vec3.transformMat4(this.tmp, pos, hd.inverseTransform);
            this.tmp[2] -= 0.5*(hd.profileBounds[3] - hd.profileBounds[1])
            let boxDist = this.getDistBoundingBox(this.tmp, hd.boundingBox);

            
            if (boxDist > d)
                return d;

            if (boxDist > 2)
                return boxDist;
            

            this.tmp[2] += 0.5*(hd.profileBounds[3] - hd.profileBounds[1])
            var p = this.tmp;
            
            
            var u = (p[0] - hd.topBounds[0]) / (hd.topBounds[2] - hd.topBounds[0]);
            var v = (p[1] - hd.topBounds[1]) / (hd.topBounds[3] - hd.topBounds[1]);
            var d0 = this.getFieldDistanceWithSprite(hd.topSprite.bigTexture, u, v, hd.topSprite.bounds);


            // project point on axis to compute
            let originToPointX = p[0]-hd.center[0];
            let originToPointY = p[1]-hd.center[1];

            // Axis:
            let length = Math.sqrt(originToPointX*originToPointX + originToPointY*originToPointY);
            let u2 = (length - hd.profileBounds[0]) / (hd.profileBounds[2] - hd.profileBounds[0]);
            let v2 = (p[2] - hd.profileBounds[1]) / (hd.profileBounds[3] - hd.profileBounds[1]);
            let d1 = this.getFieldDistanceWithSprite(hd.profileSprite.bigTexture, u2, v2, hd.profileSprite.bounds)

            return Math.min(d, Math.max(d0, d1, boxDist));
        }

        getUnionDist(pos:Float32Array, inner: ((Float32Array, number) => number)[]) : number
        {
            var d = 66666;
            for (let f of inner)
            {
                d = f(pos, d);
            }
            return d;
        }


        private getFieldDistance(field:floatTexture, u:number, v:number)
        {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);
            texture2D(field, u, v, this.color);
            return this.color[0];
        }

        private getFieldDistanceWithSprite(field:floatTexture, u:number, v:number, spriteBounds:Float32Array)
        {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);

            var u2 = mix(spriteBounds[0], spriteBounds[2], u);
            var v2 = mix(spriteBounds[1], spriteBounds[3], v);
            return this.getFieldDistance(field, u2, v2);
        }

        getDistBoundingBox(pos: Float32Array, halfSize:Float32Array)
        {
            var dx = Math.abs(pos[0]) - halfSize[0];
            var dy = Math.abs(pos[1]) - halfSize[1];
            var dz = Math.abs(pos[2]) - halfSize[2];
            var mc = Math.max(dx, dy, dz);

            var t = this.tmp2;
            t[0] = Math.max(dx, 0);
            t[1] = Math.max(dy, 0);
            t[2] = Math.max(dz, 0);
            
            return Math.min(mc, 0) + vec3.length(t);
        }
    }
}