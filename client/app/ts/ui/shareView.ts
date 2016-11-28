module qec 
{

    export class shareView
    {
        editor:editor = inject(editor);
        uploadedUrl = ko.observable<string>('');
        uploadedSrc = ko.observable<string>('');

        allPhotoUrl = ko.observableArray<string>();

        exportSTL()
        {
            var isStl = false;
            //var blob:Blob;
            if (!isStl)
            {
                /*
                var obj = this.editor.computeOBJ();
                var blob = new Blob([obj], {type: 'text/plain'});
                saveAs(blob, 'download.obj');
                */

                this.editor.computeOBJAsZip(50, 50, 50, 1, content => saveAs(content, 'a.obj.zip'));
            }
            else
            {
                //var stl = this.editor.computeTextSTL();
                var stl = this.editor.computeBinarySTL(50, 50, 50, 1);
                var blob = new Blob([stl], {type: 'application//octet-binary'});
                saveAs(blob, 'download.stl');
            }
            
        }

        savePhoto()
        {
            saveAsImage(this.editor.renderer.getCanvas())
        }

        uploadPhoto()
        {
            var elt = this.editor.renderer.getCanvas();
            var imgData = elt.toDataURL("image/jpeg");
            this.uploadedSrc(imgData);

            var req = new XMLHttpRequest();
            req.open('POST', '/uploadString', true);
            req.responseType = 'json';
            req.onreadystatechange = (aEvt) => {
                if (req.readyState == 4) {
                    if(req.status == 200)
                    {
                        var id = req.response.id;
                        console.log(req.response);
                        console.log(req.response.id);

                        this.uploadedUrl(window.location.protocol + '//' + window.location.host + '/downloadDataUri?id=' + id);
                        
                        this.allPhotoUrl.push(window.location.protocol + '//' + window.location.host + '/downloadDataUri?id=' + id);
                        (<any> $('#modalPhoto')).modal('show');
                    }
                    else
                    {
                        alert("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            
            console.log(imgData);
            req.send(imgData);
        }
    }
}