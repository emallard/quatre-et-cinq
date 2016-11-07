module qec {

    export class renderView {

        vm:appVm;
        isMouseDown = false;
        startX = 0;
        startY = 0;
        setCamera(vm:appVm)
        {
            this.vm = vm;
        }
    }
}