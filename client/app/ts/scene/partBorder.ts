module qec
{
    export function instanceOfBorder(object: any): object is iBorder {
        return 'uniqueName' in object
        && 'border' in object;
    }

    export interface iBorder
    {
        uniqueName: string;
        border: partBorder;
        
    }

    export class partBorder
    {
        borderSrc:string;
        borderBounds:Float32Array;
        borderUpdated:boolean;
        borderTexture:floatTexture;
        borderTextureUpdated:boolean;
        borderSprite:textureSprite;

        createFrom(dto:partBorderDTO)
        {
            this.borderSrc = dto.borderImage.src;
            this.borderBounds = new Float32Array(dto.borderBounds);
            this.borderUpdated = true;
        }
    }

    export class partBorderDTO
    {
        borderImage:scImageDTO;
        borderBounds:number[];
    }
}