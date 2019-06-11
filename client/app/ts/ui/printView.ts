module qec {

    export class printView {
        /*
        allDesignsUrl = ko.observableArray<string>();

        designName = ko.observable('mydesign');
        designUrl = ko.observable('');
        state = ko.observable('');
        frameVisible = ko.observable(false);
        frameSrc = ko.observable('');
        */
        editor: editor = inject(editor);

        sculpteoDesignName = ko.observable('mydesign');
        sculpteoState = ko.observable('');
        sculpteoFrameVisible = ko.observable(false);
        sculpteoFrameSrc = ko.observable('');
        sculpteoDesignUrl = ko.observable('');

        allPrintUrl = ko.observableArray<string>();
        sendToSculpteo() {
            var req = new XMLHttpRequest();
            req.open('POST', '/sculpteo?designName=' + this.sculpteoDesignName(), true);
            req.onreadystatechange = (aEvt) => {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var response = JSON.parse(req.responseText);
                        if (response.errors) {
                            alert(JSON.stringify(response.errors));
                        }
                        else {
                            var uuid = response.uuid;
                            var url = 'http://www.sculpteo.com/en/embed/redirect/' + uuid + '?click=details';
                            this.sculpteoFrameVisible(true);
                            this.sculpteoFrameSrc(url);
                            this.sculpteoDesignUrl('https://www.sculpteo.com/gallery/design/ext/' + uuid);
                            this.allPrintUrl.push(this.sculpteoDesignUrl());
                            (<any>$('#modalSculpteo')).modal('show');
                            //$('.sculpteoFrame').attr('width', $('.screen').width());
                            //$('.sculpteoFrame').attr('height', $('.screen').height());
                        }
                    }
                    else {
                        alert("Erreur pendant le chargement de la page.\n");
                    }
                }
            };

            req.onprogress = (bEvt) => {
                this.sculpteoState('' + bEvt.loaded + '/' + bEvt.total);
            };
            this.sculpteoState = ko.observable('Sending');

            //var stl = this.editor.computeBinarySTL(10, 10, 10);
            //var blob = new Blob([stl], {type: 'application/octet-stream'});
            // req.send(blob);

            //this.editor.computeBinarySTLAsZip(30, 30, 30, 10, (content) => req.send(content));
            this.editor.computeOBJAsZip(150, 150, 100, 10, (content) => { console.log('contentSize: ' + content.size); req.send(content) });

            /*
            var myArray = new ArrayBuffer(512);
            var longInt8View = new Uint8Array(myArray);

            for (var i=0; i < longInt8View.length; i++) {
                longInt8View[i] = i % 255;
            }
            var blob = new Blob([longInt8View], {type: 'application/octet-stream'});
            */
        }

        exportSTL() {
            var isStl = false;
            //var blob:Blob;
            if (!isStl) {
                /*
                var obj = this.editor.computeOBJ();
                var blob = new Blob([obj], {type: 'text/plain'});
                saveAs(blob, 'download.obj');
                */

                this.editor.computeOBJAsZip(50, 50, 50, 1, content => saveAs(content, 'a.obj.zip'));
            }
            else {
                //var stl = this.editor.computeTextSTL();
                var stl = this.editor.computeBinarySTL(50, 50, 50, 1);
                var blob = new Blob([stl], { type: 'application//octet-binary' });
                saveAs(blob, 'download.stl');
            }

        }
    }

}