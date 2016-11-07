module qec {

    export class importView {

        importedContent:string;
        vm:appVm;
        view:appView;
        setVm(vm:appVm, view:appView)
        {
            this.view = view;
            this.vm = vm;
        }

        setElement(elt:HTMLElement)
        {
            var btnImport = <HTMLInputElement> document.getElementsByClassName('btnImport')[0];
            btnImport.addEventListener('change', e => {
                var files = btnImport.files;
                this.readImage(files[0]); 
            });


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
                this.vm.importSvg(this.importedContent,    
                    ()=>this.view.setSelectedIndex(0)
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