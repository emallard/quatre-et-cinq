module qec
{
    export function instanceOfTop(object: any): object is iTop {
        return 'uniqueName' in object
        && 'top' in object;
    }

    export interface iTop
    {
        uniqueName: string;
        top: partTop;
    }

    export class partTop
    {
        topSrc:string;
        topBounds:Float32Array;
        topUpdated:boolean;
        topTexture:floatTexture;
        topTextureUpdated:boolean;
        topSprite:textureSprite;

        createFrom(dto:partTopDTO)
        {
            this.topSrc = dto.topImage.src;
            this.topBounds = new Float32Array(dto.topBounds);
            this.topUpdated = true;
        }
    }

    export class partTopDTO
    {
        topImage:scImageDTO;
        topBounds:number[];
    }
}