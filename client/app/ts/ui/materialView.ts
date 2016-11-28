module qec {

    export class materialView {

        editor:editor = inject(qec.editor);
        selectedIndex = -1;
        spectrumElt:any;
        

        setElement(elt:HTMLElement)
        {
            this.spectrumElt = $(elt);//.find('.flatColorPicker');
            this.spectrumElt.spectrum({
                flat: true,
                showInput: true,
                showButtons: false,
                move: (color) => this.onColorChange(color)
            });
        }

        setSelectedIndex(i:number)
        {
            var fakePos = vec3.create();

            this.selectedIndex = i;
            if (i >= 0)
            {
                var m = this.editor.workspace.editorObjects[this.selectedIndex].diffuseColor;
                this.spectrumElt.spectrum("set", "rgb("+
                    m[0]*255+","+
                    m[1]*255+","+
                    m[2]*255+")");
            }
            
        }

        onColorChange(color:any)
        { 
            var fakePos = vec3.create();

            if (this.selectedIndex >= 0)
            {
                var o = this.editor.workspace.editorObjects[this.selectedIndex];
                o.setDiffuseColor([color._r/255, color._g/255, color._b/255]);
                this.editor.renderer.updateDiffuse(o.sd);
                this.editor.setRenderFlag();
            }
        }

        isHole = ko.observable(false);
        setAsHole()
        {
            if (this.selectedIndex >= 0)
            {
                if (this.isHole())
                {
                    var l = this.editor.workspace.editorObjects[this.selectedIndex];
                    //l.profileSmooth = false;
                    this.editor.setUpdateFlag();
                }
            }
        }

    }

}