module qec {

    var strDownloadMime = "image/octet-stream";

    export function saveAsImage(elt:HTMLCanvasElement) {
        var imgData, imgNode;

        try {
            var strMime = "image/jpeg";
            imgData = elt.toDataURL(strMime);
            saveFile(imgData.replace(strMime, strDownloadMime), "photo.jpg");

        } catch (e) {
            console.log(e);
            return;
        }

    }

    function saveFile(strData:string, filename:string) {
        var link:any = document.createElement('a');
        if (typeof link.download === 'string') {
            document.body.appendChild(link); //Firefox requires the link to be in the body
            link.download = filename;
            link.href = strData;
            link.click();
            document.body.removeChild(link); //remove the link when done
        } 
        /*else {
            location.replace(uri);
        }*/
    }
}