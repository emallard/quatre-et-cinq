declare var JSZip;

module qec
{
    export class saveWorkspace
    {
        
        saveJson(editor:editor)
        {
            saveAs(JSON.stringify(editor.workspace.toDto()), "workspace.json");
        }

        saveJsonInLocalStorage(editor:editor)
        {
            var content = JSON.stringify(editor.workspace.toDto());
            console.log(content);
            localStorage.setItem("workspace.json", content);
        }

        saveZip(editor:editor)
        {
            var zip = new JSZip();
            zip.file("workspace.json", JSON.stringify(editor.workspace.toDto()));
            zip.generateAsync({type:"blob"})
            .then(function(content) {
                // see FileSaver.js
                saveAs(content, "example.zip");
            });
        }

        
    }
}
 