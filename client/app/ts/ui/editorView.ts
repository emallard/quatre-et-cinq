declare var saveAs;

module qec {

    export class editorView {
        editor: editor = inject(editor);
        saveWorkspace: saveWorkspace = inject(saveWorkspace);
        loadWorkspace: loadWorkspace = inject(loadWorkspace);

        //updateLoop:updateLoop = inject(updateLoop);
        cameraTransforms: cameraTransforms = inject(cameraTransforms);
        controllerManager: controllerManager = inject(controllerManager);
        cameraController: cameraArcballController = inject(cameraArcballController);
        selectController: selectController = inject(selectController);
        heightController: heightController = inject(heightController);
        transformObjectController: transformObjectController = inject(transformObjectController);
        importView: importView = inject(importView);
        profileView: profileView = inject(profileView);
        materialView: materialView = inject(materialView);
        shareView: shareView = inject(shareView);
        printView: printView = inject(printView);
        transformObjectView: transformObjectView = inject(transformObjectView);
        drawView: drawView = inject(drawView);
        consoleView: consoleView = inject(consoleView);

        afterInject() {
            this.editor.setRenderFlag();
            this.updateLoop();
        }

        initEditor(elt: HTMLElement) {
            this.editor.init(elt);
        }

        menuNew() {

        }

        menuSave() {
            this.saveWorkspace.saveJsonInLocalStorage(this.editor);
        }

        menuOpen() {
            this.loadWorkspace.loadFromLocalStorage(this.editor);
        }

        onMouseMove(data: any, e: Event) { this.controllerManager.onMouseMove(e); }
        onMouseDown(data: any, e: Event) { this.controllerManager.onMouseDown(e); }
        onMouseUp(data: any, e: Event) { this.controllerManager.onMouseUp(e); }
        onMouseWheel(data: any, e: Event) { this.controllerManager.onMouseWheel(e); }

        onTouchStart(data: any, e: Event) { this.controllerManager.onTouchStart(e); this.consoleView.log("touchStart"); }
        onTouchMove(data: any, e: Event) { this.controllerManager.onTouchMove(e); }
        onTouchEnd(data: any, e: Event) { this.controllerManager.onTouchEnd(e); }

        onPanStart(e: HammerInput) { this.controllerManager.onPanStart(e); this.consoleView.log("panStart"); }
        onPanMove(e: HammerInput) { this.controllerManager.onPanMove(e); }//this.consoleView.log("panMove") }
        onPanEnd(e: HammerInput) { this.controllerManager.onPanEnd(e); }// this.consoleView.log("panEnd") }


        onPan2Start(e: HammerInput) { this.controllerManager.onPan2Start(e); this.consoleView.log("pan2Start " + e.pointers.length); }
        onPan2Move(e: HammerInput) { this.controllerManager.onPan2Move(e); }// this.consoleView.log("pan2Move " + e.pointers.length) }
        onPan2End(e: HammerInput) { this.controllerManager.onPan2End(e); }// this.consoleView.log("pan2End " + e.pointers.length) }

        onTap(e: HammerInput) { }// this.controllerManager.onTap(e); this.consoleView.log("tap_ " + (<any>e).tapCount); }

        onPinchStart(e: HammerInput) { /*this.controllerManager.onPanStart(e);*/ this.consoleView.log("pinchStart"); }
        onPinchMove(e: HammerInput) { /*this.controllerManager.onPanStart(e);*/ this.consoleView.log("pinchMove"); }
        onPinchEnd(e: HammerInput) { /*this.controllerManager.onPanStart(e);*/ this.consoleView.log("pinchEnd"); }

        setSelectController() {
            this.controllerManager.setController(this.transformObjectController);
            this.setActiveController(this.isSelectControllerActive);
            this.transformObjectViewVisible(true);
            this.profileViewVisible(false);
        }

        toggleProfileView() {
            if (this.profileViewVisible()) {
                this.profileViewVisible(false);
                this.transformObjectViewVisible(true);
            }
            else {
                this.profileViewVisible(true);
            }
        }

        toggleProfileDebug() {
            this.profileView.toggleDebug();
        }

        isSelectControllerActive = ko.observable(true);
        isMoveControllerActive = ko.observable(false);
        isScaleControllerActive = ko.observable(false);
        isScaleBottomControllerActive = ko.observable(false);

        setActiveController(c: KnockoutObservable<boolean>) {
            this.isSelectControllerActive(false);
            this.isMoveControllerActive(false);
            this.isScaleControllerActive(false);
            this.isScaleBottomControllerActive(false);
            c(true);
        }

        selectedName = ko.observable<string>();
        onObjectListChange() {
            this.setSelectedIndex(this.editor.workspace.getObjectIndex(this.selectedName()));
        }

        setSelectedIndex(i: number) {
            this.editor.setSelectedIndex(i);
            this.profileView.setSelectedIndex(i);
            //this.materialView.setSelectedIndex(i);
            this.transformObjectView.setSelectedIndex(i);
            if (i != -1)
                this.selectedName(this.editor.workspace.editorObjects[i].name);
        }

        private updateLoop() {
            this.controllerManager.updateLoop();
            this.profileView.updateLoop();
            this.animateLoop();
            this.editor.updateLoop();
            this.drawView.updateLoop();
            requestAnimationFrame(() => this.updateLoop());
        }


        // toolbars
        importToolbarVisible = ko.observable<boolean>(false);
        modifyToolbarVisible = ko.observable<boolean>(false);
        environmentToolbarVisible = ko.observable<boolean>(false);
        photoToolbarVisible = ko.observable<boolean>(false);
        printToolbarVisible = ko.observable<boolean>(false);
        transformObjectViewVisible = ko.observable<boolean>(false);
        profileViewVisible = ko.observable<boolean>(false);
        editorObjects = ko.observableArray<string>();
        consoleViewVisible = ko.observable(true);

        toolbarsVisible: KnockoutObservable<boolean>[] = [
            this.importToolbarVisible,
            this.modifyToolbarVisible,
            this.environmentToolbarVisible,
            this.photoToolbarVisible,
            this.printToolbarVisible];

        showImportToolbar() { this.setToolbar(this.importToolbarVisible); }

        showModifyToolbar() {
            if (!this.modifyToolbarVisible()) {
                this.setToolbar(this.modifyToolbarVisible);
                this.transformObjectViewVisible(true);
                this.setSelectController();
                //console.log("showModifyToolbar : " + this.editor.workspace.editorObjects.length);
                var editorNamesArray = ["Please Select"];
                for (let n of this.editor.workspace.editorObjects.map(x => x.name))
                    editorNamesArray.push(n);
                this.editorObjects(editorNamesArray);
            }
            else {
                this.setToolbar(this.modifyToolbarVisible);
            }
        }


        showEnvironmentToolbar() { this.setToolbar(this.environmentToolbarVisible); }
        showPhotoToolbar() { this.setToolbar(this.photoToolbarVisible); }
        showPrintToolbar() { this.setToolbar(this.printToolbarVisible); }

        setToolbar(selected: KnockoutObservable<boolean>) {
            this.transformObjectViewVisible(false);
            this.profileViewVisible(false);
            this.controllerManager.setController(null);


            var oldValue = selected();
            this.toolbarsVisible.forEach(t => t(false));
            //selected(true);
            selected(!oldValue);
        }

        light1() {
            var w = this.editor.workspace;
            w.keyLight.intensity = 0.8;
            w.fillLight.intensity = 0.2;
            w.rimLight.intensity = 0.2;
            this.editor.setRenderFlag();
        }

        light2() {
            var w = this.editor.workspace;
            w.keyLight.intensity = 0;
            w.fillLight.intensity = 0.5;
            w.rimLight.intensity = 0.5;
            this.editor.setRenderFlag();
        }

        toggleSoftwareHardware() {
            this.editor.toggleSimpleRenderer();
        }

        animRot = quat.create();
        animIndex = 0;
        doAnimate = false;
        animate() {
            this.doAnimate = !this.doAnimate;
        }
        animateLoop() {
            if (!this.doAnimate)
                return;

            var cameraTransforms = this.cameraController.cameraTransforms;
            cameraTransforms.zoom(this.animIndex < 20 ? 1 : -1, 1.05);
            //cameraTransforms.getRotation(this.animRot);
            //cameraTransforms.setRotation(this.tmpRotation);

            this.animIndex = (this.animIndex + 1) % 40;

            cameraTransforms.updateCamera(this.editor.getCamera());
            this.editor.setRenderFlag();
        }


    }
}