module qec
{
    export class editor
    {
        renderer:irenderer;
        simpleRenderer:simpleRenderer = injectNew(simpleRenderer);
        hardwareRenderer:hardwareRenderer = injectNew(hardwareRenderer);
        svgImporter: svgImporter = inject(svgImporter);
        texturePacker: texturePacker = inject(texturePacker);

        exportSTL:exportSTL = inject(exportSTL);
        exportOBJ:exportOBJ = inject(exportOBJ);
        signedDistanceToTriangles:signedDistanceToTriangles = inject(signedDistanceToTriangles);

        renderSettings = new renderSettings();        
        workspace:workspace = inject(workspace);
        sdUnion = new sdUnion();
        sdHoleUnion = new sdUnion();
        sdSubtraction =  new sdSubtraction();
        sdUnionWithHoleSd = new sdUnion();

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

        getViewportWidth():number {
            return this.renderer.getViewportWidth();
        }

        getViewportHeight():number {
            return this.renderer.getViewportHeight();
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

        addSvg(svgContent:string)
        {
            this.workspace.importedSvgs.push(svgContent);
        }

        setSelectedSvgIndex(index:number, done:()=>void)
        {
            this.workspace.selectedSvgIndex = index;
            var svgContent = this.workspace.importedSvgs[this.workspace.selectedSvgIndex];
            this.importSvg(svgContent, done);
        }

        firstImport = true;
        importSvg(svgContent:string, done:()=>void)
        {
            console.log('importSvg');
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
            this.sdHoleUnion.array = [];
            this.sdSubtraction.array = [this.sdUnion, this.sdHoleUnion];
            this.sdUnionWithHoleSd.array = [this.sdSubtraction];

            if (this.groundVisible)
                this.sdUnion.array.push(this.sdGround);
            
            var objs = this.workspace.editorObjects;
            for (var i=0; i < objs.length; ++i)
            {
                if (!objs[i].isHole)
                    this.sdUnion.array.push(objs[i].sd);
                else
                {
                    this.sdHoleUnion.array.push(objs[i].sd);

                    
                    var sdEffect = new sdIntersection();
                    
                    var sdG = new sdGrid();
                    vec3.set(sdG.size, 0.063, 0.063, 0.063);
                    sdG.thickness = 0.0001;

                    var sdB = new sdBorder();
                    sdB.borderIn = 0.0001;
                    sdB.borderOut = 0;
                    sdB.sd = objs[i].sd;

                    sdEffect.array = [sdB, sdG];
                    this.sdUnionWithHoleSd.array.push(sdEffect);
                }

            }
            
            if (this.sdHoleUnion.array.length == 0)
                this.renderSettings.sd = this.sdUnion;
            else
                this.renderSettings.sd = this.sdUnionWithHoleSd;//this.sdSubtraction;
            this.renderer.updateShader(this.renderSettings.sd, this.renderSettings.spotLights.length, this.texturePacker);
        }

        private updateSprites()
        {
            var textures = [];
            this.workspace.editorObjects.forEach(o =>
            {
                textures.push(o.top.floatTexture, o.profile.floatTexture);
                /*
                var canvas1 = document.createElement('canvas');
                textureDebugInCanvas(o.top.floatTexture ,0 ,10000, canvas1);
                document.body.appendChild(canvas1);
                var canvas2 = document.createElement('canvas');
                textureDebugInCanvas(o.profile.floatTexture ,0 ,10000, canvas2);
                document.body.appendChild(canvas2);
                */
            });
            this.texturePacker.repackMode = 3;
            this.texturePacker.repack(textures);
        
            //this.texturePacker.debugInfoInBody(10000);

            this.workspace.editorObjects.forEach(o =>
            {
                this.updateSignedDistance(o);
            });

            this.renderer.updateAllPackedTextures(this.texturePacker);
        }

        public updateSignedDistance(obj:editorObject) : void
        {
            obj.updateSignedDistanceWithSprites(
                this.texturePacker.getSprite(obj.top.floatTexture),
                this.texturePacker.getSprite(obj.profile.floatTexture)
                );
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
                this.updateSprites();
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
            this.signedDistanceToTriangles.compute(this.getAllSd(), 50, 50, 50, 1);
            return this.exportOBJ.getText(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals, this.signedDistanceToTriangles.colors);
        }

        computeOBJAsZip(icount:number, jcount:number, kcount:number, multiplier:number, done:(content:any)=>void)
        {
            this.signedDistanceToTriangles.compute(this.getAllSd(), icount, jcount, kcount, multiplier);
            return this.exportOBJ.getZip(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals, this.signedDistanceToTriangles.colors, done);    
        }

        computeTextSTL():string
        {
            this.signedDistanceToTriangles.compute(this.getAllSd(), 50, 50, 50, 1);
            return this.exportSTL.getText(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals);
        }

        computeBinarySTL(icount:number, jcount:number, kcount:number, multiplier:number):DataView
        {
            this.signedDistanceToTriangles.compute(this.getAllSd(), icount, jcount, kcount, multiplier);
            console.log("check tris, normals", this.signedDistanceToTriangles.triangles.length, 3*this.signedDistanceToTriangles.normals.length)
            return this.exportSTL.getBinary(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals);
        }

        computeBinarySTLAsZip(icount:number, jcount:number, kcount:number, multiplier:number, done:(content:any)=>void)
        {
            console.log('computeBinarySTLAsZip');
            var stl = this.computeBinarySTL(icount, jcount, kcount, multiplier);
            var blob = new Blob([stl], {type: 'application/octet-stream'});
            
            zip.createWriter(new zip.BlobWriter("application/zip"), (zipWriter) => {
                zipWriter.add("a.stl", new zip.BlobReader(blob), () => {
                    console.log('zipwriter close');
                    zipWriter.close(done);
                });
            }, (msg) =>  console.error(msg));
        }
    }
}