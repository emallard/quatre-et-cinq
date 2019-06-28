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
            this.updateFlag = false;
            this.isMouseDown = false;
            this.handlePicked = false;
        }

        unset() {

        }

        updateLoop() {
            if (this.isMouseDown && this.updateFlag && this.handlePicked) {
                this.updateFlag = false;

                var selected = this.editor.workspace.getSelectedObject();

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
                    this.transformObjectView.draw();

                }
                else if (!this.isScaleModeBottom) {
                    vec4.copy(this.newBounds, this.startBounds)
                    this.newBounds[3] += this.deltaPos[2];
                    /*
                    console.log("Translate mode !");
                    console.log("newBounds", this.newBounds);
                    */
                    selected.scaleProfilePoints(this.newBounds);
                    this.editor.renderer.updateFloatTextures(selected.sd);
                    this.editor.setRenderFlag();
                    this.editor.setUpdateFlag();
                    this.transformObjectView.draw();
                }
            }
        }



        start(x: number, y: number, dx: number, dy: number) {
            //console.log("start " + x + "," + y);
            var detectionDistance = 20;

            this.handlePicked = false;
            var l = this.editor.workspace.getSelectedObject();
            if (l != null) {

                this.transformObjectUtils.getMoveHandleScreenCoordinates(this.tmpVec3, l);
                if (Math.max(Math.abs(this.tmpVec3[0] - (x - dx)), Math.abs(this.tmpVec3[1] - (y - dy))) < detectionDistance) {
                    //console.log("in !");
                    this.handlePicked = true;
                    //this.transformObjectView.highlightCenter(true);

                    this.editor.getCamera().getRay(x, y, this.ro, this.rd);
                    this.isMouseDown = true;
                    this.isScaleMode = false;

                    // Initial state
                    this.startX = x;
                    this.startY = y;

                    l.getAbsoluteBottomCenter(this.startPos);
                    mat4.invert(this.startTransform, l.inverseTransform);
                }

                this.transformObjectUtils.getScaleTopHandleScreenCoordinates(this.tmpVec3, l);

                if (Math.max(Math.abs(this.tmpVec3[0] - (x - dx)), Math.abs(this.tmpVec3[1] - (y - dy))) < detectionDistance) {
                    this.handlePicked = true;

                    this.editor.getCamera().getRay(x, y, this.ro, this.rd);
                    this.isMouseDown = true;
                    this.isScaleMode = true;
                    this.isScaleModeBottom = false;

                    // Initial state
                    this.startX = x;
                    this.startY = y;

                    vec4.copy(this.startBounds, l.profileBounds);

                    l.getAbsoluteTopCenter(this.startPos);
                    mat4.invert(this.startTransform, l.inverseTransform);
                }
                /*
                this.transformObjectUtils.getScaleBottomHandleScreenCoordinates(this.tmpVec3, l);
 
                if (Math.max(Math.abs(this.tmpVec3[0] - e.offsetX), Math.abs(this.tmpVec3[1] - e.offsetY)) < 5) {
                    this.handlePicked = true;
 
                    this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
                    this.isMouseDown = true;
                    this.isScaleMode = true;
                    this.isScaleModeBottom = true;
 
                    // Initial state
                    this.startX = (<MouseEvent>e).offsetX;
                    this.startY = (<MouseEvent>e).offsetY;
 
                    l.getAbsoluteBottomCenter(this.startPos);
                    mat4.invert(this.startTransform, l.inverseTransform);
                }
                */
            }
            if (!this.handlePicked) {
                //var picked = this.pick(e.offsetX, e.offsetY);
                //this.editorView.setSelectedIndex(picked);

            }
        }

        onMouseDown(e: MouseEvent) {
            //console.log("mousedown");
            //this.start(e.offsetX, e.offsetY, 0, 0);
        }
        onMouseMove(e: MouseEvent) { }
        onMouseUp(e: MouseEvent) { }
        /*
        onMouseDown(e: MouseEvent) {

            this.isMouseDown = false;
            if (e.button != 0)
                return;

            this.start(e.offsetX, e.offsetY);
        }
        onMouseMove(e: MouseEvent) {

            if (this.isMouseDown) {
                this.mouseX = (<MouseEvent>e).offsetX;
                this.mouseY = (<MouseEvent>e).offsetY;
                this.updateFlag = true;
            }
        }
        onMouseUp(e: MouseEvent) {
            this.isMouseDown = false;
        }*/

        onMouseWheel(e: WheelEvent) { }
        onTouchStart(e: TouchEvent) { }
        onTouchMove(e: TouchEvent) { }
        onTouchEnd(e: TouchEvent) { }
        onPanStart(e: HammerInput) {
            this.start(e.center.x, e.center.y, e.deltaX, e.deltaY);
        }
        onPanMove(e: HammerInput) {
            if (this.isMouseDown) {
                this.mouseX = e.center.x;
                this.mouseY = e.center.y;
                this.updateFlag = true;
            }
        }
        onPanEnd(e: HammerInput) {
            this.isMouseDown = false;
        }
        onPan2Start(e: HammerInput) { }
        onPan2Move(e: HammerInput) { }
        onPan2End(e: HammerInput) { }
        onTap(e: HammerInput) {
            var picked = this.pick(e.center.x, e.center.y);
            this.editorView.setSelectedIndex(picked);
        }

        pick(x: number, y: number): number {
            var minDist = 666;
            var iMin = -1;

            this.isMouseDown = false;
            this.editor.getCamera().getRay(x, y, this.ro, this.rd);

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