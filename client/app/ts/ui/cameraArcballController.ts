
module qec {

    export class cameraArcballController implements iController {

        editor: editor = inject(editor);
        transformObjectView: transformObjectView = inject(transformObjectView);

        button: number;
        arcball = new arcball();
        cameraTransforms: cameraTransforms = injectNew(cameraTransforms);

        collide: renderCollide = injectNew(renderCollide);
        ro = vec3.create();
        rd = vec3.create();

        tmpVec3 = vec3.create();
        tmpRotation = quat.create();
        tmpTranslation = mat4.create();


        isMouseDown: boolean;
        isRightClick: boolean;
        isLeftClick: boolean;
        isMiddleClick: boolean;
        isShiftKey: boolean;
        isAltKey: boolean;
        isCtrlKey: boolean;
        currentMouseXY = vec2.create();
        hasMouseMoved = false;

        startXY = vec2.create();
        startQuat = quat.create();
        dragQuat = quat.create();
        startTranslation = mat4.create();
        up = vec3.create();
        right = vec3.create();


        wm5Plane = new wm5Plane3();
        wm5IntrRay3Plane3: wm5IntrRay3Plane3 = inject(wm5IntrRay3Plane3);
        panPlaneFrom = vec3.create();
        panPlaneTo = vec3.create();
        panPlaneMove = vec3.create();

        afterInject() {
            this.cameraTransforms.reset();
            this.cameraTransforms.updateTransformMatrix();
            this.cameraTransforms.updateCamera(this.editor.getCamera());
        }

        setButton(button: number) {
            this.button = button;
        }

        cameraTop(n: Float32Array, x: Float32Array, y: Float32Array): void {
            var mat = mat3.fromValues(
                x[0], y[0], n[0],
                x[1], y[1], n[1],
                x[2], y[2], n[2]
            );

            this.cameraTransforms.setRotation(mat);
        }

        set() {

        }

        unset() {

        }
        //
        //  Mouse Interactions
        //

        onMouseWheel(e: WheelEvent) {
            if (this.isZoomEnabled) {
                this.hasMouseMoved = true;
                var orig = (<any>e).originalEvent;
                var d = Math.max(-1, Math.min(1, (orig.deltaY)));
                //console.log('mousewheel', orig.deltaY);

                this.cameraTransforms.zoom(d, 1.1);
                this.cameraTransforms.updateCamera(this.editor.getCamera());
                this.editor.setRenderFlag();
                this.transformObjectView.draw();
            }
        }


        isPanEnabled = true;
        isRotateEnabled = true;
        isZoomEnabled = true;

        setDisabledAll(b: boolean) {
            this.isPanEnabled = !b;
            this.isRotateEnabled = !b;
            this.isZoomEnabled = !b;
        }


        onMouseDown(e: MouseEvent) { };
        onMouseUp(e: MouseEvent) { };
        onMouseMove(e: MouseEvent) { };
        /*
    onMouseDown(e: MouseEvent) {
        this.isRightClick = (e.which == 3);
        this.isLeftClick = (e.which == 1);
        this.isMiddleClick = (e.which == 2);
        this.isShiftKey = e.shiftKey;
        this.isAltKey = e.altKey;
        this.isCtrlKey = e.ctrlKey;
        this.isMouseDown = true;

        // copy start state
        vec2.set(this.startXY, e.offsetX, e.offsetY)
        quat.copy(this.startQuat, this.cameraTransforms.rotation);
        mat4.copy(this.startTranslation, this.cameraTransforms.panTranslation);

        // pick point in 3D
        this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
        this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);
        if (this.collide.hasCollided) {

        }

    }

    onMouseUp(e: MouseEvent) {
        this.isMouseDown = false;
    }

    
    onMouseMove(e: MouseEvent) {
        vec2.set(this.currentMouseXY, e.offsetX, e.offsetY);
        this.hasMouseMoved = true;
    }*/

        updateLoop() {
            if (!this.hasMouseMoved)
                return;
            this.hasMouseMoved = false;



            if (this.isRotateEnabled) {
                //if (this.isMouseDown && this.isRightClick || this.isMouseDown && this.isCtrlKey) {
                if (this.isMouseDown && this.isLeftClick && !this.isShiftKey) {
                    var viewportWidth = this.editor.getViewportWidth();
                    var viewportHeight = this.editor.getViewportHeight();
                    var sphereRadius = 0.5 * Math.min(viewportWidth, viewportHeight);
                    this.arcball.getRotationFrom2dPoints(viewportWidth, viewportHeight, sphereRadius, this.startXY, this.currentMouseXY, this.dragQuat);

                    quat.multiply(this.tmpRotation, this.dragQuat, this.startQuat);
                    this.cameraTransforms.setRotation(this.tmpRotation);

                    this.cameraTransforms.updateCamera(this.editor.getCamera());
                    this.editor.setRenderFlag();
                    this.transformObjectView.draw();
                }
            }


            if (this.isPanEnabled) {
                if ((this.isMouseDown && this.isShiftKey)
                    || (this.isMouseDown && this.isMiddleClick)) {

                    var cam = this.editor.getCamera();
                    this.cameraTransforms.getCenter(this.tmpVec3);
                    cam.getRayOrigin(this.ro);
                    vec3.subtract(this.wm5Plane.normal, this.ro, cam.tmpVec3);
                    vec3.normalize(this.wm5Plane.normal, this.wm5Plane.normal);
                    this.wm5Plane.computeConstant(cam.target);

                    cam.getRay(this.startXY[0], this.startXY[1], this.ro, this.rd);
                    this.wm5IntrRay3Plane3.setAll(this.ro, this.rd, this.wm5Plane);
                    this.wm5IntrRay3Plane3.find();
                    this.wm5IntrRay3Plane3.getIntersection(this.panPlaneFrom);

                    cam.getRay(this.currentMouseXY[0], this.currentMouseXY[1], this.ro, this.rd);
                    this.wm5IntrRay3Plane3.setAll(this.ro, this.rd, this.wm5Plane);
                    this.wm5IntrRay3Plane3.find();
                    this.wm5IntrRay3Plane3.getIntersection(this.panPlaneTo);

                    vec3.subtract(this.panPlaneMove, this.panPlaneTo, this.panPlaneFrom);
                    //console.log("panPlaneFrom : ", this.panPlaneFrom);
                    //console.log("panPlaneTo : ", this.panPlaneTo);
                    mat4.identity(this.tmpTranslation);
                    mat4.translate(this.tmpTranslation, this.tmpTranslation, this.panPlaneMove);
                    mat4.multiply(this.tmpTranslation, this.tmpTranslation, this.startTranslation);

                    this.cameraTransforms.setTranslation(this.tmpTranslation);
                    this.cameraTransforms.updateCamera(this.editor.getCamera());
                    this.editor.setRenderFlag();
                    this.transformObjectView.draw();
                }
            }

        }

        onTouchStart(e: TouchEvent) { }
        onTouchMove(e: TouchEvent) { }
        onTouchEnd(e: TouchEvent) { }
        /*
        onTouchStart(e: TouchEvent) {
            this.isRightClick = true;
            this.isLeftClick = false;
            this.isMiddleClick = false;
            this.isShiftKey = false;
            this.isMouseDown = true;

            // copy start state
            vec2.set(this.startXY, e.touches[0].clientX, e.touches[0].clientY)
            quat.copy(this.startQuat, this.cameraTransforms.rotation);
            mat4.copy(this.startTranslation, this.cameraTransforms.panTranslation);

            // pick point in 3D
            this.editor.getCamera().getRay(e.touches[0].clientX, e.touches[0].clientY, this.ro, this.rd);
            this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);
        }

        onTouchMove(e: TouchEvent) {
            vec2.set(this.currentMouseXY, e.touches[0].clientX, e.touches[0].clientY);
            this.hasMouseMoved = true;
        }

        onTouchEnd(e: TouchEvent) {
            this.isMouseDown = false;
        }*/

        onPanStart(e: HammerInput) {
            this.isRightClick = false;
            this.isLeftClick = true;
            this.isMiddleClick = false;
            this.isShiftKey = e.srcEvent.shiftKey;
            this.isCtrlKey = e.srcEvent.ctrlKey;
            this.isMouseDown = true;

            // copy start state
            vec2.set(this.startXY, e.center.x, e.center.y);
            quat.copy(this.startQuat, this.cameraTransforms.rotation);
            mat4.copy(this.startTranslation, this.cameraTransforms.panTranslation);


            // pick point in 3D
            this.editor.getCamera().getRay(e.center.x, e.center.y, this.ro, this.rd);
            this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);
        }

        onPanMove(e: HammerInput) {
            vec2.set(this.currentMouseXY, e.center.x, e.center.y);
            this.hasMouseMoved = true;
        }

        onPanEnd(e: HammerInput) {
            this.isMouseDown = false;
        }

        onPan2Start(e: HammerInput) {
            this.isRightClick = false;
            this.isLeftClick = true;
            this.isMiddleClick = false;
            this.isShiftKey = true;
            this.isAltKey = false;
            this.isCtrlKey = false;
            this.isMouseDown = true;

            // copy start state
            vec2.set(this.startXY, e.pointers[0].offsetX, e.pointers[0].offsetY)
            quat.copy(this.startQuat, this.cameraTransforms.rotation);
            mat4.copy(this.startTranslation, this.cameraTransforms.panTranslation);

            // pick point in 3D
            this.editor.getCamera().getRay(e.pointers[0].offsetX, e.pointers[0].offsetY, this.ro, this.rd);
            this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);
        }

        onPan2Move(e: HammerInput) {
            vec2.set(this.currentMouseXY, e.pointers[0].offsetX, e.pointers[0].offsetY);
            this.hasMouseMoved = true;
        }
        onPan2End(e: HammerInput) {
            this.isMouseDown = false;
        }

        onTap(e: HammerInput) {

        }
    }
}