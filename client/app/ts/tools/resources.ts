module qec {

    export class resources {

        static all:any[] = [];
        static loaded=false;

        static loadAll(done:()=>void)
        {
            var run = new runAll();
            run.push((_done) => resources.doReq('app/sd.glsl', _done));
            run.push((_done) => resources.doReq('app/renderPixel.glsl', _done));
            run.run(() => {resources.loaded = true; done();});
        }

        static doReq(url:string, done:()=>void)
        {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.onreadystatechange = function (aEvt) {
                if (req.readyState == 4) {
                    if(req.status == 200)
                    {
                        resources.all[url] = req.responseText;
                        done();
                    }
                    else
                    {
                        console.error("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            req.send(null);
        }
    }
}