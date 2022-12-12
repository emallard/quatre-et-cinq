module qec
{
    export interface iBorder
    {
        uniqueName: string;
        borderSrc:string;
        borderBounds:Float32Array;
        borderUpdated:boolean;
        borderTexture:floatTexture;
        borderTextureUpdated:boolean;
    }
}