declare var saveAs;

module qec
{

    export class editorView
    {
        editor:editor = inject(editor);
        //updateLoop:updateLoop = inject(updateLoop);
        controllerManager:controllerManager = inject(controllerManager);
        selectController:selectController = inject(selectController);
        heightController:heightController = inject(heightController);
        importView:importView = inject(importView);
        profileView:profileView = inject(profileView);
        materialView:materialView = inject(materialView);

        afterInject()
        {
            this.editor.setRenderFlag();
            this.updateLoop();
        }

        initEditor(elt:HTMLElement)
        {
            this.editor.init(elt);
        }

        onMouseMove(data:any, e:Event) { this.controllerManager.onMouseMove(e); }
        onMouseDown(data:any, e:Event) { this.controllerManager.onMouseDown(e); }
        onMouseUp(data:any, e:Event) { this.controllerManager.onMouseUp(e); }
        onMouseWheel(data:any, e:Event) { this.controllerManager.onMouseWheel(e); }

        setMoveController()
        {
            this.heightController.isScaleMode = false;
            this.controllerManager.setController(this.heightController);
            this.setActiveController(this.isMoveControllerActive);
        }

        setScaleController()
        {
            this.heightController.isScaleMode = true;
            this.controllerManager.setController(this.heightController);
            this.setActiveController(this.isScaleControllerActive);
        }

        setSelectController()
        {
            this.controllerManager.setController(this.selectController);
            this.setActiveController(this.isSelectControllerActive);
        }

        isSelectControllerActive = ko.observable(true);
        isMoveControllerActive = ko.observable(false);
        isScaleControllerActive = ko.observable(false);
        setActiveController(c:KnockoutObservable<boolean>)
        {
            this.isSelectControllerActive(false);
            this.isMoveControllerActive(false);
            this.isScaleControllerActive(false);
            c(true);
        }

        setSelectedIndex(i: number)
        {
            this.editor.setSelectedIndex(i);
            this.profileView.setSelectedIndex(i);
            this.materialView.setSelectedIndex(i);
        }

        private updateLoop()
        {
            this.controllerManager.updateLoop();
            this.editor.updateLoop();
            this.profileView.updateLoop()
            requestAnimationFrame(()=>this.updateLoop());
        }

        exportSTL()
        {
            
            //var stl = this.editor.computeTextSTL();
            var stl = this.editor.computeOBJ();
            var blob = new Blob([stl], {type: 'text/plain'});
            
            //var stl = this.editor.computeBinarySTL();
            //var blob = new Blob([stl], {type: 'application//octet-binary'});
            
            saveAs(blob, 'download.obj');
        }

        savePhoto()
        {
            saveAsImage(this.editor.renderer.getCanvas())
        }

        // toolbars
        importToolbarVisible = ko.observable<boolean>(true);
        modifyToolbarVisible = ko.observable<boolean>(false);
        environmentToolbarVisible = ko.observable<boolean>(false);
        photoToolbarVisible = ko.observable<boolean>(false);

        toolbarsVisible:KnockoutObservable<boolean>[] = [
            this.importToolbarVisible, 
            this.modifyToolbarVisible, 
            this.environmentToolbarVisible,
            this.photoToolbarVisible];

        showImportToolbar() { this.setToolbar(this.importToolbarVisible); }
        showModifyToolbar() { this.setToolbar(this.modifyToolbarVisible);}
        showEnvironmentToolbar() { this.setToolbar(this.environmentToolbarVisible);}
        showPhotoToolbar() { this.setToolbar(this.photoToolbarVisible);}

        setToolbar(selected:KnockoutObservable<boolean>)
        {
            this.toolbarsVisible.forEach(t => t(false));
            selected(true);
        }

        light1()
        {
            var w = this.editor.workspace;
            w.keyLight.intensity = 0.8;
            w.fillLight.intensity = 0.2;
            w.rimLight.intensity = 0.2;
            this.editor.setRenderFlag();
        }

        light2()
        {
            var w = this.editor.workspace;
            w.keyLight.intensity = 0;
            w.fillLight.intensity = 0.5;
            w.rimLight.intensity = 0.5;
            this.editor.setRenderFlag();
        }

        sendToSculpteo()
        {
            $('.printPanel').show();

            var req = new XMLHttpRequest();
            req.open('POST', '/sculpteo?filename=coucou', true);
            req.onreadystatechange = (aEvt) => {
                if (req.readyState == 4) {
                    if(req.status == 200)
                    {
                        alert(req.response);
                        alert("OK !");
                        var uuid = req.response.uuid;
                        $('#sculpteoFrame').attr('src', '//www.sculpteo.com/en/embed/redirect/' + uuid + '?click=details');
                    }
                    else
                    {
                        alert("Erreur pendant le chargement de la page.\n");
                    }
                }
            };

            var stl = 
 "solid a\n"
+"facet normal 0 0 1\n"
+"outer loop\n"
+"vertex 0 0 0\n"
+"vertex 1 0 0\n"
+"vertex 1 1 0\n"
+"endloop"
+"endfacet"
+"endsolid a";
            
            var myArray = new ArrayBuffer(512);
            var longInt8View = new Uint8Array(myArray);

            for (var i=0; i < longInt8View.length; i++) {
                longInt8View[i] = i % 255;
            }

            var blob = new Blob([longInt8View], {type: 'application/octet-binary'});

            req.send(blob);
        }

        uploadedUrl = ko.observable<string>();
        uploadPhoto()
        {
            var elt = this.editor.renderer.getCanvas();
            var imgData = elt.toDataURL("image/jpeg");
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