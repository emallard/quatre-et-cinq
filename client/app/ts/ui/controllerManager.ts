module qec {

    export class controllerManager {
        camActive = true;
        //cameraController:cameraController = inject(cameraController);
        cameraController: cameraArcballController = inject(cameraArcballController);

        currentController: iController;

        afterInject() {
            this.cameraController.setButton(2);
            //this.cameraController.updateCamera();
        }
        /*
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
        }*/


        setController(c: iController) {
            if (this.currentController != null)
                this.currentController.unset();

            this.currentController = c;
            c.set();
        }

        onMouseMove(e: Event) {
            if (this.camActive)
                this.cameraController.onMouseMove(<MouseEvent>e);

            if (this.currentController != null)
                this.currentController.onMouseMove(<MouseEvent>e);
        }

        onMouseDown(e: Event) {
            if (this.camActive)
                this.cameraController.onMouseDown(<MouseEvent>e);

            if (this.currentController != null)
                this.currentController.onMouseDown(<MouseEvent>e);
        }

        onMouseUp(e: Event) {
            if (this.camActive)
                this.cameraController.onMouseUp(<MouseEvent>e);

            if (this.currentController != null)
                this.currentController.onMouseUp(<MouseEvent>e);
        }

        onMouseWheel(e: Event) {
            if (this.camActive)
                this.cameraController.onMouseWheel(<WheelEvent>e);

            if (this.currentController != null)
                this.currentController.onMouseWheel(<WheelEvent>e);
        }

        onTouchStart(e: Event) {
            if (this.camActive)
                this.cameraController.onTouchStart(<TouchEvent>e);
        }

        onTouchMove(e: Event) {
            if (this.camActive)
                this.cameraController.onTouchMove(<TouchEvent>e);
        }

        onTouchEnd(e: Event) {
            if (this.camActive)
                this.cameraController.onTouchEnd(<TouchEvent>e);
        }

        updateLoop() {
            if (this.camActive)
                this.cameraController.updateLoop();

            if (this.currentController != null)
                this.currentController.updateLoop();
        }

    }

    export interface iController {
        set();
        unset();
        onMouseMove(e: MouseEvent);
        onMouseDown(e: MouseEvent);
        onMouseUp(e: MouseEvent);
        onMouseWheel(e: WheelEvent);
        onTouchStart(e: TouchEvent);
        onTouchMove(e: TouchEvent);
        onTouchEnd(e: TouchEvent);
        updateLoop();
    }
}