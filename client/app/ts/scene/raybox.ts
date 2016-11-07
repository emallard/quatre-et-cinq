
module qec {

    //https://tavianator.com/fast-branchless-raybounding-box-intersections/

    export class raybox {

        static intersection(b:Float32Array, ro:Float32Array, rd:Float32Array, debug:boolean) : number {

            var tmin = -10000;//-INFINITY;
            var tmax = 10000;//INFINITY;
        
            for (var i=0; i < 3 ; ++i)
                if (rd[i] != 0.0) {
                    var t1 = (-b[i] - ro[i])/rd[i];   /*-b[0] = b.min.x*/
                    var t2 = ( b[i] - ro[i])/rd[i];   /* b[0] = b.max.x*/
            
                    tmin = Math.max(tmin, Math.min(t1, t2));
                    tmax = Math.min(tmax, Math.max(t1, t2));
                    //if (debug) console.log('rayboxintersection '+i+' '+ tmin + ' ' + tmax);
                }
        
            if (debug)
                console.log('rayboxintersection ' + 'tmin=' + tmin + 'tmax=' + tmax, 'box', b, 'ro', ro, 'rd', rd); 
            
            if (tmax <= tmin)
                return 10000;
            return tmin;
        }

        static inbox(b:Float32Array, ro:Float32Array, m:number) : boolean
        {
            return ro[0] > -(b[0]+m) && ro[0] < (b[0]+m)
                && ro[1] > -(b[1]+m) && ro[1] < (b[1]+m)
                && ro[2] > -(b[2]+m) && ro[2] < (b[2]+m);
        }
    }
    
}