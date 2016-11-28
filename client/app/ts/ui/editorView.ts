declare var saveAs;

module qec
{

    export class editorView
    {
        editor:editor = inject(editor);
        saveWorkspace:saveWorkspace = inject(saveWorkspace);
        loadWorkspace:loadWorkspace = inject(loadWorkspace);

        //updateLoop:updateLoop = inject(updateLoop);
        controllerManager:controllerManager = inject(controllerManager);
        selectController:selectController = inject(selectController);
        heightController:heightController = inject(heightController);
        importView:importView = inject(importView);
        profileView:profileView = inject(profileView);
        materialView:materialView = inject(materialView);
        shareView:shareView = inject(shareView);
        printView:printView = inject(printView);

        afterInject()
        {
            this.editor.setRenderFlag();
            this.updateLoop();
        }

        initEditor(elt:HTMLElement)
        {
            this.editor.init(elt);
        }

        menuNew()
        {

        }

        menuSave()
        {
            this.saveWorkspace.saveJsonInLocalStorage(this.editor);
        }

        menuOpen()
        {
            this.loadWorkspace.loadFromLocalStorage(this.editor);
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
            this.heightController.isScaleModeBottom = false;
            this.controllerManager.setController(this.heightController);
            this.setActiveController(this.isScaleControllerActive);
        }

        setScaleBottomController()
        {
            this.heightController.isScaleMode = true;
            this.heightController.isScaleModeBottom = true;
            this.controllerManager.setController(this.heightController);
            this.setActiveController(this.isScaleBottomControllerActive);
        }

        setSelectController()
        {
            this.controllerManager.setController(this.selectController);
            this.setActiveController(this.isSelectControllerActive);
        }

        isSelectControllerActive = ko.observable(true);
        isMoveControllerActive = ko.observable(false);
        isScaleControllerActive = ko.observable(false);
        isScaleBottomControllerActive = ko.observable(false);
        
        setActiveController(c:KnockoutObservable<boolean>)
        {
            this.isSelectControllerActive(false);
            this.isMoveControllerActive(false);
            this.isScaleControllerActive(false);
            this.isScaleBottomControllerActive(false);
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

        
        // toolbars
        importToolbarVisible = ko.observable<boolean>(true);
        modifyToolbarVisible = ko.observable<boolean>(false);
        environmentToolbarVisible = ko.observable<boolean>(false);
        photoToolbarVisible = ko.observable<boolean>(false);
        printToolbarVisible = ko.observable<boolean>(false);

        toolbarsVisible:KnockoutObservable<boolean>[] = [
            this.importToolbarVisible, 
            this.modifyToolbarVisible, 
            this.environmentToolbarVisible,
            this.photoToolbarVisible,
            this.printToolbarVisible];

        showImportToolbar() { this.setToolbar(this.importToolbarVisible); }
        showModifyToolbar() { this.setToolbar(this.modifyToolbarVisible);}
        showEnvironmentToolbar() { this.setToolbar(this.environmentToolbarVisible);}
        showPhotoToolbar() { this.setToolbar(this.photoToolbarVisible);}
        showPrintToolbar() { this.setToolbar(this.printToolbarVisible);}

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

        toggleSoftwareHardware() {
            this.editor.toggleSimpleRenderer();
        }
    }
}