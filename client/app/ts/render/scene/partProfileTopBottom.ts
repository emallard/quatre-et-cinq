module qec {
    export function instanceOfProfileTopBottom(object: any): object is iProfileTopBottom {
        return 'uniqueName' in object
            && 'profileTopBottom' in object;
    }

    export interface iProfileTopBottom {
        uniqueName: string;
        profileTopBottom: partProfileTopBottom;
    }

    export class partProfileTopBottom {
        profileSrc: string;
        profileBounds: Float32Array;
        profileUpdated: boolean;

        profileTopTexture: floatTexture;
        profileBottomTexture: floatTexture;
        profileTextureUpdated: boolean;

        profileTopSprite: textureSprite;
        profileBottomSprite: textureSprite;

        createFrom(dto: partProfileDTO) {
            this.profileSrc = dto.profileSrc;
            this.profileBounds = new Float32Array(dto.profileBounds);
            this.profileUpdated = true;
        }
    }
}
