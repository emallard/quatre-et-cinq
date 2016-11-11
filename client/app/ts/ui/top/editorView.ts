module qec
{

    export class editorView
    {
        editor:editor = inject(editor);
        //updateLoop:updateLoop = inject(updateLoop);
        controllerManager:controllerManager = inject(controllerManager);
        selectController:selectController = inject(selectController);
        heightController:heightController = inject(heightController);
        importView:importView = inject(importView);
        profileView:profileView = inject(profileView);

        afterInject()
        {
            this.editor.setRenderFlag();
            this.updateLoop();
        }

        onMouseMove(data:any, e:Event) { this.controllerManager.onMouseMove(e); }
        onMouseDown(data:any, e:Event) { this.controllerManager.onMouseDown(e); }
        onMouseUp(data:any, e:Event) { this.controllerManager.onMouseUp(e); }
        onMouseWheel(data:any, e:Event) { this.controllerManager.onMouseWheel(e); }

        setMoveController()
        {
            this.heightController.isScaleMode = false;
            this.controllerManager.setController(this.heightController);
        }

        setScaleController()
        {
            this.heightController.isScaleMode = true;
            this.controllerManager.setController(this.heightController);
        }

        setSelectedIndex(i: number)
        {
            this.editor.setSelectedIndex(i);
            this.profileView.setSelectedIndex(i);
        }

        private updateLoop()
        {
            this.controllerManager.updateLoop();
            this.editor.updateLoop();
            this.profileView.updateLoop()
            requestAnimationFrame(()=>this.updateLoop());
        }
    }
}