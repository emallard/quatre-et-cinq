module qec
{
    export class loadWorkspace
    {
        svgHelper:svgHelper = injectNew(svgHelper);
        
        loadFromLocalStorage(editor:editor)
        {
            var dto = JSON.parse(localStorage.getItem('workspace.json'));
            this.load(editor, dto, () => 
                {
                    editor.setSelectedSvgIndex(dto.selectedSvgIndex, () => {});
                });
        }

        load(editor:editor, dto:workspaceDto, done:()=>void)
        {
            var workspace = editor.workspace;
            vec2FromArray(workspace.svgRealSize, dto.svgRealSize);
            this.svgHelper.setRealSizeToFit(workspace.svgRealSize);

            dto.importedSvgs.forEach(x => workspace.importedSvgs.push(x));
            
            //editor.setSelectedSvgIndex(dto.selectedSvgIndex)
            workspace.selectedSvgIndex = dto.selectedSvgIndex;
            var svgContent = workspace.importedSvgs[workspace.selectedSvgIndex];
            
            var run = new runAll();

            this.svgHelper.setSvg(svgContent, ()=>
            {
                dto.editorObjects.forEach(oDto => 
                {
                    var o = new editorObject();
                    o.topSvgId = oDto.topSvgId;
                    run.push(this.getDrawOnly(o, oDto));
                })
            });

            run.run(done);
        }

        getDrawOnly(o:editorObject, oDto : editorObjectDto) : (done : ()=>void) => void
        {
            return (done) =>
                this.svgHelper.drawOnly(o.topSvgId, ()=>
                {
                    //var size = this.svgHelper.getBoundingRealSize();
                    //var center = this.svgHelper.getRealCenter();
                    //o.setTopImg2(this.svgHelper.canvas2, vec4.fromValues(-0.5*size[0], -0.5*size[1], 0.5*size[0], 0.5*size[1]));
                    mat4.identity(o.inverseTransform);
                    mat4.translate(o.inverseTransform, o.inverseTransform, vec3.fromValues(/*center[0], center[1]*/0, 0, oDto.zTranslate))
                    mat4.invert(o.inverseTransform, o.inverseTransform);
                    
                    o.setProfilePoints(oDto.profilePoints);
                    vec4FromArray(o.profileBounds, oDto.profileBounds);
                    o.profileSmooth = oDto.profileSmooth;

                    o.setDiffuseColor(this.svgHelper.getColor());
                    done();
                });
        }
    }
}