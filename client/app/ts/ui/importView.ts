module qec {

    export class importView {

        importedContent:string;
        editor:editor = inject(qec.editor);
        
        importedSvgs = ko.observableArray<importedSvg>();
        createImportedSvg:()=>importedSvg = injectFunc(importedSvg);
        
        set()
        {
        }

        setElement(elt:HTMLElement)
        {
            var dropZone = document.getElementsByClassName('dropZone')[0];

            dropZone.addEventListener('dragover', (evt:DragEvent) => {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }, false);
            
            dropZone.addEventListener('drop', (e:DragEvent) => {
                e.stopPropagation();
                e.preventDefault();
                var files = e.dataTransfer.files;
                var i = 0;
                var file = files[i];
                this.readImage(files[0]); 
            }, false);
            
        }

        readImage(file: File)
        {
            console.log('readImage');  
            var reader = new FileReader();
            
            reader.onload = (event) => {
                
                /*
                this.importedContent = reader.result;
                this.editor.importSvg(this.importedContent,    
                    ()=>{}//this.editor.setSelectedIndex(0)
                );
                */
                var newSvg = this.createImportedSvg();
                newSvg.importView = this;
                newSvg.src("data:image/svg+xml;base64," + btoa(reader.result));
                newSvg.content = reader.result;
                this.importedSvgs.push(newSvg);

                this.editor.addSvg(reader.result);
                //if (this.importedSvgs.length == 1)
                this.select(newSvg);
            }
            
            // when the file is read it triggers the onload event above.
            if (file)
            {
                reader.readAsText(file);
            }
        }

        select(importedSvg:importedSvg)
        {
            this.importedSvgs().forEach(x => x.isActive(false));
            importedSvg.isActive(true);

            var index = this.importedSvgs().indexOf(importedSvg);
            console.log('index ' + index);
            this.editor.setSelectedSvgIndex(index, ()=>{});
            //this.editor.importSvg(importedSvg.content,()=>{});
        }

        remove(importedSvg:importedSvg)
        {
            this.importedSvgs.remove(importedSvg);
        }
    }
}