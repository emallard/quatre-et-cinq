module qec 
{
/*
    export interface material
    {
        getColor(pos: Float32Array, out:Float32Array);
    }
*/
    export class materialDTO
    {
        static TYPE:string = "materialDTO";
        type:string;
        diffuse:number[];
    }

    export class material
    {
        diffuse = vec3.create();

        createFrom(dto:materialDTO)
        {
            vec3FromArray(this.diffuse, dto.diffuse);
        }

        getColor(out:Float32Array)
        {
            vec3.copy(out, this.diffuse);
        }

        setDiffuse(r:number, g:number, b:number)
        {
            vec3.set(this.diffuse, r, g, b);
        }
    }
}