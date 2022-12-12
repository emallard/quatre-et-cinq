module qec {

    export class scene
    {
        sceneBase = new sceneBase();
        constructor()
        {
            var s = this.sceneBase;
            s.register('cameraDTO', camera);
            s.register('pointLightDTO', pointLight);
            s.register('directionalLightDTO', directionalLight);
            s.register('spotLightDTO', spotLight);
            
            s.register('scRendererDTO', scRenderer);
            s.register('sdBorderDTO', sdBorder);
            s.register('sdBoxDTO', sdBox);
            s.register('sdFieldsDTO', sdFields);
            s.register('sdFields1DTO', sdFields1);
            s.register('sdFields2DTO', sdFields2);
            s.register(sdFields2RadialDTO.TYPE, sdFields2Radial);
            s.register(sdFields2BorderDTO.TYPE, sdFields2Border);

            s.register('sdGridDTO', sdGrid);
            s.register('sdGrid2DTO', sdGrid2);
            s.register('sdIntersectionDTO', sdIntersection);
            s.register('sdPlaneDTO', sdPlane);
            s.register('sdRepeatDTO', sdRepeat);
            s.register('sdSphereDTO', sdSphere);
            s.register('sdSubtractionDTO', sdSubtraction);
            s.register('sdUnionDTO', sdUnion);
        }

        public setDebug(b:boolean)
        {
            this.sceneBase.debugInfo = b;
        }

        public create(sceneDTO:any, done:()=>void)
        {
            //this.loadImages(sceneDTO, ()=>this.createStep2(sceneDTO, done));
            this.createStep2(sceneDTO, done);
        }

        private createStep2(sceneDTO:any, done:()=>void)
        {
            this.sceneBase.create(sceneDTO);
            done();
        }

        public get<T>(predicate:(Object)=>boolean, name:string) : T
        {
            var found = this.sceneBase[name];
            if (predicate(found))
                return found;
            throw "object not found in scene: " + name;
        }

        public getCamera(name:string) : camera
        {
            var found = this.sceneBase[name];
            if (found instanceof camera)
                return found;
            throw "camera not found : " + name;
        }

        public getSignedDistance(name: string) : signedDistance
        {
            var found = this.sceneBase[name];
            if (found) 
                return found;
            throw "signedDistance not found : " + name;
        }

        private loadImages(sceneDTO:any, done:()=>void)
        {
            console.log('load images');
            var run = new runAll();
            this.rec(run, sceneDTO);
            run.run(done);
        }

        private rec(run:runAll, x:any):void
        {
            if (typeof x === 'string'
                || typeof x === 'number'
                || x instanceof String
                || x instanceof Number)
            {
                return;
            }
            if (x['type'] == 'scImageDTO')
            {
                this.addLoadImage(run, <scImageDTO> x);
            }
            else
            {
                for (var key in x)
                {
                    this.rec(run, x[key]);
                }
            }
        };

        private addLoadImage(run:runAll, dto:scImageDTO)
        {
            run.push((_done) => 
            {    
                var scImg = new scImage();
                dto['__instance'] = scImg;
                console.log('Load image : ' + dto.src);
                scImg.createAsyncFrom(dto, _done);
            });
        }
    }

}