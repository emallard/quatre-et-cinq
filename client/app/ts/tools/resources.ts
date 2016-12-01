module qec {

    export class resources {

        static all:any[] = [];
        static loaded=false;

        static loadAll(done:()=>void)
        {
            var run = new runAll();
            run.push((_done) => resources.doReq('app/ts/render/hardware/10_sd.glsl', _done));
            run.push((_done) => resources.doReq('app/ts/render/hardware/20_light.glsl', _done));
            run.push((_done) => resources.doReq('app/ts/render/hardware/30_renderPixel.glsl', _done));
            
            //for (var i=0; i < 6; ++i)
            //    run.push(resources.loadImg('data/cubemap/cubemap' + i + '.jpg'));
            
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

        static loadImg(url:string)
        {
            return (_done) =>
            {
                console.log(url);
                var img = new Image();
                img.onload = () => 
                {
                    resources.all[url] = img;
                    _done();
                }
                img.src = url;
            }
            
        }
    }
}