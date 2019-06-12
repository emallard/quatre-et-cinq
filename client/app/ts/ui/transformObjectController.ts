module qec {


    export class transformObjectController implements iController {

        editor: editor = inject(editor);
        editorView: editorView = inject(editorView);
        profileView: profileView = inject(profileView);
        transformObjectUtils: transformObjectUtils = inject(transformObjectUtils);
        transformObjectView: transformObjectView = inject(transformObjectView);
        collide = new renderCollide();

        isMouseDown = false;
        updateFlag = false;
        handlePicked = false;
        startX = 0;
        startY = 0;
        mouseX: number;
        mouseY: number;

        startPos = vec3.create();
        mousePos = vec3.create();
        deltaPos = vec3.create();

        startTransform = mat4.create();
        startHalfSizeProfile = vec2.create();

        startBounds = vec4.create();
        newBounds = vec4.create();

        ro = vec3.create();
        rd = vec3.create();

        dirUp = vec3.fromValues(0, 0, 1);
        lineUp = new wm5Line3();
        lineCam = new wm5Line3();
        distLines = new wm5DistLine3Line3();

        tmpVec3 = vec3.create();

        isScaleMode = false;
        isScaleModeBottom = false;

        set() {
            //console.log('heightController');
            this.updateFlag = false;
            this.isMouseDown = false;
            this.handlePicked = false;
        }

        unset() {

        }

        updateLoop() {
            if (this.isMouseDown && this.updateFlag && this.handlePicked) {
                this.updateFlag = false;

                var selected = this.editor.workspace.selectedObject();

                this.editor.getCamera().getRay(this.mouseX, this.mouseY, this.ro, this.rd);

                // project mouse on up ray from startPos
                this.lineUp.setOriginAndDirection(this.startPos, this.dirUp);
                this.lineCam.setOriginAndDirection(this.ro, this.rd);
                this.distLines.setLines(this.lineUp, this.lineCam);
                this.distLines.getDistance();
                this.distLines.getClosestPoint0(this.mousePos);

                vec3.subtract(this.deltaPos, this.mousePos, this.startPos);

                if (!this.isScaleMode) {
                    /*
                    console.log("Translate mode !");
                    console.log("startPos", this.startPos);
                    console.log("mousePos", this.mousePos);
                    */
                    mat4.translate(selected.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(selected.inverseTransform, selected.inverseTransform);
                    selected.updateInverseTransform();
                    this.editor.renderer.updateTransform(selected.sd);
                    this.editor.setRenderFlag();

                }
                else if (!this.isScaleModeBottom) {
                    vec4.copy(this.newBounds, this.startBounds)
                    this.newBounds[3] += this.deltaPos[2];
                    selected.scaleProfilePoints(this.newBounds);
                    this.editor.updateSignedDistance(selected);
                    this.editor.renderer.updateFloatTextures(selected.sd);
                    this.editor.setRenderFlag();
                }
                else {
                    mat4.translate(selected.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(selected.inverseTransform, selected.inverseTransform);
                    selected.updateInverseTransform();
                    this.editor.renderer.updateTransform(selected.sd);

                    vec4.copy(this.newBounds, this.startBounds)
                    this.newBounds[3] += (-this.deltaPos[2]);
                    selected.scaleProfilePoints(this.newBounds);
                    this.editor.updateSignedDistance(selected);
                    this.editor.renderer.updateFloatTextures(selected.sd);

                    this.editor.setRenderFlag();
                }

                /*
                if (this.isScaleMode) {
                    this.profileView.refresh();
                }*/
            }
        }

        onMouseMove(e: MouseEvent) {

            if (this.isMouseDown) {
                this.mouseX = (<MouseEvent>e).offsetX;
                this.mouseY = (<MouseEvent>e).offsetY;
                this.updateFlag = true;
            }
        }

        onMouseDown(e: MouseEvent) {

            this.isMouseDown = false;
            if (e.button != 0)
                return;

            this.handlePicked = false;
            var l = this.editor.workspace.selectedObject();
            if (l != null) {

                this.transformObjectUtils.getMoveHandleScreenCoordinates(this.tmpVec3, l);
                //console.log("handleTest ", this.tmpVec3[0], this.tmpVec3[1], e.offsetX, e.offsetY);

                if (Math.max(Math.abs(this.tmpVec3[0] - e.offsetX), Math.abs(this.tmpVec3[1] - e.offsetY)) < 5) {
                    //console.log("in !");
                    this.handlePicked = true;
                    //this.transformObjectView.highlightCenter(true);

                    this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
                    this.isMouseDown = true;
                    this.isScaleMode = false;

                    // Initial state
                    this.startX = (<MouseEvent>e).offsetX;
                    this.startY = (<MouseEvent>e).offsetY;

                    l.getAbsoluteCenter(this.startPos);
                    mat4.invert(this.startTransform, l.inverseTransform);
                }
            }

            if (!this.handlePicked) {
                var picked = this.pick(e);
                this.editorView.setSelectedIndex(picked);

            }
        }

        onMouseUp(e: MouseEvent) {
            this.isMouseDown = false;
        }

        onMouseWheel(e: WheelEvent) {

        }

        onTouchStart(e: TouchEvent) {

        }

        onTouchMove(e: TouchEvent) {

        }

        onTouchEnd(e: TouchEvent) {

        }

        pick(e: MouseEvent): number {
            var minDist = 666;
            var iMin = -1;

            this.isMouseDown = false;
            this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);

            for (var i = 0; i < this.editor.workspace.editorObjects.length; ++i) {
                this.collide.collide(this.editor.workspace.editorObjects[i].sd, this.ro, this.rd);
                //console.log(this.collide.pos);
                //console.log(this.collide.minDist);
                if (this.collide.hasCollided && this.collide.dist < minDist) {
                    minDist = this.collide.dist;
                    iMin = i;
                }
            }

            return iMin;
        }
    }
}