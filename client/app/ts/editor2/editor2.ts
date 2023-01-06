module qec {

    export class editor2 {

        root: HTMLDivElement;
        partsElt: HTMLElement;
        propertiesElt: HTMLElement;
        svgElt: HTMLElement;
        rendererElt: HTMLElement;

        scene: scSceneDTO;

        selectedObjectName: string;
        selectedObjectDTO: any;

        view3d: editor2_view3d;

        constructor() {
            this.root = document.createElement('div');

            let menu = new editor_menu();

            this.root.innerHTML = `
            <div style="position:fixed;top:50px;left:0px;width:50%;border:solid black 1px">
                <div class="partList">
                
                </div>
                <div class="properties" style="width:100%;height:100%">

                </div>
                
            </div>

            <div style="position:fixed;top:50px;left:50%;width:50%;border:solid black 1px">
                <div class="svg">
                </div>
            </div>


            <div class="renderer" style="position:fixed;top:calc(50% + 50px);bottom:0px;left:0px;right:0px;border:solid red 1px"">
            </div>`;

            this.partsElt = this.root.querySelector('.partList');
            this.propertiesElt = this.root.querySelector('.properties');
            this.svgElt = this.root.querySelector('.svg');
            this.rendererElt = this.root.querySelector('.renderer');

            this.root.appendChild(menu.root);
            //this.root.querySelector('.parts').appendChild
            document.body.appendChild(this.root);


            this.view3d = new editor2_view3d();
            this.view3d.setRendererElt(this.rendererElt);

            let svg = getParameterByName('svg', null);
            if (svg != null)
                this.load(svg);
        }

        load(url: string,) {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.onreadystatechange = () => {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        new svgSceneLoader().loadContent(req.responseText, x => this.updateScene(x, req.responseText));
                    }
                    else {
                        console.error("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            req.send(null);
        }

        updateScene(scene: scSceneDTO, svgContent: string) {
            this.scene = scene;
            console.log('updateScene', scene);
            let root: sdUnionDTO = scene.dtos.find(x => x.type == sdUnionDTO.TYPE);

            this.partsElt.innerHTML = `
            <select>
                <option value=''>select an object</option>
                ${root.array.map(x => `<option value="${x.svgId}">${x.svgId}</option>`).join()}
            </select>`;

            let select: HTMLSelectElement = this.partsElt.querySelectorAll('select')[0];
            select.addEventListener('change', () => {
                this.selectObject(select.selectedOptions[0].value);
            });

            // Set SVG content
            this.svgElt.innerHTML = svgContent;
            this.svgElt.children[0].setAttribute('width', '100%');

            // Render
            let loaded: any[] = sceneLoader.load(this.scene.dtos);
            this.view3d.setSdRoot(loaded.find(x => x instanceof sdUnion));
        }

        selectObject(objectName: string) {
            console.log('select object ' + objectName);
            this.selectedObjectName = objectName;
            this.selectedObjectDTO = getAllSignedDistances.getAllDTO(this.scene.dtos).find(x => x.svgId == objectName);
            if (this.selectedObjectDTO == null)
                alert(`can't find ${objectName}`);

            console.log('select objectDTO ', this.selectedObjectDTO);
            this.updateProperties();
        }

        updateProperties() {
            let o = this.selectedObjectDTO;
            this.propertiesElt.innerHTML = `
            thickness: <input type="number" value="${o.thickness}">
            `;

            let inputElt: HTMLInputElement = this.propertiesElt.querySelector('input');
            inputElt.addEventListener('change', () => this.updateThickness(this.selectedObjectName, inputElt.valueAsNumber));
        }


        updateThickness(objectName: string, value: number) {
            let sd = getAllSignedDistances.getAll(this.view3d.sdRoot).find(x => x.svgId == objectName);
            //console.log('updateThickness ', sd, value);
            let sd1 = <sdFields1>sd;
            sd1.thickness = value;
            sd1.updateBoundingBox();
            this.view3d.setRenderFlag();
        }


    }
}