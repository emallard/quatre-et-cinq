module qec {
    export class lineDrawer
    {

        drawLine(pts:number[][], canv:HTMLCanvasElement){
            var ctx = canv.getContext('2d');
            //ctx.clearRect(0,0,canv.width,canv.height);
            if(pts.length == 0) {
                return;
            }

            ctx.beginPath();
            ctx.moveTo(pts[0][0],pts[0][1]);
            for(var i = 1;i < pts.length;i++)
            {
                ctx.lineTo(pts[i][0],pts[i][1]);
            }
            ctx.lineTo(pts[0][0],pts[0][1]);

            ctx.fill();
            ctx.closePath();
        }
    }
}