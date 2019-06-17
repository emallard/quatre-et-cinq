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
            //console.log(this.panTranslation);
            //return;
            this.up[0] = this.rotationMat[1];
            this.up[1] = this.rotationMat[5];
            this.up[2] = this.rotationMat[9];
            vec3.scale(this.up, this.up, dy);


            this.right[0] = this.rotationMat[0];
            this.right[1] = this.rotationMat[4];
            this.right[2] = this.rotationMat[8];

            vec3.scale(this.right, this.right, dx);

            mat4.translate(this.panTranslation, this.panTranslation, this.up);
            mat4.translate(this.panTranslation, this.panTranslation, this.right);

            this.updateTransformMatrix();
        }
    }
}