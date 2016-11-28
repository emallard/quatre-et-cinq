module qec {

    export class workspaceDto
    {
        
        editorObjects:editorObjectDto[] = [];

        svgRealSize:number[];
        importedSvgs:string[];
        selectedSvgIndex:number;

        sculpteoUuids:string[];
        
        //camera:cameraDTO[] = [];
    }
    
}