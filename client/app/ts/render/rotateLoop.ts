module qec {

    export class rotateLoop {
        rs: renderSettings;
        rotates: rotateOne[] = [];
        t: number = 0;

        setRenderSettings(rs: renderSettings) {
            this.rs = rs;
            let camTarget = vec3.fromValues(this.rs.camera.target[0], this.rs.camera.target[1], 0);

            let invCameraTarget = mat4.create();
            mat4.identity(invCameraTarget);
            mat4.translate(invCameraTarget, invCameraTarget, camTarget);
            mat4.invert(invCameraTarget, invCameraTarget);

            let array = (<sdUnion>this.rs.sd).array;
            console.log('array ', array);
            for (let x of array) {
                if (x['transform'] != undefined) {
                    let r = new rotateOne();
                    r.sd = x;
                    mat4.copy(r.transformInit, x['transform']);
                    mat4.multiply(r.transformFromCamTarget, invCameraTarget, r.transformInit);
                    mat4.identity(r.transformRotate);
                    this.rotates.push(r);
                }
            };
        }

        update(dt: number) {
            let camTarget = vec3.fromValues(this.rs.camera.target[0], this.rs.camera.target[1], 0);

            this.t += dt;
            let dr = mat4.create();
            mat4.fromZRotation(dr, this.t * Math.PI * 2.0 / 10.0);

            for (let r of this.rotates) {
                mat4.copy(r.transformRotate, dr);
                mat4.identity(r.sd.transform);
                mat4.translate(r.sd.transform, r.sd.transform, camTarget);
                mat4.multiply(r.sd.transform, r.sd.transform, r.transformRotate)
                mat4.multiply(r.sd.transform, r.sd.transform, r.transformFromCamTarget);
                mat4.invert(r.sd.inverseTransform, r.sd.transform);
            }
        }
    }


    export class rotateOne {
        sd: any;
        transformInit = mat4.create();
        transformFromCamTarget = mat4.create();
        transformRotate = mat4.create();
    }
}