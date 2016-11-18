module qec
{
    // https://gist.githubusercontent.com/paulkaplan/6d5f0ab2c7e8fdc68a61/raw/6bde174e27ae21905d871af3ef9fa3143919079f/binary_stl_writer.js

    export class exportSTL
    {
        getText(triangles:number[], normals:number[]):string
        {
            var stl = "solid blablabla\n";
            
            for (var i=0; i < triangles.length/9; ++i)
            {
                stl += 'facet normal 0 0 0\n';// + normals[3*i+0] + ' ' + normals[3*i+1] + ' ' + normals[3*i+2] + '\n';
                stl += 'outer loop \n';
                stl += "vertex " + triangles[9*i+0] + ' ' + triangles[9*i+1] + ' ' + triangles[9*i+2] + '\n';
                stl += "vertex " + triangles[9*i+3] + ' ' + triangles[9*i+4] + ' ' + triangles[9*i+5] + '\n';
                stl += "vertex " + triangles[9*i+6] + ' ' + triangles[9*i+7] + ' ' + triangles[9*i+8] + '\n';
                stl += 'endloop \n';
                stl += 'endfacet \n';   
            }
            stl += "endsolid blablabla\n";
            
            return stl;
        }

        getBinary(triangles:number[], normals:number[]):DataView
        {
            // http://buildaweso.me/project/2014/10/26/writing-binary-stl-files-from-threejs-objects

            var isLittleEndian = true; // STL files assume little endian, see wikipedia page
    
            var bufferSize = 84 + (50 * (triangles.length/9));
            console.log('buffer size : ' + bufferSize);
            var buffer = new ArrayBuffer(bufferSize);
            var dv = new DataView(buffer);
            var offset = 0;

            offset += 80; // Header is empty

            dv.setUint32(offset, triangles.length/9, isLittleEndian);
            offset += 4;

            for(var n = 0; n < triangles.length/9; n++) {
                for (var ni=0; ni < 3; ++ni)
                    offset = this.writeFloat(dv, offset, normals[3*n+ni], isLittleEndian);
                for (var nj=0; nj < 9; ++nj)
                    offset = this.writeFloat(dv, offset, triangles[9*n+nj], isLittleEndian);
                
                var r = 31;
                var g = 0;
                var b = 0;
                if (n < 1000) {
                    r = 0; 
                    g = 31;
                }
                var packedColor = 1 + r*2 + g*Math.pow(2, 6) + b * Math.pow(2, 11); 
                if (n < 1000)
                    dv.setUint16(offset, 64512, isLittleEndian)
                else
                    dv.setUint16(offset, 64512, false);
                offset += 2; // unused 'attribute byte count' is a Uint16
            }

            return dv;

        }

        writeVector(dataview, offset, vector, isLittleEndian) {
            offset = this.writeFloat(dataview, offset, vector.x, isLittleEndian);
            offset = this.writeFloat(dataview, offset, vector.y, isLittleEndian);
            return this.writeFloat(dataview, offset, vector.z, isLittleEndian);
        };

        writeFloat(dataview, offset, float, isLittleEndian) {
            dataview.setFloat32(offset, float, isLittleEndian);
            return offset + 4;
        };
    }

/*

    export class exportSTL_old
    {
        densities:Float32Array;
        icount = 70;
        jcount = 70;
        kcount = 70;        

        tmpVec1 = vec3.create();
        tmpVec2 = vec3.create();
        tmpVec3 = vec3.create();
        tmpVecBary = vec3.create();
        tmpVecCross = vec3.create();

        compute(sds:sdFields[]):string
        {
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
            //return "";
            
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
                        //sd.getMaterial(pos).getColor(diffuse);

                        var q = this.getq(i,j,k);
                        this.densities[q] = d;
                    }
                }
            }

            //console.log(densities[this.getq(5,5,5)] + '=' + d.toFixed(3));

            var stl = "solid blablabla\n";
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

                            // http://buildaweso.me/project/2014/10/26/writing-binary-stl-files-from-threejs-objects
                            // https://en.wikipedia.org/wiki/STL_(file_format)

                            // get material at barycentre
                            //vec3.add(this.tmpVecBary, this.tmpVec2, this.tmpVec3);
                            //vec3.add(this.tmpVecBary, this.tmpVecBary, this.tmpVec1);
                            //vec3.scale(this.tmpVecBary, this.tmpVecBary, 1/3);
                            //var diffuse = sd.getMaterial(this.tmpVecBary).diffuse;

                            var vertices = '';
                            vertices += "vertex " + this.tmpVec1[0] + ' ' + this.tmpVec1[1] + ' ' + this.tmpVec1[2] + '\n';
                            vertices += "vertex " + this.tmpVec2[0] + ' ' + this.tmpVec2[1] + ' ' + this.tmpVec2[2] + '\n';
                            vertices += "vertex " + this.tmpVec3[0] + ' ' + this.tmpVec3[1] + ' ' + this.tmpVec3[2] + '\n';

                            vec3.subtract(this.tmpVec3, this.tmpVec3, this.tmpVec1);
                            vec3.subtract(this.tmpVec2, this.tmpVec2, this.tmpVec1);
                            vec3.cross(this.tmpVecCross, this.tmpVec2, this.tmpVec3);
                            vec3.normalize(this.tmpVecCross, this.tmpVecCross);
                            stl += 'facet normal ' + this.tmpVecCross[0] + ' ' + this.tmpVecCross[1] + ' ' +this.tmpVecCross[2] + '\n';
                            stl += 'outer loop \n';
                            stl += vertices;

                            stl += 'endloop \n';
                            stl += 'endfacet \n';   
                        }
                    }
                }
            }
            stl += "endsolid blablabla";
            return stl;
        }


        getq(i:number, j:number, k:number)
        {
            return i + j*this.icount + k*this.icount*this.jcount;
        }
    }
*/
    
}