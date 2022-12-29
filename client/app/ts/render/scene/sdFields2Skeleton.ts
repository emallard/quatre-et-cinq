module qec {


    export class sdFields2SkeletonDTO {
        static TYPE: string = 'sdFields2SkeletonDTO';
        type: string = sdFields2SkeletonDTO.TYPE;
        svgId: string;

        top: partTopDTO;
        profile: partProfileDTO;
        skeleton: partSkeletonDTO;

        material: materialDTO;
        transform: Float32Array;
    }


    export class sdFields2Skeleton implements signedDistance, iTop, iProfile {
        isSignedDistance = true;
        svgId: string;
        uniqueName: string = uniqueName.new();

        transform = mat4.create();
        inverseTransform = mat4.identity(mat4.create());
        material = new material();

        top: partTop = new partTop();
        profile: partProfile = new partProfile();
        skeleton: partSkeleton = new partSkeleton();

        boundingBox: Float32Array;

        createFrom(dto: sdFields2SkeletonDTO): sdFields2Skeleton {
            this.svgId = dto.svgId;
            this.top.createFrom(dto.top);
            this.profile.createFrom(dto.profile);
            this.skeleton.createFrom(dto.skeleton);

            this.material.createFrom(dto.material);
            mat4.copy(this.transform, dto.transform);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            this.boundingBox = new Float32Array([
                0.5 * (this.top.topBounds[2] - this.top.topBounds[0]),
                0.5 * (this.top.topBounds[3] - this.top.topBounds[1]),
                0.5 * (this.profile.profileBounds[3] - this.profile.profileBounds[1])]);

            return this;
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