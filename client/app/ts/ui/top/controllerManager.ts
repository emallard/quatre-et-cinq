module qec {

    export class controllerManager
    {
        camActive = true;
        cameraController = new cameraController();
        currentController:iController;
        vm:appVm;
        view:appView;

        constructor()
        {
            this.cameraController.setButton(2);
        }

        setElement(elt:Element)
        {
            // register on mouse move
            // register on mouse click
            //var elt = document.getElementsByClassName('.renderContainer')[0];
            //elt = elt.firstElementChild;
            elt.addEventListener('mousemove', (e) => this.onMouseMove(e));
            elt.addEventListener('mousedown', (e) => this.onMouseDown(e));
            elt.addEventListener('mouseup', (e) => this.onMouseUp(e));
            elt.addEventListener('mousewheel', (e) => this.onMouseWheel(e));
            elt.addEventListener('DOMMouseScroll', (e) => this.onMouseWheel(e));
        }

        setVm(vm:appVm, view:appView)
        {
            this.vm = vm;
            this.view = view;
            this.cameraController.set(vm);
            this.cameraController.updateCamera();
        }

        setController(c:iController)
        {
            if (this.currentController != null)
                this.currentController.unset();
            
            this.currentController = c;
            c.set(this.vm, this.view);
        }

        onMouseMove(e:Event)
        {
            if (this.camActive)
                this.cameraController.onMouseMove(<MouseEvent> e);

            if (this.currentController != null)
                this.currentController.onMouseMove(<MouseEvent> e);
        }

        onMouseDown(e:Event)
        {
            if (this.camActive)
                this.cameraController.onMouseDown(<MouseEvent> e);

            if (this.currentController != null)
                this.currentController.onMouseDown(<MouseEvent> e);
        }

        onMouseUp(e:Event)
        {
            if (this.camActive)
                this.cameraController.onMouseUp(<MouseEvent> e);

            if (this.currentController != null)
                this.currentController.onMouseUp(<MouseEvent> e);
        }

        onMouseWheel(e:Event)
        {
            if (this.camActive)
                this.cameraController.onMouseWheel(<MouseWheelEvent> e);

            if (this.currentController != null)
                this.currentController.onMouseWheel(<MouseWheelEvent> e);
        }

        updateLoop()
        {
            if (this.camActive)
                this.cameraController.updateLoop();

            if (this.currentController != null)
                this.currentController.updateLoop();
        }

    }

    export interface iController
    {
        set(vm:appVm, view:appView);
        unset();
        onMouseMove(e:MouseEvent);
        onMouseDown(e:MouseEvent);
        onMouseUp(e:MouseEvent);
        onMouseWheel(e:MouseWheelEvent);
        updateLoop();
    }
}