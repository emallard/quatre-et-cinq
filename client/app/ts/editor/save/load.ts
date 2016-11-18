module qec
{
    export class loadWorkspace
    {
        svgHelper:svgHelper = injectNew(svgHelper);
        
        loadFromLocalStorage()
        {
            var json = JSON.parse(localStorage.getItem('workspace.json'));
        }

        load(editor:editor, dto:workspaceDto)
        {
            var workspace = editor.workspace;
            workspace.svgContent = dto.svgContent;
            vec2FromArray(workspace.svgRealSize, dto.svgRealSize);
            this.svgHelper.setRealSizeToFit(workspace.svgRealSize);
                    
            this.svgHelper.setSvg(dto.svgContent, ()=>
            {
                dto.editorObjects.forEach(oDto => 
                {
                    var o = new editorObject();
                    o.topSvgId = oDto.topSvgId;
                    this.svgHelper.drawOnly(oDto.topSvgId, ()=>
                    {
                        var size = this.svgHelper.getBoundingRealSize();
                        var center = this.svgHelper.getRealCenter();
                        o.setTopImg2(this.svgHelper.canvas2, vec4.fromValues(-0.5*size[0], -0.5*size[1], 0.5*size[0], 0.5*size[1]));
                        mat4.identity(o.inverseTransform);
                        mat4.translate(o.inverseTransform, o.inverseTransform, vec3.fromValues(center[0], center[1], oDto.zTranslate))
                        mat4.invert(o.inverseTransform, o.inverseTransform);
                        
                        o.setProfilePoints(oDto.profilePoints);
                        vec4FromArray(o.profileBounds, oDto.profileBounds);
                        o.profileSmooth = oDto.profileSmooth;

                        o.setDiffuseColor(this.svgHelper.getColor());
                    });
                })
            })

            
            
        }
    }
}