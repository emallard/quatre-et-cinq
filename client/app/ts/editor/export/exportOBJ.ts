declare var zip;
module qec
{

    export class exportOBJ
    {
        objFile:string;
        mtlFile:string;

        getText(triangles:number[], normals:number[], colors:number[]):string
        {
            var d = 5;
            var obj = '';
            var materials:any = {}
            var numMaterials = 0;
            for (var i=0; i < triangles.length/9; ++i)
            {
                var color = colors[3*i+0] + ' ' + colors[3*i+1] + ' ' + colors[3*i+2];
                if (materials[color] == undefined)
                {
                    materials[color] = {
                        name : "mat" + numMaterials,
                        diffuse : color,
                        faces : ""
                    }
                    numMaterials++;
                }    

                obj += "v " + triangles[9*i+0].toFixed(d) + ' ' + triangles[9*i+1].toFixed(d) + ' ' + triangles[9*i+2].toFixed(d) + '\n';   
                obj += "v " + triangles[9*i+3].toFixed(d) + ' ' + triangles[9*i+4].toFixed(d) + ' ' + triangles[9*i+5].toFixed(d) + '\n';
                obj += "v " + triangles[9*i+6].toFixed(d) + ' ' + triangles[9*i+7].toFixed(d) + ' ' + triangles[9*i+8].toFixed(d) + '\n';   
            
                materials[color].faces += 'f ' + (3*i+1) + ' ' + (3*i+2) + ' ' + (3*i+3) + '\n'; 
            }

            var mtl = '';
            var faces = '';
            for (var key in materials)
            {
                var mat = materials[key];
                mtl += 'newmtl ' + mat.name +'\n    Ka ' + mat.diffuse + '\n    Kd ' + mat.diffuse + '\n';
                faces += 'g g' + mat.name + '\nusemtl '+ mat.name + '\n';
                faces += mat.faces + '\n';
            }

            this.mtlFile = mtl;
            this.objFile = 'mtllib a.mtl\n' + obj + faces;

            return this.objFile;
        }

        getZip(triangles:number[], normals:number[], colors:number[], done:(any)=>void)
        {
            this.getText(triangles, normals, colors);

            // http://gildas-lormeau.github.io/zip.js/core-api.html
            // use a zip.BlobWriter object to write zipped data into a Blob object
            zip.createWriter(new zip.BlobWriter("application/zip"), (zipWriter) => {
                // use a BlobReader object to read the data stored into blob variable
                zipWriter.add("a.obj", new zip.TextReader(this.objFile), () => {
                    zipWriter.add("a.mtl", new zip.TextReader(this.mtlFile), () => {
                        console.log('a.mtl');
                        zipWriter.close(done);
                    });
                });
            }, (msg) =>  console.error(msg));
            
        }

        getText_colorPerVertex(triangles:number[], normals:number[], colors:number[]):string
        {
            var obj = '';
            var faces = '';
            for (var i=0; i < triangles.length/9; ++i)
            {
                obj += "v " + triangles[9*i+0] + ' ' + triangles[9*i+1] + ' ' + triangles[9*i+2] 
                            + ' ' + colors[3*i+0] + ' ' + colors[3*i+1] + ' ' + colors[3*i+2] + '\n';   
                
                obj += "v " + triangles[9*i+3] + ' ' + triangles[9*i+4] + ' ' + triangles[9*i+5] 
                            + ' ' + colors[3*i+0] + ' ' + colors[3*i+1] + ' ' + colors[3*i+2] + '\n';   
            
                obj += "v " + triangles[9*i+6] + ' ' + triangles[9*i+7] + ' ' + triangles[9*i+8] 
                            + ' ' + colors[3*i+0] + ' ' + colors[3*i+1] + ' ' + colors[3*i+2] + '\n';   
            
                faces += 'f ' + (3*i+1) + ' ' + (3*i+2) + ' ' + (3*i+3) + '\n'; 
            }
            
            return obj + faces;
        }
    }   
}