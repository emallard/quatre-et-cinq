module qec {


    export class transformObjectAndCameraController implements iController {

        transformObjectController: transformObjectController = inject(transformObjectController);
        cameraArcballController: cameraArcballController = inject(cameraArcballController);

        set() {
            this.transformObjectController.set();
            this.cameraArcballController.set();
        }
        unset() {
            this.transformObjectController.unset();
            this.cameraArcballController.unset();
        }
        onMouseMove(e: MouseEvent) {
            this.transformObjectController.onMouseMove(e);
            this.cameraArcballController.onMouseMove(e);
        }
        onMouseDown(e: MouseEvent) {
            this.transformObjectController.onMouseDown(e);
            this.cameraArcballController.onMouseDown(e);
        }
        onMouseUp(e: MouseEvent) {
            this.transformObjectController.onMouseUp(e);
            this.cameraArcballController.onMouseUp(e);
        }
        onMouseWheel(e: WheelEvent) {
            this.transformObjectController.onMouseWheel(e);
            this.cameraArcballController.onMouseWheel(e);
        }
        onTouchStart(e: TouchEvent) {
            this.transformObjectController.onTouchStart(e);
            this.cameraArcballController.onTouchStart(e);
        }
        onTouchMove(e: TouchEvent) {
            this.transformObjectController.onTouchMove(e);
            this.cameraArcballController.onTouchMove(e);
        }
        onTouchEnd(e: TouchEvent) {
            this.transformObjectController.onTouchEnd(e);
            this.cameraArcballController.onTouchEnd(e);
        }
        onPanStart(e: HammerInput) {
            this.transformObjectController.onPanStart(e);
            this.cameraArcballController.onPanStart(e);
        }
        onPanMove(e: HammerInput) {
            this.transformObjectController.onPanMove(e);
            this.cameraArcballController.onPanMove(e);
        }
        onPanEnd(e: HammerInput) {
            this.transformObjectController.onPanEnd(e);
            this.cameraArcballController.onPanEnd(e);
        }
        onPan2Start(e: HammerInput) {
            this.cameraArcballController.onPan2Start(e);
        }
        onPan2Move(e: HammerInput) {
            this.cameraArcballController.onPan2Move(e);
        }
        onPan2End(e: HammerInput) {
            this.cameraArcballController.onPan2End(e);
        }
        onTap(e: HammerInput) {
            this.transformObjectController.onTap(e);
            this.cameraArcballController.onTap(e);
        }
        updateLoop() {
            if (this.transformObjectController.handlePicked)
                this.transformObjectController.updateLoop();
            else
                this.cameraArcballController.updateLoop();
        }
    }
}