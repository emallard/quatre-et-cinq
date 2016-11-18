module qec {

    export class workspace
    {
        svgContent:string;
        svgRealSize = vec2.fromValues(1, 1);
        editorObjects:editorObject[] = [];
        selectedIndex = -1;
        rimLight = new spotLight();
        keyLight = new spotLight();
        fillLight = new spotLight();
        
        toDto():workspaceDto
        {
            var dto = new workspaceDto();
            dto.svgContent = this.svgContent;
            dto.editorObjects = this.editorObjects.map(o => o.toDto());
            return dto;
        }

        pushObject(o:editorObject)
        {
            this.editorObjects.push(o);
            o.needsTextureUpdate = true;
            o.needsTransformUpdate = true;
            o.needsMaterialUpdate = true;
        }
    }
    
}