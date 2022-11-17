module qec
{
    
    export class scImageDTO
    {
        type:string = 'scImageDTO';
        src:string;
    }

    export class scImage
    {
        src:string;
        image: HTMLImageElement;
        
        createAsyncFrom(dto:scImageDTO, done:()=>void)
        {
            var img = new Image();
            img.onload = () => { 
                this.image = img; 
                done();
            };
            img.src = dto.src;
        };

    }
}