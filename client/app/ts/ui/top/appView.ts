module qec{



    
    export class appView
    {

        vm = new appVm();
        renderView = new qec.renderView();
        importView = new qec.importView();
        profileView = new qec.profileView();
        materialView = new qec.materialView();

        selectController = new selectController();
        heightController = new heightController();
        cameraController = new cameraController();
        
        controllerManager = new controllerManager();
        index = 0;

        byId(id:string):HTMLElement
        {
            return <HTMLElement> document.getElementsByClassName(id)[0];
        }
        
        init()
        {
/*
            this.byId('btnSelect').addEventListener('click', e => 
            {
                //this.controllerManager.setController(this.selectController);
                this.controllerManager.setController(this.heightController);
            });

            this.byId('btnCamera').addEventListener('click', e => 
            {
               this.controllerManager.setController(this.cameraController);
            });

            this.byId('btnShadows').addEventListener('click', e => 
            {
               this.vm.toggleShadows();
            });
*/
            this.initToolbar();

            this.vm.init(<HTMLCanvasElement>$('.renderContainer')[0]);

            this.selectController.setView(this);
            this.controllerManager.setElement(<HTMLCanvasElement>$('.renderContainer')[0]);
            this.controllerManager.setVm(this.vm, this);

            this.controllerManager.setController(this.selectController);
            
            this.importView.setVm(this.vm, this);
            this.importView.setElement(null);//$('.importContainer')[0]);

            this.materialView.setVm(this.vm);
            this.materialView.setElement(this.byId('materialView'));


            this.profileView.setVm(this.vm);
            this.profileView.setElement(this.byId('profileView'));

            $( ".renderContainer canvas" ).contextmenu(function() {return false});

            // run update loop
            requestAnimationFrame(()=>this.updateLoop());
        }

        setSelectedIndex(i:number)
        {
            this.materialView.setSelectedIndex(i);
            this.profileView.setSelectedIndex(i);
        }

        updateLoop()
        {
            this.controllerManager.updateLoop();
            this.profileView.updateLoop();
            this.vm.updateLoop();
            requestAnimationFrame(()=>this.updateLoop());
        }


        initToolbar()
        {
            this.byId('btnToolImport').addEventListener('click', e => {this.setSelectedTool('importTool');});
            this.byId('btnToolModify').addEventListener('click', e => {this.setSelectedTool('modifyTool');});
            this.byId('btnToolEnvironment').addEventListener('click', e => {this.setSelectedTool('environmentTool');});
            this.byId('btnToolPhoto').addEventListener('click', e => {this.setSelectedTool('photoTool');});

            this.byId('btnPhoto').addEventListener('click', e => {
                saveAsImage(this.vm.renderer.getCanvas())
            });

            this.byId('btnShadows').addEventListener('click', e => {
                this.vm.toggleShadows();
            });

            this.byId('btnLight1').addEventListener('click', e => {
                //this.vm.toggleShadows();
            });

            this.byId('btnLight2').addEventListener('click', e => {
                //this.vm.toggleShadows();
            });

            this.byId('btnMoveVertically').addEventListener('click', e => {
                this.heightController.isScaleMode = false;
                this.controllerManager.setController(this.heightController);
            });

            this.byId('btnScaleVertically').addEventListener('click', e => {
                this.heightController.isScaleMode = true;
                this.controllerManager.setController(this.heightController);
            });

            this.byId('btnSoftwareRenderer').addEventListener('click', e => {
                this.vm.toggleSimpleRenderer();
            });

            this.byId('btnBoundingBox').addEventListener('click', e => {
                this.vm.toggleShowBoundingBox();
            });

            this.byId('btnGroundOrientation').addEventListener('click', e => {
                this.vm.toggleGroundOrientation();
            });

            this.setSelectedTool('importTool');
        }

        setSelectedTool(id:string)
        {
            $('.selectedTool > div').hide();
            $('.'+id).show();
        }
    }

}