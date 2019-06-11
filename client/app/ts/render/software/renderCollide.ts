module qec {

    export class renderCollide
    {
        debug = false;

        pos = vec3.create();
        MAX_STEPS = 64;
        EPS_INTERSECT = 0.001;

        hasCollided = false;
        dist = 0;
        sdIndex:number;

        collide(sd:signedDistance, ro:Float32Array, rd:Float32Array) 
        {
            this.sdIndex = 0;
            this.intersectDist(sd, ro, rd, 0, 100);
        }

        private posAll = vec3.create();
        collideAll(sdArray: signedDistance[], ro:Float32Array, rd:Float32Array)
        {
            var minDistAll = 66666;
            var hasCollidedAll = false;
            var sdIndexAll = 0;
            
            for (var i=0; i < sdArray.length; ++i)
            {
                this.collide(sdArray[i], ro, rd);
                
                if (this.hasCollided && this.dist < minDistAll)
                {
                    //console.log('hasCollided : ' + i);
                    hasCollidedAll = true;
                    sdIndexAll = i;
                    minDistAll = this.dist;
                    vec3.copy(this.posAll, this.pos);
                }
            }

            this.hasCollided = hasCollidedAll;
            this.dist = minDistAll;
            vec3.copy(this.pos, this.posAll);
            this.sdIndex = sdIndexAll;
        }

        private intersectDist(sd:signedDistance, ro:Float32Array, rd:Float32Array, tMin:number, tMax:number) : void
        {  
            var t = tMin;
            this.dist = -1.0;
            this.hasCollided = false;

            for(var i=0; i<this.MAX_STEPS; ++i)
            {
                this.pos[0] = ro[0] + rd[0]*t;
                this.pos[1] = ro[1] + rd[1]*t;
                this.pos[2] = ro[2] + rd[2]*t;

                var dt = sd.getDist(this.pos, false, this.debug);// * this.c_fSmooth;
                //this.minDist = Math.min(this.minDist, dt);
                
                if (this.debug) console.log('march #'+i + ' : ' + dt + ' : ' + vec3.str(this.pos));

                if(dt < this.EPS_INTERSECT) {
                    this.dist = t;
                    this.hasCollided = true;
                    break;
                }
                
                t += dt;    
                
                if(t > tMax)
                    break;
            }
        }
    }
}