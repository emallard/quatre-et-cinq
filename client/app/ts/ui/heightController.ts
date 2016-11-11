module qec {


    export class heightController implements iController {

        editor:editor = inject(editor);
        editorView:editorView = inject(editorView);

        isMouseDown = false;
        updateFlag = false;
        startX = 0;
        startY = 0;
        mouseX:number;
        mouseY:number;
        
        startPos = vec3.create();
        mousePos = vec3.create();
        deltaPos = vec3.create();

        selected:editorObject;
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

        collide = new renderCollide(); 

        isScaleMode = false;


        set()
        {
            //console.log('heightController');
            this.updateFlag = false;
            this.isMouseDown = false;
        }

        unset()
        {

        }

        updateLoop()
        {
            if (this.isMouseDown && this.updateFlag)
            {
                this.updateFlag = false;

                this.editor.getCamera().getRay(this.mouseX, this.mouseY, this.ro, this.rd);

                // project mouse on up ray from startPos
                this.lineUp.setOriginAndDirection(this.startPos, this.dirUp);
                this.lineCam.setOriginAndDirection(this.ro, this.rd);
                this.distLines.setLines(this.lineUp, this.lineCam);
                this.distLines.getDistance();
                this.distLines.getClosestPoint0(this.mousePos);

                vec3.subtract(this.deltaPos, this.mousePos, this.startPos);

                if (!this.isScaleMode)
                {
                    mat4.translate(this.selected.sd.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(this.selected.sd.inverseTransform, this.selected.sd.inverseTransform);
                    
                    this.editor.renderer.updateTransform(this.selected.sd);
                    this.editor.setRenderFlag();
                }
                else
                { 
                    vec4.copy(this.newBounds, this.startBounds)
                    this.newBounds[3] += this.deltaPos[2];
                    this.selected.scaleProfilePoints(this.newBounds);
                    this.selected.updateSignedDistance();
                    this.editor.renderer.updateFloatTextures(this.selected.sd);
                    this.editor.setRenderFlag();
                }
            }
        }

        onMouseMove(e:MouseEvent)
        {
            
            if (this.isMouseDown)
            {
                this.mouseX =  (<MouseEvent> e).offsetX;
                this.mouseY =  (<MouseEvent> e).offsetY;
                this.updateFlag = true;
            }
        }

        onMouseDown(e:MouseEvent)
        {
            if (e.button != 0)
                return;

            this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
            this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);

            if (this.collide.hasCollided)
            {
                this.isMouseDown = true;
                
                // Initial state
                this.startX =  (<MouseEvent> e).offsetX;
                this.startY =  (<MouseEvent> e).offsetY;
                
                vec3.copy(this.startPos, this.collide.pos);
                this.selected = this.editor.editorObjects[this.collide.sdIndex];
                mat4.invert(this.startTransform, this.selected.sd.inverseTransform);

                vec4.copy(this.startBounds, this.selected.profileBounds); 

                this.editorView.setSelectedIndex(this.collide.sdIndex);
            }
        }

        onMouseUp(e:MouseEvent)
        {
            this.isMouseDown = false;
        }

        onMouseWheel(e:WheelEvent)
        {

        }
    }
}