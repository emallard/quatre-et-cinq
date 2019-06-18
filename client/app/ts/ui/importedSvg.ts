module qec {

    export class importedSvg {

        src = ko.observable('');
        content = '';
        isActive = ko.observable(false);
        importView: importView;

        onClick(): void {
            this.importView.select(this, () => { });
            //this.isActive(true);
        }

        remove(): void {
            this.importView.remove(this);
        }

        download(): void {
            qec.saveFile(this.src(), "download.svg");
        }
    }

}