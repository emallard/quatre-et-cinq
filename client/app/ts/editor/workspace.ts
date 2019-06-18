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

        getSelectedObject(): editorObject {
            if (this.selectedIndex == -1)
                return null;
            return this.editorObjects[this.selectedIndex];
        }

        getObjectByName(name: string): editorObject {
            for (let o of this.editorObjects) {
                if (o.name == name)
                    return o;
            }
            return null;
        }

        getObjectIndex(name: string): number {
            for (let i = 0; i < this.editorObjects.length; ++i) {
                if (this.editorObjects[i].name == name)
                    return i;
            }
            return -1;
        }

    }
}