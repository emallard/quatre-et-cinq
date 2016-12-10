module qec {

    export class svgImporter
    {
        svgAutoHeightHelper:svgAutoHeightHelper = injectNew(svgAutoHeightHelper);
        helper:svgHelper = injectNew(svgHelper);
        workspace:workspace ;
        
        indexObject = 0;
        indexReimport = 0;
        tmpTranslation = vec3.create();

        importSvgInWorkspace(workspace:workspace, content:string, done:() => void)
        {
            this.workspace = workspace;
            this.svgAutoHeightHelper.setSvg(content, ()=>
            {
                this.helper.setSvg(content, ()=> this.nextImport(done));
            });
        }

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
                    this.afterDraw(id, autoHeight*0.05);
                    this.nextImport(done);
                });
                this.indexObject++;
            }
            else
            {
                done();
            }
        }

        
        afterDraw(id:string, autoHeight:number)
        {
            //$('.debug').append(this.helper.canvas);
            //$('.debug').append(this.helper.canvas2);
                
            this.helper.setRealSizeToFit(vec2.fromValues(1, 1));
            var size = this.helper.getBoundingRealSize();
            var center = this.helper.getRealCenter();
            
            //console.log('size :' , size, 'center', center, 'autoHeight', autoHeight);

            var l = new editorObject();
            this.workspace.pushObject(l);
            l.topSvgId = id;
            l.setTopImg2(this.helper.canvas2, vec4.fromValues(-0.5*size[0], -0.5*size[1], 0.5*size[0], 0.5*size[1]));
            l.setProfileHeight(autoHeight);
            
            l.setDiffuseColor(this.helper.getColor());
            mat4.identity(l.inverseTransform);
            mat4.translate(l.inverseTransform, l.inverseTransform, vec3.fromValues(center[0], center[1], 0))
            mat4.invert(l.inverseTransform, l.inverseTransform);
            
            // TODO Etienne
            //l.updateSignedDistance();
            
            //l.top.debugInfoInCanvas();
            //$('.debug').append(l.profile.canvas);              
        }


        reimport(workspace:workspace, content:string, done:() => void)
        {
            this.helper.setSvg(content, () =>
            {
                this.indexReimport = 0;
                this.helper.setSvg(content, ()=> this.nextReimport(done));
            });
        }

        
        nextReimport(done:() => void)
        {
            //var eltCount = 1; 
            var eltCount = this.helper.getElementsId().length;
            if (this.indexReimport < eltCount)
            {
                var id = this.helper.getElementsId()[this.indexReimport];
                console.log('reimport ' + id);
                this.helper.drawOnly(id, 
                ()=>{
                    var size = this.helper.getBoundingRealSize();
                    var center = this.helper.getRealCenter();

                    var l = this.workspace.editorObjects[this.indexReimport];
                    l.setTopImg2(this.helper.canvas2, vec4.fromValues(-0.5*size[0], -0.5*size[1], 0.5*size[0], 0.5*size[1]));
                    l.setDiffuseColor(this.helper.getColor());
                    // reset only xy-translate (careful we modify inverse transform)
                    mat4.getTranslation(this.tmpTranslation, l.inverseTransform);
                    this.tmpTranslation[2] = 0;
                    this.tmpTranslation[0] = -this.tmpTranslation[0] - center[0];
                    this.tmpTranslation[1] = -this.tmpTranslation[1] - center[1];
                    mat4.translate(l.inverseTransform, l.inverseTransform, this.tmpTranslation);

                    this.indexReimport++;    
                    this.nextReimport(done);
                });
                
            }
            else
            {
                done();
            }
        }
    }
}