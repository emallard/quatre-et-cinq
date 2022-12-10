module qec
{
    export interface iProfile
    {
        uniqueName: string;
        
        profileSrc:string;
        profileBounds:Float32Array;
        profileUpdated:boolean;

        profileTexture:qec.floatTexture;
        profileTextureUpdated:boolean;

        // after texture packer
        topSprite:textureSprite;
        profileSprite:textureSprite;
    }
}
