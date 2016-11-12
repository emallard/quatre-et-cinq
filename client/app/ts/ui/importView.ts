module qec {

    export class importView {

        importedContent:string;
        editor:editor = inject(qec.editor);
        
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
                
                this.importedContent = reader.result;
                this.editor.importSvg(this.importedContent,    
                    ()=>{}//this.editor.setSelectedIndex(0)
                );

                // show in UI
                $('.imgImportedImage').attr("src", "data:image/svg+xml;base64," + btoa(reader.result));
            }
            
            // when the file is read it triggers the onload event above.
            if (file)
            {
                reader.readAsText(file);
            }
        }
    }
}