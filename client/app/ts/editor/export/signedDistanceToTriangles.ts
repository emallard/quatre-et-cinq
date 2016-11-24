module qec {

    export class signedDistanceToTriangles
    {
        densities:Float32Array;
        icount = 100;
        jcount = 100;
        kcount = 100;        

        tmpVec1 = vec3.create();
        tmpVec2 = vec3.create();
        tmpVec3 = vec3.create();
        tmpVecBary = vec3.create();
        tmpVecCross = vec3.create();


        triangles:number[];
        colors:number[];
        normals:number[];

        compute(sds:sdFields[]):void
        {
            this.triangles = [];
            this.colors = [];
            this.normals = [];

            this.densities = new Float32Array(this.icount*this.jcount*this.kcount);
            //var diffuses = new Float32Array(3*100*100*50);

            var sdUni:sdUnion = new sdUnion();
            sds.forEach(x=>sdUni.array.push(x));

            var pos = vec3.create();
            var bounds = new Float32Array(6);
            var diffuse = vec3.create();

            var tmpMat = mat4.create();
            var min = vec3.create();
            var max = vec3.create();

            for (var s=0; s < sds.length; ++s)
            {
                var sd = sds[s];
                var bchs = sd.boundingCenterAndHalfSize;

                sd.getInverseTransform(tmpMat);
                mat4.invert(tmpMat, tmpMat);
                
                vec3.set(min, bchs[0] - bchs[4], bchs[1]-bchs[4],  bchs[2]-bchs[5]);
                vec3.set(max, bchs[0] + bchs[4], bchs[1]+bchs[4],  bchs[2]+bchs[5]);
                
                vec3.transformMat4(min, min, tmpMat);
                vec3.transformMat4(max, max, tmpMat);

                for (var b=0; b < 3; ++b)
                {
                    bounds[b] = Math.min(min[b], bounds[b]);
                    bounds[3+b] = Math.max(max[b], bounds[3+b]);
                }
            }

            console.log('export bounding box : ' + float32ArrayToString(bounds));
            
            for (var i=0; i < this.icount; ++i)
            {
                console.log(''+i+'/'+(this.icount-1));
                var ri = i/(this.icount-1);
                for (var j=0; j < this.jcount; ++j)
                {
                    var rj = j/(this.jcount-1);
                    for (var k=0; k < this.kcount; ++k)
                    {
                        var rk = k/(this.kcount-1);

                        pos[0] = (1-ri) * bounds[0] + ri * bounds[3];
                        pos[1] = (1-rj) * bounds[1] + rj * bounds[4];
                        pos[2] = (1-rk) * bounds[2] + rk * bounds[5];

                        var d = sdUni.getDist(pos, false, false);

                        var q = this.getq(i,j,k);
                        this.densities[q] = d;
                    }
                }
            }

            //console.log(densities[this.getq(5,5,5)] + '=' + d.toFixed(3));

            var mc = new marchingCubes();
            var nn = vec3.fromValues(1,0,0);

            var bsx = (bounds[3]-bounds[0]) / (this.icount-1);
            var bsy = (bounds[4]-bounds[1]) / (this.jcount-1);
            var bsz = (bounds[5]-bounds[2]) / (this.kcount-1);
            
            for (var i=0; i < this.icount-1; ++i)
            {
                console.log(''+i+'/'+(this.icount-1));
                for (var j=0; j < this.jcount-1; ++j)
                {
                    for (var k=0; k < this.kcount-1; ++k)
                    {
                        var q1 = this.getq(i,  j,  k); 
                        var q2 = this.getq(i+1,j,  k); 
                        var q3 = this.getq(i,  j+1,k);  
                        var q4 = this.getq(i+1,j+1,k); 
                        var q5 = this.getq(i,  j,  k+1); 
                        var q6 = this.getq(i+1,j,  k+1); 
                        var q7 = this.getq(i,  j+1,k+1);  
                        var q8 = this.getq(i+1,j+1,k+1); 
                        
                        mc.polygonize(
                            this.densities[q1], this.densities[q2], this.densities[q3], this.densities[q4],
                            this.densities[q5], this.densities[q6], this.densities[q7], this.densities[q8],
                            nn,nn,nn,nn,nn,nn,nn,nn,0);

                        for (var pi=0 ; pi < mc.posArrayLength ; )
                        {
                            vec3.set(this.tmpVec1, bsx*(i+mc.posArray[pi++]), bsy*(j+mc.posArray[pi++]), bsz*(k+mc.posArray[pi++]));
                            vec3.set(this.tmpVec2, bsx*(i+mc.posArray[pi++]), bsy*(j+mc.posArray[pi++]), bsz*(k+mc.posArray[pi++]));
                            vec3.set(this.tmpVec3, bsx*(i+mc.posArray[pi++]), bsy*(j+mc.posArray[pi++]), bsz*(k+mc.posArray[pi++]));

                            // get material at barycentre
                            vec3.add(this.tmpVecBary, this.tmpVec2, this.tmpVec3);
                            vec3.add(this.tmpVecBary, this.tmpVecBary, this.tmpVec1);
                            vec3.scale(this.tmpVecBary, this.tmpVecBary, 1/3);
                            this.tmpVecBary[0] += bounds[0];
                            this.tmpVecBary[1] += bounds[1];
                            this.tmpVecBary[2] += bounds[2];

                            var diffuse = sdUni.getMaterial(this.tmpVecBary).diffuse;
                            this.colors.push(diffuse[0], diffuse[1], diffuse[2]);

                            this.triangles.push(this.tmpVec1[0], this.tmpVec1[1], this.tmpVec1[2]);
                            this.triangles.push(this.tmpVec3[0], this.tmpVec3[1], this.tmpVec3[2]);
                            this.triangles.push(this.tmpVec2[0], this.tmpVec2[1], this.tmpVec2[2]);
                            
                            vec3.subtract(this.tmpVec3, this.tmpVec3, this.tmpVec1);
                            vec3.subtract(this.tmpVec2, this.tmpVec2, this.tmpVec1);
                            vec3.normalize(this.tmpVec3, this.tmpVec3);
                            vec3.normalize(this.tmpVec2, this.tmpVec2);
                            vec3.cross(this.tmpVecCross, this.tmpVec3, this.tmpVec2);
                            //vec3.normalize(this.tmpVecCross, this.tmpVecCross);
                            
                            this.normals.push(this.tmpVecCross[0],this.tmpVecCross[1],this.tmpVecCross[2]);   
                        }
                    }
                }
            }
        }


        private getq(i:number, j:number, k:number) : number
        {
            return i + j*this.icount + k*this.icount*this.jcount;
        }
    }
}