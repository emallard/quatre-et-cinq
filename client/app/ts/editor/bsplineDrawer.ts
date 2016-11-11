module qec {
    export class bsplineDrawer
    {

        drawSpline(pts:number[][], canv:HTMLCanvasElement){
            var ctx = canv.getContext('2d');
            //ctx.clearRect(0,0,canv.width,canv.height);
            if(pts.length == 0) {
                return;
            }
            
            var spline = new bspline();
            spline.setPoints(pts,3,true);
            ctx.beginPath();
            var oldx,oldy,x,y;
            oldx = spline.calcAt(0)[0];
            oldy = spline.calcAt(0)[1];
            ctx.moveTo(oldx,oldy);
            for(var t = 0;t <= 1;t+=0.001){
                
                var interpol = spline.calcAt(t);
                x = interpol[0];
                y = interpol[1];
                ctx.lineTo(x,y);
                oldx = x;
                oldy = y;
            }

            oldx = spline.calcAt(0)[0];
            oldy = spline.calcAt(0)[1];
            ctx.lineTo(oldx, oldy);

            ctx.fill();
            ctx.closePath();
        }
/*
        drawProfile(profilePoints:number[][], profileBounds:Float32Array, canv:HTMLCanvasElement){
            var ctx = canv.getContext('2d');
            //ctx.clearRect(0,0,canv.width,canv.height);
            if(profilePoints.length == 0) {
                return;
            }
            
            var spline = new bspline();
            spline.setPoints(profilePoints,3,true);
            ctx.beginPath();
            
            var x = spline.calcAt(0)[0];
            var y = spline.calcAt(0)[1];

            var px = (x - profileBounds[0]) /  (profileBounds[2] - profileBounds[0]) * canv.width;
            var py = (y - profileBounds[1]) /  (profileBounds[3] - profileBounds[1]) * canv.height;
            
            ctx.moveTo(px,py);
            
            var firstpx = px;
            var firstpy = py;
            for(var t = 0;t <= 1;t+=0.001){
                
                var interpol = spline.calcAt(t);
                x = interpol[0];
                y = interpol[1];
                

                px = (x - profileBounds[0]) /  (profileBounds[2] - profileBounds[0]) * canv.width;
                py = (y - profileBounds[1]) /  (profileBounds[3] - profileBounds[1]) * canv.height;
                
                ctx.lineTo(px,py);
            }

            ctx.lineTo(firstpx, firstpy);

            ctx.fill();
            ctx.closePath();
        }
    */
    }
}