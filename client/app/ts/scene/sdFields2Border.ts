module qec {


    export class sdFields2BorderDTO
    {
        static TYPE:string = 'sdFields2BorderDTO';
        type:string = sdFields2BorderDTO.TYPE;
        topImage:scImageDTO;
        topBounds:number[];
        thickness:number;
        
        borderImage:scImageDTO;
        borderBounds:number[];

        material: materialDTO;
        transform:Float32Array;
    }

    
    export class sdFields2Border implements signedDistance, iTop, iBorder
    {
        uniqueName:string = uniqueName.new();

        transform:Float32Array;
        inverseTransform = mat4.identity(mat4.create());
        material = new material();
        topSrc:string;
        topBounds:Float32Array;
        topUpdated:boolean;

        thickness: number;

        borderSrc:string;
        borderBounds:Float32Array;
        borderUpdated:boolean;

        boundingBox: Float32Array;

        topTexture:floatTexture;
        topTextureUpdated:boolean;

        borderTexture:floatTexture;
        borderTextureUpdated:boolean;

        // after texture packer
        topSprite:textureSprite;
        borderSprite:textureSprite;


        createFrom(dto:sdFields2BorderDTO)
        {
            this.topBounds = new Float32Array(dto.topBounds);
            this.topSrc = dto.topImage.src;

            this.thickness = dto.thickness;

            this.borderSrc = dto.borderImage.src;
            this.borderBounds = new Float32Array(dto.borderBounds);

            this.material.createFrom(dto.material);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);

            this.boundingBox = new Float32Array([
                0.5*(this.topBounds[2] - this.topBounds[0]), 
                0.5*(this.topBounds[3] - this.topBounds[1]), 
                0.5*(this.thickness)]);

            // update flag
            this.topUpdated = true;
            this.borderUpdated = true;
        }

        getDist3(minDist:number, pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            return 6666;
            
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number {return 66666;}

        getDist2(pos: Float32Array, rd:Float32Array, boundingBox:boolean, debug:boolean):number {return 66666;}
        
        getMaterial(pos:Float32Array):material
        {
            return this.material
        }

        getInverseTransform(out: Float32Array)
        {
            return this.inverseTransform;
        }
    }
}