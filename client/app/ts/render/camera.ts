module qec {

    export class cameraDTO {
        public static TYPE = 'cameraDTO';
        public type = cameraDTO.TYPE;
        constructor(
            public position: number[] = [1, 1, 1],
            public target: number[] = [0, 0, 0],
            public up: number[] = [1, 0, 0],
            public fov = Math.PI / 6
        ) { }
    }


    export class camera {

        projMatrix = mat4.create();
        transformMatrix = mat4.create();
        inversePMatrix = mat4.create();
        inverseTransformMatrix = mat4.create();


        private canvasWidth: number;
        private canvasHeight: number;

        position = vec3.create();
        target = vec3.create();
        up = vec3.create();
        fov = Math.PI / 6;

        tmpMatrix = mat4.create();
        tmpVec3 = vec3.create();

        createFrom(dto: cameraDTO): camera {
            vec3FromArray(this.position, dto.position);
            vec3FromArray(this.target, dto.target);
            vec3FromArray(this.up, dto.up);
            this.fov = dto.fov;
            this.updateMatrices();
            return this;
        }

        toDTO(dto: cameraDTO) {
            vec3ToArray(dto.position, this.position);
            vec3ToArray(dto.target, this.target);
            vec3ToArray(dto.up, this.up);
            dto.fov = this.fov;
        }

        setCam(camPos: Float32Array, camCenter: Float32Array, camUp: Float32Array) {
            vec3.copy(this.position, camPos);
            vec3.copy(this.target, camCenter);
            vec3.copy(this.up, camUp);
            this.updateMatrices();
        }

        setPosition(v: Float32Array) {
            vec3.copy(this.position, v);
            this.updateMatrices();
        }

        setTarget(v: Float32Array) {
            vec3.copy(this.target, v);
            this.updateMatrices();
        }

        setUp(v: Float32Array) {
            vec3.copy(this.up, v);
            this.updateMatrices();
        }

        rendererInit(canvasWidth: number, canvasHeight: number) {
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;

            mat4.perspective(this.projMatrix, this.fov, canvasWidth / canvasHeight, 0.1, 100);
            mat4.invert(this.inversePMatrix, this.projMatrix);
        }

        private updateMatrices() {
            mat4.lookAt(this.transformMatrix,
                this.position,
                this.target,
                this.up
            );
            mat4.invert(this.inverseTransformMatrix, this.transformMatrix);
        }

        getRayOrigin(ro: Float32Array) {
            vec3.set(ro, 0, 0, 0)
            vec3.transformMat4(ro, ro, this.inverseTransformMatrix);
        }

        getRay(mx: number, my: number, ro: Float32Array, rd: Float32Array) {
            var x = (2.0 * mx) / this.canvasWidth - 1.0;
            var y = 1.0 - (2.0 * my) / this.canvasHeight;
            this.getRayRel(x, y, ro, rd);
        }

        private ray_eye = vec4.create();
        private ray_clip = vec4.create();
        private ray_wor = vec4.create();

        private getRayRel(x: number, y: number, ro: Float32Array, rd: Float32Array) {
            //console.log('rayrel : ' + x + ' , ' + y);

            // http://antongerdelan.net/opengl/raycasting.html

            vec4.set(this.ray_clip, x, y, -1.0, 1.0);
            vec4.transformMat4(this.ray_eye, this.ray_clip, this.inversePMatrix);;
            this.ray_eye[2] = -1.0;
            this.ray_eye[3] = 0.0;

            vec4.transformMat4(this.ray_wor, this.ray_eye, this.inverseTransformMatrix);
            vec3.normalize(rd, this.ray_wor);

            vec3.set(ro, 0, 0, 0)
            vec3.transformMat4(ro, ro, this.inverseTransformMatrix);

        }

        getScreenPositionPreTransform(out: Float32Array, pos: Float32Array, transform: Float32Array) {
            vec3.transformMat4(this.tmpVec3, pos, transform);
            this.getScreenPosition(out, this.tmpVec3);
        }

        getScreenPosition(out: Float32Array, pos: Float32Array) {
            mat4.multiply(this.tmpMatrix, this.projMatrix, this.transformMatrix);
            vec3.transformMat4(out, pos, this.tmpMatrix);

            out[0] = (1 + out[0]) / 2 * this.canvasWidth;
            out[1] = (-1 + out[1]) / -2 * this.canvasHeight;

        }
    }
}