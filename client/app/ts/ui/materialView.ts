module qec {

    export class materialView {

        editor:editor = inject(qec.editor);
        selectedIndex = -1;
        spectrumElt:any;
        

        setElement(elt:HTMLElement)
        {
            this.spectrumElt = $(elt).find('.flatColorPicker');
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
                var m = this.editor.editorObjects[this.selectedIndex].sd.getMaterial(fakePos);
                this.spectrumElt.spectrum("set", "rgb("+
                    m.diffuse[0]*255+","+
                    m.diffuse[1]*255+","+
                    m.diffuse[2]*255+")");
            }
            
        }

        onColorChange(color:any)
        { 
            var fakePos = vec3.create();

            if (this.selectedIndex >= 0)
            {
                this.editor.setDiffuse(this.selectedIndex, color._r/255, color._g/255, color._b/255)
                this.editor.setRenderFlag();
            }
        }

    }

}