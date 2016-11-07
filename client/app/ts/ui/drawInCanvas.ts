module qec
{
    // http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app

    export class drawInCanvas 
    {
        canvas:HTMLCanvasElement;
        context:CanvasRenderingContext2D;

        paint = false;
        clickX = new Array();
        clickY = new Array();
        clickDrag = new Array();

        color = 'black';

        setColor(color:string)
        {
            this.color = color;
            this.context.strokeStyle = this.color;
            this.context.fillStyle = this.color;
        }


        setElement(canvas:HTMLCanvasElement)
        {
            this.canvas = canvas;
            this.context = this.canvas.getContext('2d');
            
            this.context.strokeStyle = this.color;
            this.context.fillStyle = this.color;
            this.context.lineJoin = "round";
            this.context.lineWidth = 20;
            

            canvas.addEventListener('mousedown', (e) =>{
                var rect = canvas.getBoundingClientRect();
                var mouseX = e.clientX - rect.left - 0.5;
                var mouseY = e.clientY - rect.top;  
                //console.log(mouseX, mouseY);
                this.paint = true;
                this.addClick(mouseX, mouseY, false);
                this.redraw();
            });

            canvas.addEventListener('mousemove', (e) =>{
                var rect = canvas.getBoundingClientRect();
                var mouseX = e.clientX - rect.left;
                var mouseY = e.clientY - rect.top;  

                if(this.paint){
                    this.addClick(mouseX, mouseY, true);
                    this.redraw();
                }
            });

            canvas.addEventListener('mouseup', (e) =>{
                this.paint = false;
            });

            canvas.addEventListener('mouseleave', (e) =>{
                this.paint = false;
            });
        }

        addClick(x:number, y:number, dragging:boolean)
        {
            this.clickX.push(x);
            this.clickY.push(y);
            this.clickDrag.push(dragging);
        }

        redraw() {
            //this.context = this.canvas.getContext("2d");

            //console.log(this.clickX); 
            var context = this.context;
            //context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
            
                        
            for(var i=0; i < this.clickX.length; i++) {		
                context.beginPath();
                if(this.clickDrag[i] && i){
                    context.moveTo(this.clickX[i-1], this.clickY[i-1]);
                }
                else{
                    context.moveTo(this.clickX[i]-1, this.clickY[i]);
                }
                context.lineTo(this.clickX[i], this.clickY[i]);
                context.closePath();
                context.stroke();
            }

            this.clickX = [];
            this.clickY = [];
            this.clickDrag = [];
            
            if (this.afterRedraw != null)
                this.afterRedraw();
        }

        afterRedraw : () => void;
    }
    

}