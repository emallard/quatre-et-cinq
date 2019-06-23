module qec {

    export class svgLibraryItemView {
        importView: importView = inject(importView);
        editorView: editorView = inject(editorView);
        src: string;

        click() {

            var req = new XMLHttpRequest();
            req.open('GET', this.src, true);
            req.onreadystatechange = () => {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        this.importView.readImageAsText(req.responseText);
                    }
                    else {
                        console.error("Erreur pendant le chargement de la page.\n");
                    }
                    this.editorView.modalDrawVisible(false);
                }
            };
            req.send(null);
        }
    }
}