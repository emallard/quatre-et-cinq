module qec {

    export class renderPixelStepCount implements irenderPixel
    {
        debug = false;

        sd:signedDistance;
        out = vec4.create();

        MAX_STEPS = 100;
        c_fSmooth = 0.70;
        EPS_NORMAL_1 = 0.01;
        EPS_NORMAL_2 = 0.01;
        EPS_INTERSECT = 0.001;

        SS_K = 15.0;
        SS_MAX_STEPS = 64;
        SS_EPS = 0.005;

        pos = vec3.create();
        normal = vec3.create();
        pos2 = vec3.create();
        toLight = vec3.create();
        distEpsPos = vec3.create();
        
        showBoundingBox = false; 
        rayToBounds = false;

        init(settings:renderSettings)
        {
            this.sd = settings.sd;
        }

        render (ro:Float32Array, rd:Float32Array, debugInfo:boolean = false):Float32Array 
        {
            this.debug = debugInfo;
            return this.doRender(ro, rd);
        }

        private doRender (ro:Float32Array, rd:Float32Array):Float32Array 
        {
            if (this.debug) console.log('ro', ro, 'rd', rd);
            this.rayMarch(this.sd, ro, rd, this.out);
            /*
            #ifdef FX_REFLECTION
            if (currHit) {
                vec3 reflRay = reflect(rd, currNor);
                col = col*(1.0-KR) + rayMarch(currPos+reflRay*EPS1, reflRay)*KR;
            }
            #endif
            */    
            //return col;
            return this.out;
        }


        stepCount = [0];
        rayMarch (sd:signedDistance, ro:Float32Array, rd:Float32Array, out:Float32Array) 
        {
            /*
            #ifdef CHECK_BOUNDS
            if (intersectBounds(ro, rd)) {
            #endif
                
                #ifdef RENDER_STEPS
                int steps = intersectSteps(ro, rd);  
                return vec3(float(MAX_STEPS-steps)/float(MAX_STEPS));
                #else
            */

            var t = this.intersectDist(sd, ro, rd, 0, 100, this.stepCount);

            if (t>0.0) 
            {   
                var r = this.stepCount[0]/this.MAX_STEPS;
                out[0] = r;
                out[1] = 0;
                out[2] = 0;
                out[3] = 1.0;
                /*    
                this.pos[0] = ro[0] + rd[0]*t;
                this.pos[1] = ro[1] + rd[1]*t;
                this.pos[2] = ro[2] + rd[2]*t;


                this.pos2[0] = this.pos[0] - rd[0]*this.EPS_NORMAL_1;
                this.pos2[1] = this.pos[1] - rd[1]*this.EPS_NORMAL_1;
                this.pos2[2] = this.pos[2] - rd[2]*this.EPS_NORMAL_1;

                this.getNormal(sd, this.pos2, this.normal);

                // diffuse lighting
                vec3.subtract(this.toLight, this.uLightPos, this.pos);
                vec3.normalize(this.toLight, this.toLight);
                var dot = vec3.dot(this.toLight, this.normal);

                dot = Math.max(dot, 0);
                

                
                var KA = 0.5;
                var KD = 0.5;
               
                this.sd.getMaterial(this.pos).getColor(this.pos, out);
                out[0] = KA*out[0] + KD*dot;
                out[1] = KA*out[1] + KD*dot;
                out[2] = KA*out[2] + KD*dot;

  */
  
                /*
                out[0] = Math.abs(this.normal[0]);
                out[1] = Math.abs(this.normal[1]);
                out[2] = Math.abs(this.normal[2]);
                */
            }
            else
            {
                out[0] = 1.0;
                out[1] = 1.0;
                out[2] = 1.0;
                out[3] = 1.0;
            }
        }


        intersectPos = vec3.create();
        intersectDist(sd:signedDistance, ro:Float32Array, rd:Float32Array, tMin:number, tMax:number, stepCount:number[]) : number
        {  
            var t = tMin;
            var dist = -1.0;
            
            var i=0;
            for(i=0; i < this.MAX_STEPS; ++i)
            {
                this.intersectPos[0] = ro[0] + rd[0]*t;
                this.intersectPos[1] = ro[1] + rd[1]*t;
                this.intersectPos[2] = ro[2] + rd[2]*t;

                var dt:number;
                if (this.rayToBounds)
                    dt = sd.getDist2(this.intersectPos, rd, this.showBoundingBox, this.debug);// * this.c_fSmooth;
                else
                    dt = sd.getDist(this.intersectPos, this.showBoundingBox, this.debug);// * this.c_fSmooth;

                if (this.debug) console.log('march #'+i + ' : ' + dt + ' : ' + vec3.str(this.intersectPos));

                if(dt < this.EPS_INTERSECT) {
                    dist = t;
                    break;
                }
                
                t += dt;    
                
                if(t > tMax)
                    break;
            }
            
            stepCount[0] = i;
            return dist;
        }


        getNormal(sd:signedDistance, pos:Float32Array, out:Float32Array) 
        {        
            out[0] = this.getNormalAt(sd, pos, 0);
            out[1] = this.getNormalAt(sd, pos, 1);
            out[2] = this.getNormalAt(sd, pos, 2);
            vec3.normalize(out, out);
        }

        
        getNormalAt(sd:signedDistance, pos:Float32Array, index:number) : number
        {
            if (this.debug) console.log('Compute Normal');
            var eps = this.EPS_NORMAL_2;
            vec3.copy(this.distEpsPos, pos);
            this.distEpsPos[index] += eps;
            var a = sd.getDist(this.distEpsPos, this.showBoundingBox, this.debug);
            this.distEpsPos[index] -= 2*eps;
            var b = sd.getDist(this.distEpsPos, this.showBoundingBox, this.debug);
            return a - b;
        }
    }
}