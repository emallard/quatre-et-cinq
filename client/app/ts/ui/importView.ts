module qec {

    export class importView {

        importedContent: string;
        editor: editor = inject(qec.editor);
        editorView: editorView = inject(qec.editorView);
        drawView: drawView = inject(drawView);

        importedSvgs = ko.observableArray<importedSvg>();
        noPicture = ko.observable(true);
        atLeastOnePicture = ko.observable(false);

        createImportedSvg: () => importedSvg = injectFunc(importedSvg);
        createSvgLibraryItemView: () => svgLibraryItemView = injectFunc(svgLibraryItemView);
        svgLibrary = ko.observableArray<svgLibraryItemView>();
        svgLibrarySrcs = ['/data/hearts.svg', '/data/hearts2.svg', '/data/cartoon-owl.svg'];

        fileTabVisible = ko.observable(true);
        libraryTabVisible = ko.observable(false);
        drawTabVisible = ko.observable(false);

        afterInject() {
            if (this.svgLibrary().length == 0) {
                for (let src of this.svgLibrarySrcs) {
                    var item = this.createSvgLibraryItemView();
                    item.src = src;
                    this.svgLibrary.push(item);
                }
            }
        }

        setElement(elt: HTMLElement) {
            var dropZone = document.getElementsByClassName('dropZone')[0];

            dropZone.addEventListener('dragover', (evt: DragEvent) => {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }, false);

            dropZone.addEventListener('drop', (e: DragEvent) => {
                e.stopPropagation();
                e.preventDefault();
                var files = e.dataTransfer.files;
                var i = 0;
                var file = files[i];
                this.readImage(files[0]);
            }, false);

        }

        readImage(file: File) {
            console.log('readImage');
            var reader = new FileReader();

            reader.onload = (event) => {

                /*
                this.importedContent = reader.result;
                this.editor.importSvg(this.importedContent,    
                    ()=>{}//this.editor.setSelectedIndex(0)
                );
                */
                var readerResult = reader.result as string;
                this.readImageAsText(readerResult);

            }

            // when the file is read it triggers the onload event above.
            if (file) {
                reader.readAsText(file);
            }
        }

        readImageAsText(readerResult: string) {
            var isFirstImport = this.editor.workspace.editorObjects.length == 0;


            var newSvg = this.createImportedSvg();
            newSvg.importView = this;
            newSvg.src("data:image/svg+xml;base64," + btoa(readerResult));
            newSvg.content = readerResult;
            this.importedSvgs.push(newSvg);

            this.editor.addSvg(readerResult);
            //if (this.importedSvgs.length == 1)
            this.select(newSvg, () => {
                this.atLeastOnePicture(true);
                this.noPicture(false);

                if (isFirstImport)
                    this.editorView.showModifyToolbar();
            });

            this.editorView.modalDrawVisible(false);
        }

        select(importedSvg: importedSvg, done: () => void) {
            this.importedSvgs().forEach(x => x.isActive(false));
            importedSvg.isActive(true);

            var index = this.importedSvgs().indexOf(importedSvg);
            console.log('index ' + index);
            this.editor.setSelectedSvgIndex(index, done);
            //this.editor.importSvg(importedSvg.content,()=>{});
        }

        remove(importedSvg: importedSvg) {
            this.importedSvgs.remove(importedSvg);
        }

        onAddSvgClick() {
            console.log("hop");
            this.editorView.modalDrawVisible(true);
        }

        onFileClick() {
            this.fileTabVisible(true);
            this.libraryTabVisible(false);
            this.drawTabVisible(false);
        }

        onLibraryClick() {
            this.fileTabVisible(false);
            this.libraryTabVisible(true);
            this.drawTabVisible(false);
        }

        onDrawClick() {
            this.fileTabVisible(false);
            this.libraryTabVisible(false);
            this.drawTabVisible(true);
        }
    }
}