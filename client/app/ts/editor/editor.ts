module qec
{
    export class editor
    {
        renderer:irenderer;
        simpleRenderer:simpleRenderer = injectNew(simpleRenderer);
        hardwareRenderer:hardwareRenderer = injectNew(hardwareRenderer);
        svgImporter: svgImporter = inject(svgImporter);
        
        exportSTL:exportSTL = inject(exportSTL);
        exportOBJ:exportOBJ = inject(exportOBJ);
        signedDistanceToTriangles:signedDistanceToTriangles = inject(signedDistanceToTriangles);

        renderSettings = new renderSettings();        
        workspace:workspace = inject(workspace);
        sdUnion = new sdUnion();

        renderFlag = false;
        updateFlag = false;
        showBoundingBox = false;

        sdGround = new sdBox();
        groundVisible = false;
        
        init(containerElt:HTMLElement)
        {
            var simple = false;

            this.simpleRenderer = new simpleRenderer();
            this.simpleRenderer.setContainerAndSize(containerElt, 300, 300);
            this.simpleRenderer.canvas.style.display = 'none';
        
            this.hardwareRenderer = new hardwareRenderer();
            this.hardwareRenderer.setContainerAndSize(containerElt, window.innerWidth-402, window.innerHeight-102);
            this.setSimpleRenderer(simple);
            
            this.renderSettings.camera.setCam(vec3.fromValues(0, -1, 3), vec3.fromValues(0,0,0), vec3.fromValues(0,0,1));
            
            this.workspace.rimLight.createFrom({
                type: 'spotLightDTO',
                position: [2, 2, 0.5],
                direction : [-1, -1, 0.1],
                intensity : 0.2
            });

            this.workspace.keyLight.createFrom({
                type: 'spotLightDTO',
                position: [-1, -1, 5],
                direction : [0,0,0],
                intensity : 0.8
            });

            this.workspace.fillLight.createFrom({
                type: 'spotLightDTO',
                position: [2, -2, 0.5],
                direction : [-1, 1, -1],
                intensity : 0.2
            });
            
            this.renderSettings.spotLights.push(this.workspace.keyLight, this.workspace.fillLight, this.workspace.rimLight);
               
            this.sdGround = new sdBox();
            this.sdGround.getMaterial(null).setDiffuse(0.8,0.8,0.8);
            this.sdGround.setHalfSize(2, 2, 0.01);
        }

        setSelectedIndex(index: number)
        {
            this.workspace.selectedIndex = index;
            this.workspace.editorObjects.forEach((o, i) => {
                o.setSelected(i == index);
                this.renderer.updateDiffuse(o.sd);
            });
            this.setRenderFlag();
        }

        getCamera() {
            return this.renderSettings.camera;
        }

        firstImport = true;
        importSvg(svgContent:string, done:()=>void)
        {
            if (this.firstImport)
            {
                this.firstImport = false;
                this.svgImporter.importSvgInWorkspace(this.workspace, svgContent,
                () => {
                    this.setUpdateFlag();
                    done();
                });
            }
            else
            {
                this.svgImporter.reimport(this.workspace, svgContent,
                () => {
                    this.setUpdateFlag();
                    done();
                });
            }
        }

        reimportSvg(svgContent:string, done:()=>void)
        {
            this.svgImporter.reimport(this.workspace, svgContent,
                () => {
                    this.setUpdateFlag();
                    done();
                });
        }

        toggleSimpleRenderer()
        {
            this.setSimpleRenderer(this.renderer != this.simpleRenderer);
            this.setRenderFlag();
        }

        setSimpleRenderer(simple:boolean)
        {
            if (simple) {
                this.renderer = this.simpleRenderer;
                this.simpleRenderer.getCanvas().style.display = 'block';
                this.hardwareRenderer.getCanvas().style.display = 'none';
            }
            else
            {
                this.renderer = this.hardwareRenderer;
                this.simpleRenderer.getCanvas().style.display = 'none';
                this.hardwareRenderer.getCanvas().style.display = 'block';
            }
        }

        toggleShowBoundingBox()
        {
            this.showBoundingBox = !this.showBoundingBox;
            this.renderer.showBoundingBox(this.showBoundingBox);
            this.setRenderFlag();
        }


        toggleGroundOrientation()
        {
            if (this.sdGround.halfSize[0] < 0.02)
                this.sdGround.setHalfSize(2, 0.01, 2);
            else if (this.sdGround.halfSize[1] < 0.02)
                this.sdGround.setHalfSize(2, 2, 0.01);
            else if (this.sdGround.halfSize[2] < 0.02)
                this.sdGround.setHalfSize(0.01, 2, 2);
            this.setRenderFlag();
        }


        private updateScene()
        {
            // update scene
            this.sdUnion.array = [];
            if (this.groundVisible)
                this.sdUnion.array.push(this.sdGround);
            for (var i=0; i < this.workspace.editorObjects.length; ++i)
            {
                this.sdUnion.array.push(this.workspace.editorObjects[i].sd);
            }
            this.renderSettings.sd = this.sdUnion;
            this.renderer.updateShader(this.sdUnion, this.renderSettings.spotLights.length);
        }

        private render()
        {     
            if (this.renderer == null)
                return;
            this.renderSettings.sd = this.sdUnion;
            //console.log("render");
            this.renderer.render(this.renderSettings);
            //this.renderer.renderDebug(100, 100, this.rp, this.cam);
        }

        updateLoop()
        {
            if (this.updateFlag)
            {
                this.updateScene();
                this.updateFlag = false;
                this.renderFlag = true;
            }

            if (this.renderFlag)
            {
                this.renderFlag = false;
                this.render();
            }
        }

        setRenderFlag()
        {
            this.renderFlag = true;
        }

        setUpdateFlag()
        {
            this.updateFlag = true;
        }

        /*
        setDiffuse(i:number, r:number, g:number, b:number)
        {
            this.editorObjects[i].sd.getMaterial(null).setDiffuse(r, g, b);
            var sd = this.editorObjects[i].sd;
            if (this.renderer instanceof hardwareRenderer)
                (<hardwareRenderer> this.renderer).updateDiffuse(sd);
        }*/

        getAllSd() : sdFields[]
        {
            return this.workspace.editorObjects.map( l => l.sd);
        }

        toggleShadows()
        {
            this.renderSettings.shadows = !this.renderSettings.shadows;
            this.setRenderFlag();
        }

        computeOBJ():string
        {
            this.signedDistanceToTriangles.compute(this.getAllSd());
            return this.exportOBJ.getText(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals, this.signedDistanceToTriangles.colors);
        }

        computeTextSTL():string
        {
            this.signedDistanceToTriangles.compute(this.getAllSd());
            return this.exportSTL.getText(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals);
        }

        computeBinarySTL():DataView
        {
            this.signedDistanceToTriangles.compute(this.getAllSd());
            console.log("check tris, normals", this.signedDistanceToTriangles.triangles.length, 3*this.signedDistanceToTriangles.normals.length)
            return this.exportSTL.getBinary(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals);
        }

    }
}