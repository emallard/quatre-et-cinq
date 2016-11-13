module qec {

    export class workspace
    {
        svgContent:string;
        editorObjects:editorObject[] = [];
        selectedIndex = -1;
        rimLight = new spotLight();
        keyLight = new spotLight();
        fillLight = new spotLight();
        
        pushObject(o:editorObject)
        {
            this.editorObjects.push(o);
            o.needsTextureUpdate = true;
            o.needsTransformUpdate = true;
            o.needsMaterialUpdate = true;
        }
    }
    
}