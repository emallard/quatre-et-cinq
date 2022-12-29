module qec {


    export function instanceOfSkeleton(object: any): object is iSkeleton {
        return 'uniqueName' in object
            && 'skeleton' in object;
    }

    export interface iSkeleton {
        uniqueName: string;
        skeleton: partSkeleton;
    }

    export class partSkeleton {
        inSrc: string;
        inBounds: Float32Array;
        inUpdated: boolean;

        inTexture: floatTexture;
        inTextureUpdated: boolean;
        inSprite: textureSprite;

        outSrc: string;
        outBounds: Float32Array;
        outUpdated: boolean;

        outTexture: floatTexture;
        outTextureUpdated: boolean;
        outSprite: textureSprite;

        createFrom(dto: partSkeletonDTO) {
            this.inSrc = dto.inImage;
            this.inBounds = new Float32Array(dto.inBounds);
            this.inUpdated = true;

            this.outSrc = dto.outImage;
            this.outBounds = new Float32Array(dto.outBounds);
            this.outUpdated = true;
        }
    }

    export class partSkeletonDTO {
        inImage: string;
        inBounds: number[];

        outImage: string;
        outBounds: number[];
    }
}
