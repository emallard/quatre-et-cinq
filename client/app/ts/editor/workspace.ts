module qec {

    export class workspace {
        svgRealSize = vec2.fromValues(1, 1);
        editorObjects: editorObject[] = [];
        selectedIndex = -1;
        rimLight = new spotLight();
        keyLight = new spotLight();
        fillLight = new spotLight();

        importedSvgs: string[] = []
        selectedSvgIndex: number = -1;
        sculpteoUuids: string[] = [];

        toDto(): workspaceDto {
            var dto = new workspaceDto();
            dto.editorObjects = this.editorObjects.map(o => o.toDto());
            dto.importedSvgs = this.importedSvgs;
            dto.selectedSvgIndex = this.selectedSvgIndex;
            dto.sculpteoUuids = this.sculpteoUuids;
            return dto;
        }

        pushObject(o: editorObject) {
            this.editorObjects.push(o);
            o.needsTextureUpdate = true;
            o.needsTransformUpdate = true;
            o.needsMaterialUpdate = true;
        }

        selectedObject(): editorObject {
            if (this.selectedIndex == -1)
                return null;
            return this.editorObjects[this.selectedIndex];
        }
    }

}