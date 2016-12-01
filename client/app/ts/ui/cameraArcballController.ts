
module qec
{

    export class cameraArcballController
    {

        editor:editor = inject(editor);

        viewportWidth:number;
        viewportHeight:number;
        button:number;
        arcball = new arcball();
        cameraTransforms:cameraTransforms = injectNew(cameraTransforms);
        
        tmpVec3 = vec3.create();
        tmpRotation = quat.create();

        afterInject()
        {
            this.cameraTransforms.reset();
            this.cameraTransforms.updateTransformMatrix();
        }

        setButton(button:number)
        {
            this.button = button;
        }

        cameraTop(n:Float32Array, x:Float32Array, y:Float32Array):void
        {
            var mat = mat3.fromValues(
                x[0], y[0], n[0],
                x[1], y[1], n[1],
                x[2], y[2], n[2]
            );

            this.cameraTransforms.setRotation(mat);
        }

        //
        //  Mouse Interactions
        //

        onMouseWheel(e:WheelEvent)
        {
            if (this.isZoomEnabled)
            {
                this.hasMouseMoved = true;
                var orig = (<any> e).originalEvent;
                var d = Math.max(-1, Math.min(1, (orig.deltaY)));
                //console.log('mousewheel', orig.deltaY);

                this.cameraTransforms.zoom(d);
                this.cameraTransforms.updateCamera(this.editor.getCamera());
                this.editor.setRenderFlag();
            }
        }

        isPanEnabled = true;
        isRotateEnabled = true;
        isZoomEnabled = true;

        setDisabledAll(b:boolean)
        {
            this.isPanEnabled = !b;
            this.isRotateEnabled = !b;
            this.isZoomEnabled = !b;
        }

        isMouseDown:boolean;
        isRightClick:boolean;
        isLeftClick:boolean;
        isMiddleClick:boolean;
        isShiftKey:boolean;
        currentMouseXY = vec2.create();
        hasMouseMoved = false;

        startXY = vec2.create();
        startQuat = quat.create();
        startPan = mat4.create();
        up = vec3.create();
        right = vec3.create();

        
        onMouseDown(event:MouseEvent)
        {
            this.isRightClick = (event.which == 3);
            this.isLeftClick = (event.which == 1);
            this.isMiddleClick = (event.which == 2);
            this.isShiftKey = event.shiftKey;
            this.isMouseDown = true;

            // copy start state
            vec2.set(this.startXY, event.offsetX, event.offsetY)
            quat.copy(this.startQuat, this.cameraTransforms.rotation);
            mat4.copy(this.startPan, this.cameraTransforms.panTranslation);
            this.viewportWidth = this.editor.getViewportWidth();
            this.viewportHeight = this.editor.getViewportHeight();
        }

        onMouseUp(event:MouseEvent)
        {
            this.isMouseDown = false;
        }

        dragQuat = quat.create();
        onMouseMove(event:MouseEvent)
        {
            vec2.set(this.currentMouseXY, event.offsetX, event.offsetY);
            this.hasMouseMoved = true;
        }

        updateLoop()
        {
            if (!this.hasMouseMoved)
                return;
            this.hasMouseMoved = false;
            
            if (this.isRotateEnabled)
            {
                if (this.isMouseDown && this.isRightClick && !this.isShiftKey)
                {
                    var sphereRadius = 0.5*Math.min(this.viewportWidth, this.viewportHeight);
                    this.arcball.getRotationFrom2dPoints(this.viewportWidth, this.viewportHeight, sphereRadius, this.startXY, this.currentMouseXY, this.dragQuat);

                    quat.multiply(this.tmpRotation, this.dragQuat, this.startQuat);
                    this.cameraTransforms.setRotation(this.tmpRotation);

                    this.cameraTransforms.updateCamera(this.editor.getCamera());
                    this.editor.setRenderFlag();
                }
            }

            
            if (this.isPanEnabled)
            {
                if ((this.isMouseDown && this.isRightClick && this.isShiftKey)
                    || (this.isMouseDown && this.isMiddleClick))
                {

                    var xFactor = -this.cameraTransforms.zcam / this.viewportWidth;
                    var yFactor = this.cameraTransforms.zcam / this.viewportHeight;
                    this.cameraTransforms.pan(this.currentMouseXY[0] * xFactor, this.currentMouseXY[1] * yFactor)
                }
            }
            
        }
    }
}