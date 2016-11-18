module qec {

    export class workspaceDto
    {
        svgContent:string;
        svgRealSize:number[];
        
        editorObjects:editorObjectDto[] = [];
        //camera:cameraDTO[] = [];
    }
    
}