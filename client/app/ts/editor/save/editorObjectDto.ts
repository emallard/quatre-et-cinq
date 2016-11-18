module qec {

    export class editorObjectDto
    {
        topSvgId:string;
        
        diffuseColor:number[];
        zTranslate:number;

        profilePoints:number[][] = [];
        profileBounds:number[];
        profileSmooth:boolean;
    }
   
}