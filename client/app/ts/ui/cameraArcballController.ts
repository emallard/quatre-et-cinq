
module qec
{

    export class cameraArcballController
    {

        projectionMatrix = mat4.create();
        transformMatrix = mat4.create();
        viewportWidth:number;
        viewportHeight:number;

        rotation = quat.normalize(null, quat.fromValues(0,0,0,-1));
        rotationMat = mat4.create();
        panTranslation = mat4.identity(mat4.create());
        zTranslation = mat4.create();
        zcam = -0.06;

        arcball = new arcball();
        tmpVec3 = vec3.create();

        afterInject()
        {
            this.reset();
        }

        // called by view
        initFromView(viewportWidth:number, viewportHeight:number)
        {
            this.setCanvasSize(viewportWidth, viewportHeight);
        }

        setCanvasSize(viewportWidth:number, viewportHeight:number)
        {
            this.viewportWidth = viewportWidth;
            this.viewportHeight = viewportHeight;

            this.arcball.setBounds(viewportWidth, viewportHeight);

            mat4.perspective(this.projectionMatrix, 30, viewportWidth / viewportHeight, 0.001, 10.0);
            this.updateTransformMatrix();
        }

        // compute transform matrix from rotation, zTranslation and panTranslation
        updateTransformMatrix()
        {
            mat4.fromQuat(this.rotationMat, this.rotation);
            mat4.multiply(this.transformMatrix, this.rotationMat, this.panTranslation);

            mat4.identity(this.zTranslation);
            mat4.translate(this.zTranslation, this.zTranslation, vec3.fromValues(0, 0, this.zcam));

            mat4.multiply(this.zTranslation, this.transformMatrix, this.transformMatrix);
        }

        initUI()
        {
            this.reset();
        }

        reset():void
        {
            //var angleFromVertical = 3.14/8;
            var angleFromVertical = 0;
            quat.setAxisAngle(this.rotation, vec3.fromValues(1,0,0), angleFromVertical);
            mat4.identity(this.panTranslation );
            this.zcam = -0.06;
            this.updateTransformMatrix();
        }

        getCenter(dest:Float32Array)
        {
            mat4.getTranslation(dest, this.panTranslation);
            vec3.scale(dest, dest, -1);
        }

        setCenter(center:Float32Array)
        {
            mat4.identity(this.panTranslation);
            vec3.scale(this.tmpVec3, center, -1);
            mat4.translate(this.panTranslation, this.panTranslation, this.tmpVec3);
            this.updateTransformMatrix();
        }

        getRotation(dest:Float32Array)
        {
            quat.copy(dest, this.rotation);
        }

        setRotation(rot:Float32Array)
        {
            quat.copy(this.rotation, rot);
            this.updateTransformMatrix();
        }

        setZcam(z:number)
        {
            this.zcam = z;
            this.updateTransformMatrix();
        }


        cameraTop(n:Float32Array, x:Float32Array, y:Float32Array):void
        {
            /*
            var n = vec3.create();
            var x = vec3.create();
            var y = vec3.create();
            this.workingPlaneService.getNormal(n);
            this.workingPlaneService.getX(x);
            this.workingPlaneService.getY(y);
            */
            /*
            var mat = mat3.createFrom(
                x[0], x[1], x[2],
                y[0], y[1], y[2],
                n[0], n[1], n[2]
            );
            */
            var mat = mat3.fromValues(
                x[0], y[0], n[0],
                x[1], y[1], n[1],
                x[2], y[2], n[2]
            );

            quat.fromMat3(this.rotation, mat);
            
            this.updateTransformMatrix();
        }


        zoom(delta:number)
        {
            if (delta < 0)
            {
                this.zcam *= 1.1;
            }
            else
            {
                this.zcam *= 0.9;
            }
            this.updateTransformMatrix();
        }


        pan(dx:number, dy:number)
        {
            var xFactor = -this.zcam / this.viewportWidth;
            var yFactor = this.zcam / this.viewportHeight;

            this.up[0] = this.rotationMat[1];
            this.up[1] = this.rotationMat[5];
            this.up[2] = this.rotationMat[9];
            vec3.scale(this.up, this.up, yFactor * dy);


            this.right[0] = this.rotationMat[0];
            this.right[1] = this.rotationMat[4];
            this.right[2] = this.rotationMat[8];

            vec3.scale(this.right, this.right, xFactor * dx);

            mat4.translate(this.panTranslation, this.up, this.panTranslation);
            mat4.translate(this.panTranslation, this.right, this.panTranslation);
            this.updateTransformMatrix();
        }

        //
        //  Mouse Interactions
        //

        onMouseWheel(sender:any, event:any, delta:any)
        {
            if (this.isZoomEnabled)
            {
                this.zoom(delta);
            }
            this.updateTransformMatrix();
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

        /*
        startRotate(relMouse:Float32Array)
        {
            this.arcball.click(relMouse);
            quat4.set(this.rotation, this.startQuat);
            mat4.set(this.panTranslation, this.startPan);
        }


        updateRotate(relMouse:Float32Array)
        {
            this.arcball.drag(relMouse, this.dragQuat);
            quat4.normalize(this.dragQuat);
            quat4.inverse(this.dragQuat);

            quat4.multiply(this.startQuat, this.dragQuat, this.rotation);
        }

        //
        //
        //

        onMouseDown(sender, event, relMouse:Float32Array)
        {
            this.isRightClick = (event.which == 3);
            this.isLeftClick = (event.which == 1);
            this.isMiddleClick = (event.which == 2);
            this.isShiftKey = event.shiftKey;

            vec2.set(relMouse, this.currentMouseXY);
            this.isMouseDown = true;
            vec2.set(this.currentMouseXY, this.startXY);

            this.arcball.click(this.currentMouseXY);
            quat4.set(this.rotation, this.startQuat);
            mat4.set(this.panTranslation, this.startPan);

            if (this.isRightClick)
            {
                this.arcballViewModel.setVisible(true);
            }
        }

        onMouseUp(sender, event, relMouse:Float32Array)
        {
            this.isMouseDown = false;
            this.arcballViewModel.setVisible(false);
        }

        dragQuat = quat4.create();
        onMouseMove(sender, event, relMouse:Float32Array)
        {
            vec2.set(relMouse, this.currentMouseXY);
            this.hasMouseMoved = true;
        }

        logAngleAxis = quat4.create();
        onUpdate()
        {
            if (this.isRotateEnabled)
            {
                if (this.isMouseDown && this.isRightClick && !this.isShiftKey)
                {

                    this.arcball.drag(this.currentMouseXY, this.dragQuat);
                    quat4.normalize(this.dragQuat);
                    quat4.inverse(this.dragQuat);

                    quat4.multiply(this.startQuat, this.dragQuat, this.rotation);
                }
            }

            if (this.isPanEnabled)
            {
                if ((this.isMouseDown && this.isRightClick && this.isShiftKey)
                    || (this.isMouseDown && this.isMiddleClick))
                {

                    var xFactor = -this.zcam / this.viewportWidth;
                    var yFactor = this.zcam / this.viewportHeight;

                    this.up[0] = this.rotationMat[1];
                    this.up[1] = this.rotationMat[5];
                    this.up[2] = this.rotationMat[9];
                    vec3.scale(this.up, yFactor * (this.currentMouseXY[1] - this.startXY[1]));


                    this.right[0] = this.rotationMat[0];
                    this.right[1] = this.rotationMat[4];
                    this.right[2] = this.rotationMat[8];

                    vec3.scale(this.right, xFactor * (this.currentMouseXY[0] - this.startXY[0]));

                    mat4.translate(this.startPan, this.up, this.panTranslation);
                    mat4.translate(this.panTranslation, this.right, this.panTranslation);
                }
            }

            this.updateTransformMatrix();
        }

        //
        // getRay
        //

        getRay(mouse:Float32Array, dest:ray)
        {
            var x = (2.0 * mouse[0]) / this.viewportWidth - 1.0;
            var y = 1.0 - (2.0 * mouse[1]) / this.viewportHeight;
            this.getRayRel(x, y, dest);
        }


        getRayRel(x:number, y:number, dest:ray)
        {
            var projMatrix = this.projectionMatrix;
            var transformMatrix = this.transformMatrix;


            var ray_clip = vec4.createFrom(x, y, -1.0, 1.0);

            var inversePMatrix = mat4.create();
            mat4.inverse(projMatrix, inversePMatrix);

            var ray_eye = vec4.create();
            mat4.multiplyVec4(inversePMatrix, ray_clip, ray_eye);
            ray_eye[2] = -1.0;
            ray_eye[3] = 0.0;

            var ray_wor = vec3.create();
            var inverseTransformMatrix = mat4.create();
            mat4.inverse(transformMatrix, inverseTransformMatrix);

            mat4.multiplyVec4(inverseTransformMatrix, ray_eye, ray_wor);

            vec3.normalize(ray_wor);

            var origin = vec3.create();
            mat4.multiplyVec3(inverseTransformMatrix, origin);

            vec3.set(origin, dest.origin);
            vec3.set(ray_wor, dest.direction);
        }



        tmpMat4 = mat4.create();
        rotCpy = mat4.create();
        vecx = vec3.createFrom(1,0,0);
        vecy = vec3.createFrom(0,1,0);
        vecz = vec3.createFrom(0,0,1);
        tmpQuat = quat4.create();
        tmpVec = vec3.create();
        tmpRotAxis = vec3.create();

        getPitch(quat:Float32Array)
        {
            var x = quat[0];
            var y = quat[1]
            var z = quat[2]
            var w = quat[3]
            return Math.atan2(2*x*w - 2*y*z, 1 - 2*x*x - 2*z*z);
        }

        getYaw(quat:Float32Array)
        {
            var x = quat[0];
            var y = quat[1]
            var z = quat[2]
            var w = quat[3]
            return Math.asin(2*x*y + 2*z*w);
        }

        rotateRight()
        {
            quat4.fromAngleAxis(3.14/20, this.vecz, this.tmpQuat);
            quat4.multiply(this.tmpQuat, this.rotation, this.rotation);

            this.updateTransformMatrix();
        }

        rotateLeft()
        {
            //quat4.fromAngleAxis(-3.14/20, this.vecy, this.tmpQuat);
            //quat4.multiply(this.rotation, this.tmpQuat, this.rotation);
            quat4.fromAngleAxis(-3.14/20, this.vecz, this.tmpQuat);
            quat4.multiply(this.tmpQuat, this.rotation, this.rotation);
            this.updateTransformMatrix();
        }

        rotateUp()
        {

            quat4.multiplyVec3(this.rotation, this.vecz, this.tmpVec);
            //console.log(vec3.str(this.tmpVec));

            vec3.cross(this.vecz, this.tmpVec, this.tmpRotAxis);
            vec3.normalize(this.tmpRotAxis);

            quat4.fromAngleAxis(-3.14/20, this.tmpRotAxis, this.tmpQuat);
            quat4.multiply(this.tmpQuat, this.rotation, this.rotation);

            // quat4.fromAngleAxis(3.14/20, this.vecx, this.tmpQuat);
            //quat4.multiply(this.rotation, this.tmpQuat, this.rotation);
            this.updateTransformMatrix();

        }

        rotateDown()
        {
            quat4.fromAngleAxis(-3.14/20, this.vecx, this.tmpQuat);
            quat4.multiply(this.rotation, this.tmpQuat, this.rotation);
            this.updateTransformMatrix();
        }
        */
    }

}