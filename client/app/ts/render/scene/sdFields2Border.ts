module qec {


    export class sdFields2BorderDTO {
        static TYPE: string = 'sdFields2BorderDTO';
        type: string = sdFields2BorderDTO.TYPE;
        svgId: string;
        top: partTopDTO;
        thickness: number;

        border: partBorderDTO;

        material: materialDTO;
        transform: Float32Array;
    }


    export class sdFields2Border implements signedDistance, iTop, iBorder {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        transform = mat4.create();
        inverseTransform = mat4.identity(mat4.create());
        material = new material();
        top: partTop = new partTop();

        thickness: number;

        border: partBorder = new partBorder();

        boundingBox: Float32Array;


        createFrom(dto: sdFields2BorderDTO): sdFields2Border {
            this.svgId = dto.svgId;
            this.top.createFrom(dto.top);

            this.thickness = dto.thickness;

            this.border.createFrom(dto.border);

            this.material.createFrom(dto.material);
            mat4.copy(this.transform, dto.transform);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            this.boundingBox = new Float32Array([
                0.5 * (this.top.topBounds[2] - this.top.topBounds[0]),
                0.5 * (this.top.topBounds[3] - this.top.topBounds[1]),
                0.5 * (this.thickness)]);

            return this;
        }

        getDist3(minDist: number, pos: Float32Array, boundingBox: boolean, debug: boolean): number {
            return 6666;

        }

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number { return 66666; }

        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number { return 66666; }

        getMaterial(pos: Float32Array): material {
            return this.material
        }

        getInverseTransform(out: Float32Array) {
            return this.inverseTransform;
        }
    }
}