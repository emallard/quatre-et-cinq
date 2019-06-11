module qec {

    export class transformObjectView {

        editor: editor = inject(qec.editor);
        canvas: HTMLCanvasElement;

        points: Float32Array[] = [];
        pointIndex = -1;
        isDown: boolean;
        doUpdate = false;
        selectedIndex = -1;
        tmpObjectTransform = mat4.create();

        init(elt: HTMLElement) {

            this.canvas = document.createElement('canvas');
            this.canvas.style.border = 'solid 1px red';
            elt.appendChild(this.canvas);
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 102;
            console.log("this.canvas.height : " + this.canvas.height);

            /*
            this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(<MouseEvent>e));
            this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(<MouseEvent>e))
            this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(<MouseEvent>e))


            this.points = [[0, 0], [295, 0], [295, 295], [0, 295]];
            */
            this.draw();
        }

        setSelectedIndex(i: number) {
            this.selectedIndex = i;
            if (i < 0)
                return;

            var l = this.editor.workspace.editorObjects[i];
            this.draw();
        }

        updateEditor() {
            if (this.selectedIndex < 0)
                return;

            var l = this.editor.workspace.editorObjects[this.selectedIndex];
            var profileBounds = l.profileBounds;

            /*
            // convert points to real coordinates
            var profilePoints = [];
            for (var j = 0; j < this.points.length; ++j) {
                var px = this.points[j][0];
                var py = this.points[j][1];
                px -= this.offsetX;
                py -= this.offsetY;

                var drawWidth = this.canvas.width - 2 * this.offsetX;
                var drawHeight = this.canvas.height - 2 * this.offsetY;

                var x = (px / drawWidth) * (profileBounds[2] - profileBounds[0]) + profileBounds[0];
                var y = (py - drawHeight) / drawHeight * (profileBounds[3] - profileBounds[1]) + profileBounds[1];
                y *= -1;
                profilePoints.push([x, y]);
            }

            l.setProfilePoints(profilePoints);
            this.editor.renderer.updateFloatTextures(l.sd);
            this.editor.setRenderFlag();
            */
        }

        draw() {

            if (this.selectedIndex < 0)
                return;

            var l = this.editor.workspace.editorObjects[this.selectedIndex];
            var bounds = l.top.totalBounds;
            mat4.invert(this.tmpObjectTransform, l.inverseTransform);


            var camera = this.editor.getCamera();
            var screenPosition1 = vec3.fromValues(bounds[0], bounds[1], 0);
            var screenPosition2 = vec3.fromValues(bounds[0], bounds[3], 0);
            var screenPosition3 = vec3.fromValues(bounds[2], bounds[3], 0);
            var screenPosition4 = vec3.fromValues(bounds[2], bounds[1], 0);
            var center = vec3.fromValues(0.5 * (bounds[2] + bounds[0]), 0.5 * (bounds[3] + bounds[1]), 0.5 * (l.profileBounds[3] + l.profileBounds[1]));
            var centerUp = vec3.fromValues(center[0], center[1], l.profileBounds[3]);
            var centerDown = vec3.fromValues(center[0], center[1], l.profileBounds[1]);

            camera.getScreenPositionPreTransform(screenPosition1, screenPosition1, this.tmpObjectTransform);
            camera.getScreenPositionPreTransform(screenPosition2, screenPosition2, this.tmpObjectTransform);
            camera.getScreenPositionPreTransform(screenPosition3, screenPosition3, this.tmpObjectTransform);
            camera.getScreenPositionPreTransform(screenPosition4, screenPosition4, this.tmpObjectTransform);
            camera.getScreenPositionPreTransform(center, center, this.tmpObjectTransform);
            camera.getScreenPositionPreTransform(centerUp, centerUp, this.tmpObjectTransform);
            camera.getScreenPositionPreTransform(centerDown, centerDown, this.tmpObjectTransform);

            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            var rw = 10;

            ctx.strokeStyle = "rgba(0,255,0,1)";
            ctx.fillStyle = "rgba(0,255,0,1)";
            ctx.strokeRect(center[0] - 0.5 * rw, center[1] - 0.5 * rw, rw, rw);

            ctx.strokeStyle = "rgba(0,0,255,1)";
            ctx.fillStyle = "rgba(0,255,0,1)";
            ctx.strokeRect(centerUp[0] - 0.5 * rw, centerUp[1] - 0.5 * rw, rw, rw);

            ctx.strokeStyle = "rgba(0,0,255,1)";
            ctx.fillStyle = "rgba(0,255,0,1)";
            ctx.strokeRect(centerDown[0] - 0.5 * rw, centerDown[1] - 0.5 * rw, rw, rw);


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
            /*
            
                        // draw points        
                        for (var i = 0; i < this.points.length; i++) {
                            ctx.fillStyle = "rgba(0,255,0,1)";
                            if (this.pointIndex == i)
                                ctx.fillStyle = "rgba(255,0,0,1)";
            
                            ctx.beginPath();
                            ctx.arc(this.points[i][0], this.points[i][1], 5, 0, Math.PI * 2, false);
                            ctx.fill();
                            ctx.closePath();
                        }
                        */
        }

    }
}