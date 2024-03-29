module qec {

    export class renderPixelGetDistPrimitives {
        tmp = vec3.create();
        tmpBoundingBox = vec3.create();

        getDistGrid(hd: sdGrid, pos: Float32Array, d: number, col: Float32Array): number {
            vec3.transformMat4(this.tmp, pos, hd.inverseTransform);
            let p = this.tmp;
            let boxDist = this.getDistBoundingBox(p, hd.boundingBox);

            if (boxDist > d)
                return d;

            let d0 = 0.5 * hd.size - Math.abs(fmod(p[0], hd.size) - 0.5 * hd.size);
            let d1 = 0.5 * hd.size - Math.abs(fmod(p[1], hd.size) - 0.5 * hd.size);
            var dMin = Math.min(d0, d1);
            dMin -= hd.thickness;
            let dGrid = Math.max(boxDist, dMin);
            let result = Math.min(d, dGrid);
            if (col != null && result < d) {
                vec3.copy(col, hd.material.diffuse);
            }
            return result;
        }


        public getDistBoundingBox(pos: Float32Array, halfSize: Float32Array) {
            let dx = Math.abs(pos[0]) - halfSize[0];
            let dy = Math.abs(pos[1]) - halfSize[1];
            let dz = Math.abs(pos[2]) - halfSize[2];
            let mc = Math.max(dx, dy, dz);

            let tmp = this.tmpBoundingBox;
            tmp[0] = Math.max(dx, 0);
            tmp[1] = Math.max(dy, 0);
            tmp[2] = Math.max(dz, 0);

            return Math.min(mc, 0) + vec3.length(tmp);
        }
    }
}