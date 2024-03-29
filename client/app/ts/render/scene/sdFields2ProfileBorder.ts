module qec {


    export class sdFields2ProfileBorderDTO {
        static TYPE: string = 'sdFields2ProfileBorderDTO';
        type: string = sdFields2ProfileBorderDTO.TYPE;
        svgId: string;
        top: partTopDTO;

        profile: partProfileDTO;
        profileOrigin: number[];
        profileAxis: number[];

        border: partBorderDTO;

        material: materialDTO;
        transform: Float32Array;
    }


    export class sdFields2ProfileBorder implements signedDistance, iTop, iProfileTopBottom, iBorder {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        transform = mat4.create();
        inverseTransform = mat4.identity(mat4.create());
        material = new material();
        top: partTop = new partTop();
        profileTopBottom: partProfileTopBottom = new partProfileTopBottom();
        profileOrigin: Float32Array;
        profileAxis: Float32Array;
        border: partBorder = new partBorder();

        boundingBox: Float32Array;

        createFrom(dto: sdFields2ProfileBorderDTO): sdFields2ProfileBorder {
            this.svgId = dto.svgId;
            this.top.createFrom(dto.top);
            this.profileTopBottom.createFrom(dto.profile);
            this.profileOrigin = new Float32Array(dto.profileOrigin);
            this.profileAxis = new Float32Array(dto.profileAxis);
            vec2.normalize(this.profileAxis, this.profileAxis);
            this.border.createFrom(dto.border);

            this.material.createFrom(dto.material);
            mat4.copy(this.transform, dto.transform);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            this.boundingBox = new Float32Array([
                0.5 * (this.top.topBounds[2] - this.top.topBounds[0]),
                0.5 * (this.top.topBounds[3] - this.top.topBounds[1]),
                0.5 * (this.profileTopBottom.profileBounds[3] - this.profileTopBottom.profileBounds[1])]);

            return this;
        }

        getDist3(minDist: number, pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            return 6666;
            /*
            //vec3.set(this.tmp, 68, 156, 0);

            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            this.tmp[2] -= 0.5*(this.thickness)
            let boxDist = this.sdBox.getDist(this.tmp, false, false);
            if (boxDist > minDist)
                return minDist;

            if (boxDist > 2)
                return boxDist;


            this.debug = debug;
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            var p = this.tmp;
            
            //if (this.debug)
            //    console.log('boundingCenterAndHalfSize : ' + float32ArrayToString(this.boundingCenterAndHalfSize));

            if (boundingBox)
            {
                var distToBbox = this.sdBox.getDist(p, false,debug);
                return distToBbox;
            }
            var d = 0;

            var u = (p[0] - this.topBounds[0]) / (this.topBounds[2] - this.topBounds[0]);
            var v = (p[1] - this.topBounds[1]) / (this.topBounds[3] - this.topBounds[1]);
            var d0 = this.getFieldDistance(this.topTexture, u, v);
            d = d0;
                        
            var dToUpperPlane = p[2] - this.thickness;
            var dToLowerPlane = 0 - p[2];
            if (dToUpperPlane > d) d = dToUpperPlane;
            if (dToLowerPlane > d) d = dToLowerPlane;
            
            return d;
            */
        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number { return 66666; }

        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number { return 66666; }

        getMaterial(pos: Float32Array): material {
            return this.material
        }

        getInverseTransform(out: Float32Array) {
            return this.inverseTransform;
        }

        getTransform(out: Float32Array) {
            mat4.copy(out, this.transform);
        }

        getBounds(min: Float32Array, max: Float32Array) {
            for (let i = 0; i < 2; ++i) {
                min[i] = -this.boundingBox[i];
                max[i] = this.boundingBox[i];
            }
            min[2] = 0;
            max[2] = this.boundingBox[2] * 2;
        }
    }
}