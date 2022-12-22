module qec {

    export interface irenderPixel
    {
        //init(sd:signedDistance, light:pointLight, shadows:boolean);
        updateShader(settings:renderSettings);
        render (ro:Float32Array, rd:Float32Array, debugInfo:boolean):Float32Array ;
    }

    export class renderPixel implements irenderPixel
    {
        debug = false;

        sd:signedDistance[];

        lights:ilight[];
        
        out = vec4.create();

        MAX_DIST_FROM_CAMERA = 10000;
        MAX_STEPS = 100;
        c_fSmooth = 0.70;
        EPS_NORMAL_1 = 0.5;
        EPS_NORMAL_2 = 0.5;
        EPS_INTERSECT = 0.05;

        shadows = false;
        SS_K = 15.0;
        SS_MAX_STEPS = 64;
        SS_EPS = 0.005;

        outPos = vec3.create();
        outNormal = vec3.create();
        pos2 = vec3.create();
        sdColor = vec3.create();
        
        toLight2 = vec3.create();
        minusRd = vec3.create();
        distEpsPos = vec3.create();
        outLighting = vec3.create();

        reflRd = vec3.create();
        reflRo = vec3.create();
        reflPos = vec3.create();
        reflCol = vec3.create();

        showBoundingBox = false;
        reflection = false;
        rayToBounds = false;//true;
        noColor=false;

        getDist: (pos:Float32Array) => number;
        getColor: (pos:Float32Array, out:Float32Array) => void;

        updateShader(settings:renderSettings)
        {
            this.getDist = new renderPixelGetDist().generateGetDist(settings.sdArray);
            this.getColor = new renderPixelGetDist().generateGetColor(settings.sdArray);
            this.lights = settings.lights;
            this.shadows = settings.shadows;
            this.noColor = settings.noColor;
        }

        render (ro:Float32Array, rd:Float32Array, debugInfo:boolean = false):Float32Array 
        {
            this.debug = debugInfo;
            return this.doRender(ro, rd);
        }

        private doRender (ro:Float32Array, rd:Float32Array):Float32Array 
        {
            if (this.debug) console.log('ro', ro, 'rd', rd);
            
            var hit = this.rayMarch(this.getDist, ro, rd, this.out, this.outPos, this.outNormal);
            
            if (hit && this.reflection)
            {
                this.reflect(this.reflRd, rd, this.outNormal);
                for (var i=0; i < 3; ++i)
                    this.reflRo[i] = this.outPos[i] + this.reflRd[i] * this.EPS_NORMAL_1;
                
                if (this.debug) 
                    console.log('reflect: reflRo', this.reflRo, 'reflRd', this.reflRd);
                
                hit = this.rayMarch(this.getDist, this.reflRo, this.reflRd, this.reflCol, this.outPos, this.outNormal);
                if (hit)
                {
                    if (this.debug) 
                        console.log('reflect color: ', this.reflCol);
                
                    var KR = 0.1;
                    this.out[0] = (1-KR)*this.out[0] + (KR * this.reflCol[0]);
                    this.out[1] = (1-KR)*this.out[1] + (KR * this.reflCol[1]);
                    this.out[2] = (1-KR)*this.out[2] + (KR * this.reflCol[2]);
                }
            }

            return this.out;
        }


        rayMarch (sd:(Float32Array)=>number, ro:Float32Array, rd:Float32Array, 
                  outColor:Float32Array, outPos:Float32Array, outNormal) :boolean
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

            var t = this.intersectDist(sd, ro, rd, 0, this.MAX_DIST_FROM_CAMERA);

            if (t>0.0) 
            {    
                
                vec4.set(outColor, 0,0,0,1);
                    
                outPos[0] = ro[0] + rd[0]*t;
                outPos[1] = ro[1] + rd[1]*t;
                outPos[2] = ro[2] + rd[2]*t;


                this.pos2[0] = outPos[0] - rd[0]*this.EPS_NORMAL_1;
                this.pos2[1] = outPos[1] - rd[1]*this.EPS_NORMAL_1;
                this.pos2[2] = outPos[2] - rd[2]*this.EPS_NORMAL_1;

                this.getNormal(sd, this.pos2, outNormal);

                //for (var j=0; j < 3; ++j)
                //    outColor[j] = outNormal[j];

                
                //this.sd.getMaterial(outPos).getColor(this.sdColor);
                //this.sdColor[0] = 1;
                //this.sdColor[1] = 1;
                //this.sdColor[2] = 1;
                if (this.noColor)
                {
                    vec3.set(this.sdColor, 1, 1, 1);
                }
                else
                {
                    this.getColor(outPos, this.sdColor);
                }
                

                var KA = 0.2;
                var KD = 0.7;
                var KS = 0.5;

                //for (var j=0; j < 3; ++j)
                //    outColor[j] = KA*this.sdColor[j];
                
                for (var i=0; i < this.lights.length; ++i)
                {
                    let light = this.lights[i];
                    if (light instanceof spotLight)
                    {
                        this.getSpotLighting(light, outPos, outNormal, rd, this.outLighting);
                        for (var j=0; j < 3; ++j)
                            outColor[j] += this.outLighting[2] * ( KS*this.outLighting[1] + KD*this.outLighting[0] * this.sdColor[j]);
                    }
                    else if (light instanceof directionalLight)
                    {
                        this.getDirectionalLighting(light, outPos, outNormal, rd, this.outLighting);
                        for (var j=0; j < 3; ++j)
                            outColor[j] += this.outLighting[2] * ( KS*this.outLighting[1] + KD*this.outLighting[0] * this.sdColor[j]);
                    }
                }
                
            }
            else
            {
                vec4.set(outColor, 0,0,0,1);
            }

            return t > 0.0;
        }


        intersectPos = vec3.create();

        intersectDist(sd:(Float32Array)=>number, ro:Float32Array, rd:Float32Array, tMin:number, tMax:number) : number
        {  
            var t = tMin;
            var dist = -1.0;
            
            for(var i=0; i < this.MAX_STEPS; ++i)
            {
                for (var j = 0; j < 3; ++j)
                    this.intersectPos[j] = ro[j] + rd[j]*t;

                var dt:number;
            
                /*
                if (this.rayToBounds)
                    dt = sd.getDist2(this.intersectPos, rd, this.showBoundingBox, this.debug);// * this.c_fSmooth;
                else
                    dt = sd.getDist(this.intersectPos, this.showBoundingBox, this.debug);// * this.c_fSmooth;
                */
               dt = sd(this.intersectPos);

                if(dt < this.EPS_INTERSECT) {
                    dist = t;
                    break;
                }
                
                t += dt;    
                
                if(t > tMax)
                    break;
            }
            
            return dist;
        }


        getNormal(sd:(Float32Array)=>number, pos:Float32Array, out:Float32Array) 
        {        
            out[0] = this.getNormalAt(sd, pos, 0);
            out[1] = this.getNormalAt(sd, pos, 1);
            out[2] = this.getNormalAt(sd, pos, 2);
            vec3.normalize(out, out);
        }

        
        getNormalAt(sd:(Float32Array)=>number, pos:Float32Array, index:number) : number
        {
            if (this.debug) console.log('Compute Normal');
            var eps = this.EPS_NORMAL_2;
            vec3.copy(this.distEpsPos, pos);
            this.distEpsPos[index] += eps;
            var a = sd(this.distEpsPos);//, this.showBoundingBox, this.debug);
            this.distEpsPos[index] -= 2*eps;
            var b = sd(this.distEpsPos);//, this.showBoundingBox, this.debug);
            return a - b;
        }

        diffToLight = vec3.create();
        getSpotLighting(light:spotLight, pos:Float32Array, normal:Float32Array, rd:Float32Array, out:Float32Array) : void
        {
            var intensity = light.intensity; 
            var lightPos = light.position;
            vec3.subtract(this.diffToLight, lightPos, pos);
            vec3.normalize(this.diffToLight, this.diffToLight);

            var lightDist = vec3.distance(lightPos,pos);

            out[0] = intensity * this.getDiffuse(pos, normal, this.diffToLight);
            out[1] = intensity * this.getSpecular(pos, normal, this.diffToLight, rd);
            out[2] = this.shadows ? this.getShadow(pos, this.diffToLight, lightDist) : 1;

            if (this.debug) 
                console.log('toLight:', this.diffToLight, 'normal', normal, 'diffuse', out[0], 'specular', out[1], 'shadow', out[2]);
        }

        getDirectionalLighting(light:directionalLight, pos:Float32Array, normal:Float32Array, rd:Float32Array, out:Float32Array) : void
        {
            var intensity = light.intensity; 
            vec3.scale(this.diffToLight, light.direction, -1);

            var lightDist = 10;

            out[0] = intensity * this.getDiffuse(pos, normal, this.diffToLight);
            out[1] = intensity * this.getSpecular(pos, normal, this.diffToLight, rd);
            out[2] = this.shadows ? this.getShadow(pos, this.diffToLight, lightDist) : 1;
            
            if (this.debug) 
                console.log('toLight:', this.diffToLight, 'normal', normal, 'diffuse', out[0], 'specular', out[1], 'shadow', out[2], this.shadows);
        }

        getDiffuse(pos:Float32Array, normal:Float32Array, toLight:Float32Array) : number
        {
            var diffuse = vec3.dot(toLight, normal);
            diffuse = Math.max(diffuse, 0);
            return diffuse;
        }

        getSpecular(pos:Float32Array, normal:Float32Array, toLight:Float32Array, rd:Float32Array) : number
        {
            vec3.scale(this.toLight2, toLight, -1);
            this.reflect(this.reflRd, this.toLight2, normal);
            vec3.scale(this.minusRd, rd, -1);
            var specAngle = Math.max(vec3.dot(this.reflRd, this.minusRd), 0.0);
            var specular = Math.pow(specAngle, 4.0);
            return specular;
        }


        ssTmp = vec3.create();
        getShadow (pos:Float32Array, toLight:Float32Array, lightDist:number) : number {

            return 0;
            /*
            var shadow = 1.0;
            var t = this.SS_EPS;
            var dt;

            for(var i=0; i < this.SS_MAX_STEPS; ++i)
            {
                vec3.scaleAndAdd(this.ssTmp, pos, toLight, t);   

                if (this.rayToBounds)
                    dt = this.sd.getDist2(this.ssTmp, toLight, this.showBoundingBox, this.debug);// * this.c_fSmooth;
                else
                    dt = this.sd.getDist(this.ssTmp, this.showBoundingBox, this.debug);// * c_fSmooth;


                if(dt < this.EPS_INTERSECT)    // stop if intersect object
                    return 0.0;
                
                //shadow = Math.min(shadow, this.SS_K*(dt/t));
                

                t += dt;
                
                if(t > lightDist)   // stop if reach light
                break;
            }
            
            return MathClamp(shadow, 0.0, 1.0);
            */
        }
        

        reflect(out:Float32Array, d:Float32Array, n:Float32Array)
        {
            var dot = vec3.dot(d, n);
            for (var i=0; i < 3; ++i)
               out[i] = d[i] - 2* dot * n[i];
        }
    }
}