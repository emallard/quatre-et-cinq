module qec
{
  
  

    export class appVm
    {
        //renderer = new hardwareRenderer();
        renderer:irenderer;

        simpleRenderer= new simpleRenderer();
        hardwareRenderer = new hardwareRenderer();

        renderSettings = new renderSettings();
        
        showBoundingBox = false;

        sdUnion = new sdUnion();
        sdGround = new sdBox();

        layers:layerVm2[] = [];
        selectedIndex = -1;

        helper = new svgHelper();
        svgAutoHeightHelper = new svgAutoHeightHelper();

        renderFlag = false;
        updateFlag = false;
        
        init(container:HTMLElement)
        {
            var simple = true;

            this.simpleRenderer = new simpleRenderer();
            this.simpleRenderer.setContainerAndSize(container, 300, 300);
            this.simpleRenderer.canvas.style.display = 'none';
        
            this.hardwareRenderer = new hardwareRenderer();
            this.hardwareRenderer.setContainerAndSize(container, 800, 600);

            this.setSimpleRenderer(simple);
            
            this.renderSettings.camera.setCam(vec3.fromValues(0, -1, 3), vec3.fromValues(0,0,0), vec3.fromValues(0,0,1));
            var keyLight = new directionalLight();
            var fillLight = new directionalLight();
            var rimLight = new spotLight();
            
            keyLight.createFrom({
                type: 'directionalLightDTO',
                position: [-2, -2, 0],
                direction : [1, 1, -2],
                intensity : 0.8
            });

            fillLight.createFrom({
                type: 'directionalLightDTO',
                position: [2, -2, 0],
                direction : [-1, 1, -1],
                intensity : 0.2
            });

            rimLight.createFrom({
                type: 'spotLightDTO',
                position: [2, 2, 0.5],
                direction : [-1, -1, 0.1],
                intensity : 0.2
            });
            
            this.renderSettings.directionalLights.push(keyLight);//, fillLight);
            //this.renderSettings.spotLights.push(rimLight);
               
            this.sdGround = new sdBox();
            this.sdGround.getMaterial(null).setDiffuse(0.8,0.8,0.8);
            this.sdGround.setHalfSize(2, 2, 0.01);
        }

        getCamera() {
            return this.renderSettings.camera;
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

        importSvg(content:string, done:() => void)
        {
            this.svgAutoHeightHelper.setSvg(content, ()=>
            {
                this.helper.setSvg(content, ()=> this.nextImport(done));
            });
        }

        indexObject = 0;
        nextImport(done:() => void)
        {
            //var eltCount = 1; 
            var eltCount = this.helper.getElementsId().length;
            if (this.indexObject < eltCount)
            {
                var id = this.helper.getElementsId()[this.indexObject];
                console.log(id);
                this.helper.drawOnly(id, 
                ()=>{
                    var autoHeight = this.svgAutoHeightHelper.valueForIds[id];
                    this.afterDraw(autoHeight*0.05);
                    this.nextImport(done);
                });
                this.indexObject++;
            }
            else
            {
                this.setUpdateFlag();
                done();
            }
        }

        
        afterDraw(autoHeight:number)
        {
            //$('.debug').append(this.helper.canvas);
            //$('.debug').append(this.helper.canvas2);
                
            this.helper.setRealSizeToFit(vec2.fromValues(1, 1));
            var size = this.helper.getBoundingRealSize();
            var center = this.helper.getRealCenter();
            
            //console.log('size :' , size, 'center', center, 'autoHeight', autoHeight);

            var l = new layerVm2();
            this.layers.push(l);
            l.setTopImg2(this.helper.canvas2, vec4.fromValues(-0.5*size[0], -0.5*size[1], 0.5*size[0], 0.5*size[1]));
            l.setProfileHeight(autoHeight);
            
            l.setColor(this.helper.getColor());
            mat4.identity(l.inverseTransform);
            mat4.translate(l.inverseTransform, l.inverseTransform, vec3.fromValues(center[0], center[1], 0))
            mat4.invert(l.inverseTransform, l.inverseTransform);
            l.updateSignedDistance();
            //l.top.debugInfoInCanvas();
            //$('.debug').append(l.profile.canvas);
              
        }

        private updateScene()
        {
            // update scene
            this.sdUnion.array = [this.sdGround];
            for (var i=0; i < this.layers.length; ++i)
            {
                this.sdUnion.array.push(this.layers[i].sd);
            }
            this.renderSettings.sd = this.sdUnion;
            this.renderer.updateShader(this.sdUnion);
        }

        private render()
        {     
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

        setDiffuse(i:number, r:number, g:number, b:number)
        {
            this.layers[i].sd.getMaterial(null).setDiffuse(r, g, b);
            var sd = this.layers[i].sd;
            if (this.renderer instanceof hardwareRenderer)
                (<hardwareRenderer> this.renderer).updateDiffuse(sd);
        }

        getLayersSd() : signedDistance[]
        {
            return this.layers.map( l => l.sd);
        }

        toggleShadows()
        {
            this.renderSettings.shadows = !this.renderSettings.shadows;
            this.setRenderFlag();
        }
    }
}