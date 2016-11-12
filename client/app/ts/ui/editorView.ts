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

        onMouseMove(data:any, e:Event) { this.controllerManager.onMouseMove(e); }
        onMouseDown(data:any, e:Event) { this.controllerManager.onMouseDown(e); }
        onMouseUp(data:any, e:Event) { this.controllerManager.onMouseUp(e); }
        onMouseWheel(data:any, e:Event) { this.controllerManager.onMouseWheel(e); }

        setMoveController()
        {
            this.heightController.isScaleMode = false;
            this.controllerManager.setController(this.heightController);
        }

        setScaleController()
        {
            this.heightController.isScaleMode = true;
            this.controllerManager.setController(this.heightController);
        }

        setSelectController()
        {
            this.controllerManager.setController(this.selectController);
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
            var stl = this.editor.computeSTL();
            var blob = new Blob([stl], {type: 'text/plain'});
            saveAs(blob, 'download.stl');
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
    }
}