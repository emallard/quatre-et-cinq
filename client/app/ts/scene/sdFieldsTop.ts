module qec
{
    export interface iTop
    {
        uniqueName: string;
        topSrc:string;
        topBounds:Float32Array;
        topUpdated:boolean;
        topTexture:floatTexture;
        topTextureUpdated:boolean;
    }
}