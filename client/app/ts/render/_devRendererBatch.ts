module qec {

    export class devRendererBatch {

        static loadUrl(url: string, elt: HTMLElement) {

            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.onreadystatechange = () => {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        let downloadedJson = JSON.parse(req.responseText);
                        console.log(downloadedJson);
                        for (let a of downloadedJson.array) {
                            var r = new qec.devRenderer();
                            r.start(elt, a);
                        }
                    }
                    else {
                        console.error("Erreur pendant le chargement du json.\n");
                    }
                }
            };
            req.send(null);
        }
    }
}