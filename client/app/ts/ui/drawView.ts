module qec {

    export class drawView {

        importView: importView = inject(importView);
        canvas: HTMLCanvasElement;
        isMouseDown = false;
        hasMoved = false;
        previousMouseXY = vec2.create();
        mouseXY = vec2.create();

        init(elt: HTMLElement) {
            console.log("drawView init");
            this.canvas = <HTMLCanvasElement>elt; //document.createElement('canvas');
            this.canvas.width = window.innerWidth - 2;
            this.canvas.height = window.innerHeight - 152;
            //elt.appendChild(this.canvas);
        }

        onMouseDown(data: any, e: MouseEvent) {
            console.log("onMouseDown");
            this.isMouseDown = true;
            this.hasMoved = true;
            this.previousMouseXY[0] = e.offsetX;
            this.previousMouseXY[1] = e.offsetY;
            this.mouseXY[0] = e.offsetX;
            this.mouseXY[1] = e.offsetY;
        }

        onMouseUp(data: any, e: MouseEvent) {
            this.isMouseDown = false;
        }

        onMouseMove(data: any, e: MouseEvent) {
            if (!this.isMouseDown)
                return;

            this.hasMoved = true;
            this.mouseXY[0] = e.offsetX;
            this.mouseXY[1] = e.offsetY;
        }

        updateLoop() {
            if (!this.isMouseDown || !this.hasMoved)
                return;
            this.hasMoved = false;
            var context = this.canvas.getContext('2d');
            context.beginPath();
            context.moveTo(this.previousMouseXY[0], this.previousMouseXY[1]);
            context.lineTo(this.mouseXY[0], this.mouseXY[1]);
            context.closePath();
            context.strokeStyle = "red";
            context.lineWidth = 30;
            context.stroke();

            context.ellipse(this.previousMouseXY[0], this.previousMouseXY[1], 30, 30, 0, 0, 360);
            context.fillStyle = "red";
            context.fill();

            vec2.copy(this.previousMouseXY, this.mouseXY);
        }

        okClick() {
            var widthAndHeight = 'width="' + this.canvas.width + '" height="' + this.canvas.height + '"';
            var viewbox = 'viewbox="0 0 ' + this.canvas.width + ' ' + this.canvas.height + '"';
            var dataUrl = this.canvas.toDataURL("image/png");

            var text = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
                + '<svg '
                + ' xmlns:svg="http://www.w3.org/2000/svg" '
                + ' xmlns="http://www.w3.org/2000/svg" '
                + ' xmlns:xlink="http://www.w3.org/1999/xlink" '
                + ' ' + widthAndHeight
                + ' ' + viewbox
                + '><g>\n'
                + '<image ' + widthAndHeight + ' id="drawing1" xlink:href="'
                + dataUrl
                + '"/>'
                + '\n</g></svg>';
            console.log(text);

            this.importView.readImageAsText(text);
            (<any>$('#modalDraw')).modal('hide');
        }

        cancelClick() {
            (<any>$('#modalDraw')).modal('hide');
        }
    }
}