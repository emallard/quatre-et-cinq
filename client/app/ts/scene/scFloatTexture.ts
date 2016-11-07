module qec
{
    /*
    export class scFloatTextureDTO
    {
        type:string;
        src:string;
        halfSize:number[];
    }

    export class scFloatTexture
    {
        src:string;
        halfSize = vec2.create();
        texture:floatTexture;

        
        createAsyncFrom_test(dto:scFloatTextureDTO, done:()=>void)
        {
            var dfCanvas = new distanceFieldCanvas();
            
            if (dto.src.indexOf('profile') != -1)
                dfCanvas.initDisc(400, 0.1, 0.2, 0.2);
            else
                dfCanvas.initSquare(400, 0.5, 2, 2);

            
            vec2.copy(this.halfSize, dfCanvas.distanceField.halfSize);
            
            this.texture = createFloatTextureFromDistanceField(dfCanvas.distanceField);
            done();
        }
        
        createAsyncFrom(dto:scFloatTextureDTO, done:()=>void)
        {
            //this.halfSize = new Float32Array(dto.halfSize);
            var dfCanvas = new distanceFieldCanvas();
            dfCanvas.computeDistanceFieldFromSrcs(dto.src, dto.halfSize[0], dto.halfSize[1], ()=>{

                vec2.copy(this.halfSize, dfCanvas.distanceField.halfSize);
                console.log('createAsyncFrom : ' + dto.src + ' halfSize : ' + vec2.str(this.halfSize));


                this.texture = createFloatTextureFromDistanceField(dfCanvas.distanceField);
                done();
            });
            
        };

    }
    */
}