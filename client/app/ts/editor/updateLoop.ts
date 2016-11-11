module qec 
{
    export class updateLoop
    {

        controllerManager:controllerManager = inject(qec.controllerManager);
        editor:editor = inject(qec.editor);

        afterInject()
        {
            this.loop();
        }

        private loop()
        {
            this.controllerManager.updateLoop();
            this.editor.updateLoop();
            requestAnimationFrame(()=>this.loop());
        }   
    }
}