declare var JSZip;

module qec
{
    export class saveWork
    {
        generateContent(editor:editor)
        {
            var svg = editor.originalSvgContent;
            var zip = new JSZip();
            zip.file("svg.svg", svg);
            
            // 3d
            editor.editorObjects.forEach(o => 
            {
                var data = {
                    // o.profilePoints;
                    // o.profileBounds;
                    // o.profileSmooth;
                    inverseTransform : o.sd.inverseTransform,
                    diffuseColor : o.diffuseColor,
                    // id in svg
                }
                JSON.stringify(data);
            });

            // camera and lights position

            zip.generateAsync({type:"blob"})
            .then(function(content) {
                // see FileSaver.js
                //saveAs(content, "example.zip");
            });
        }
    }
}
 