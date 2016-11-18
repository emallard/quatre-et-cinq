module qec
{
    // https://gist.githubusercontent.com/paulkaplan/6d5f0ab2c7e8fdc68a61/raw/6bde174e27ae21905d871af3ef9fa3143919079f/binary_stl_writer.js

    export class exportOBJ
    {
        getText(triangles:number[], normals:number[], colors:number[]):string
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