module qec
{
    export function instanceOfProfile(object: any): object is iProfile {
        return 'uniqueName' in object
        && 'profile' in object;
    }

    export interface iProfile
    {
        uniqueName: string;
        profile: partProfile;
    }

    export class partProfile
    {
        
        profileSrc:string;
        profileBounds:Float32Array;
        profileUpdated:boolean;

        profileTexture:floatTexture;
        profileTextureUpdated:boolean;
        profileSprite:textureSprite;

        createFrom(dto:partProfileDTO)
        {
            this.profileSrc = dto.profileImage.src;
            this.profileBounds = new Float32Array(dto.profileBounds);
            this.profileUpdated = true;
        }
    }

    export class partProfileDTO
    {
        profileImage:scImageDTO;
        profileBounds:number[];
    }
}
