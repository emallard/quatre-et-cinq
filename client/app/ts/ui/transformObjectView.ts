module qec {

    export class transformObjectView {

        editor: editor = inject(qec.editor);
        transformObjectUtils: transformObjectUtils = inject(transformObjectUtils);
        canvas: HTMLCanvasElement;

        points: Float32Array[] = [];

        selectedIndex = -1;
        tmpObjectTransform = mat4.create();
        bbmin = vec3.create();
        bbmax = vec3.create();
        center = vec3.create();
        centerTop = vec3.create();
        centerBottom = vec3.create();
        p1 = vec3.create();
        p2 = vec3.create();
        p3 = vec3.create();
        p4 = vec3.create();
        p5 = vec3.create();
        p6 = vec3.create();
        p7 = vec3.create();
        p8 = vec3.create();

        s1 = vec3.create();
        s2 = vec3.create();
        s3 = vec3.create();
        s4 = vec3.create();

        camDir = vec3.create();
        vdot1 = vec3.create();
        vdot2 = vec3.create();


        init(elt: HTMLElement) {

            this.canvas = document.createElement('canvas');
            this.canvas.style.border = 'solid 1px red';
            elt.appendChild(this.canvas);
            this.canvas.width = window.innerWidth - 2;
            this.canvas.height = window.innerHeight - 102;
            this.draw();
        }

        setSelectedIndex(i: number) {
            this.selectedIndex = i;
            this.draw();
        }


        draw() {

            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.selectedIndex < 0)
                return;

            var l = this.editor.workspace.getSelectedObject();


            l.getAbsoluteBounds(this.bbmin, this.bbmax);

            vec3.set(this.p1, this.bbmin[0], this.bbmin[1], this.bbmin[2]);
            vec3.set(this.p2, this.bbmin[0], this.bbmax[1], this.bbmin[2]);
            vec3.set(this.p3, this.bbmax[0], this.bbmax[1], this.bbmin[2]);
            vec3.set(this.p4, this.bbmax[0], this.bbmin[1], this.bbmin[2]);

            vec3.set(this.p5, this.bbmin[0], this.bbmin[1], this.bbmax[2]);
            vec3.set(this.p6, this.bbmin[0], this.bbmax[1], this.bbmax[2]);
            vec3.set(this.p7, this.bbmax[0], this.bbmax[1], this.bbmax[2]);
            vec3.set(this.p8, this.bbmax[0], this.bbmin[1], this.bbmax[2]);

            var _1 = this.p1;
            var _2 = this.p2;
            var _3 = this.p3;
            var _4 = this.p4;
            var _5 = this.p5;
            var _6 = this.p6;
            var _7 = this.p7;
            var _8 = this.p8;

            this.drawSquare(_1, _2, _3, _4);
            this.drawSquare(_5, _8, _7, _6);

            this.drawSquare(_1, _4, _8, _5);
            this.drawSquare(_2, _6, _7, _3);

            this.drawSquare(_1, _5, _6, _2);
            this.drawSquare(_4, _3, _7, _8);


            var rw = 40;

            this.transformObjectUtils.getMoveHandleScreenCoordinates(this.center, l);
            this.transformObjectUtils.getScaleTopHandleScreenCoordinates(this.centerTop, l);

            ctx.strokeStyle = "rgba(0,255,0,1)";
            ctx.strokeRect(this.center[0] - 0.5 * rw, this.center[1] - 0.5 * rw, rw, rw);

            ctx.strokeStyle = "rgba(255, 255, 0,1)";
            ctx.strokeRect(this.centerTop[0] - 0.5 * rw, this.centerTop[1] - 0.5 * rw, rw, rw);


            ctx.beginPath();
            ctx.moveTo(this.center[0], this.center[1]);
            ctx.lineTo(this.centerTop[0], this.centerTop[1]);
            ctx.stroke();
            ctx.closePath();

            /*

            ctx.strokeStyle = "rgba(128,128,128,1)";
            ctx.beginPath();
            ctx.moveTo(centerDown[0], centerDown[1]);
            ctx.lineTo(centerUp[0], centerUp[1]);
            ctx.stroke();
            ctx.closePath();


            this.points = [screenPosition1, screenPosition2, screenPosition3, screenPosition4]
            ctx.strokeStyle = "rgba(128,128,128,1)";
            ctx.beginPath();
            ctx.moveTo(this.points[0][0], this.points[0][1]);
            for (var i = 0; i < this.points.length; i++) {
                ctx.lineTo(this.points[i][0], this.points[i][1]);
            }
            ctx.lineTo(this.points[0][0], this.points[0][1]);

            ctx.stroke();
            ctx.closePath();
            */
        }

        drawSquare(_1: Float32Array, _2: Float32Array, _3: Float32Array, _4: Float32Array) {
            var camera = this.editor.getCamera();

            this.camDir[0] = camera.transformMatrix[2];
            this.camDir[1] = camera.transformMatrix[6];
            this.camDir[2] = camera.transformMatrix[10];
            //vec3.subtract(this.camDir, camera.target, camera.position);

            // check if square faces the camera
            vec3.subtract(this.vdot1, _1, _2);
            vec3.subtract(this.vdot2, _3, _2);
            var cross = vec3.cross(this.vdot1, this.vdot1, this.vdot2);
            var dot = vec3.dot(cross, this.camDir);

            //console.log("square: ", this.camDir, dot);

            camera.getScreenPosition(this.s1, _1);
            camera.getScreenPosition(this.s2, _2);
            camera.getScreenPosition(this.s3, _3);
            camera.getScreenPosition(this.s4, _4);


            var ctx = this.canvas.getContext('2d');
            ctx.strokeStyle = "rgba(128,128,128,1)";
            if (dot > 0)
                //ctx.strokeStyle = "rgba(128,0,0,1)";
                return;


            this.points = [this.s1, this.s2, this.s3, this.s4]
            ctx.beginPath();
            ctx.moveTo(this.points[0][0], this.points[0][1]);
            for (var i = 0; i < this.points.length; i++) {
                ctx.lineTo(this.points[i][0], this.points[i][1]);
            }
            ctx.lineTo(this.points[0][0], this.points[0][1]);

            ctx.stroke();
            ctx.closePath();
        }

    }
}