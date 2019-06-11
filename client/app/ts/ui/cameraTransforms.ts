module qec {
    export class cameraTransforms {
        transformMatrix = mat4.create();
        rotation = quat.fromValues(0, 0, 0, -1);
        rotationMat = mat4.create();
        panTranslation = mat4.identity(mat4.create());
        zTranslation = mat4.create();
        zcam = -3;

        // tmp vectors
        tmpVec3 = vec3.create();
        up = vec3.create();
        right = vec3.create();

        afterInject() {
            quat.normalize(this.rotation, this.rotation);
        }

        updateCamera(cam: camera) {
            mat4.copy(cam.transformMatrix, this.transformMatrix);
            mat4.invert(cam.inverseTransformMatrix, this.transformMatrix);
        }


        updateTransformMatrix() {
            mat4.fromQuat(this.rotationMat, this.rotation);
            mat4.multiply(this.transformMatrix, this.rotationMat, this.panTranslation);

            mat4.identity(this.zTranslation);
            mat4.translate(this.zTranslation, this.zTranslation, vec3.fromValues(0, 0, this.zcam));

            mat4.multiply(this.transformMatrix, this.zTranslation, this.transformMatrix);
        }


        reset(): void {
            //var angleFromVertical = 3.14/8;
            var angleFromVertical = 0;
            quat.setAxisAngle(this.rotation, vec3.fromValues(1, 0, 0), angleFromVertical);
            mat4.identity(this.panTranslation);
            this.zcam = -3;
            this.updateTransformMatrix();
        }

        getCenter(dest: Float32Array) {
            mat4.getTranslation(dest, this.panTranslation);
            vec3.scale(dest, dest, -1);
        }

        setCenter(center: Float32Array) {
            mat4.identity(this.panTranslation);
            vec3.scale(this.tmpVec3, center, -1);
            mat4.translate(this.panTranslation, this.panTranslation, this.tmpVec3);
            this.updateTransformMatrix();
        }

        getRotation(dest: Float32Array) {
            quat.copy(dest, this.rotation);
        }

        setRotation(rot: Float32Array) {
            quat.copy(this.rotation, rot);
            this.updateTransformMatrix();
        }

        setZcam(z: number) {
            this.zcam = z;
            this.updateTransformMatrix();
        }

        zoom(delta: number, multiplier) {
            if (delta < 0) {
                this.zcam *= multiplier;
            }
            else {
                this.zcam *= 1.0 / multiplier;
            }
            this.updateTransformMatrix();
        }


        pan(dx: number, dy: number) {
            this.up[0] = this.rotationMat[1];
            this.up[1] = this.rotationMat[5];
            this.up[2] = this.rotationMat[9];
            vec3.scale(this.up, this.up, dy);


            this.right[0] = this.rotationMat[0];
            this.right[1] = this.rotationMat[4];
            this.right[2] = this.rotationMat[8];

            vec3.scale(this.right, this.right, dx);

            mat4.translate(this.panTranslation, this.up, this.panTranslation);
            mat4.translate(this.panTranslation, this.right, this.panTranslation);
            this.updateTransformMatrix();
        }

        /*
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