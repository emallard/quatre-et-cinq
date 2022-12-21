module qec  
{
    pushExample("Lighting1", ()=>new exLighting1());

    export class exLighting1
    {
        camera: cameraDTO = {
            type: 'cameraDTO',
            position: [0, -6, 2],//[3,-5,5],
            target : [0,0,0.5],
            up : [0,0,1],
            fov : Math.PI/6
        };

        keyLight: directionalLightDTO = {
            type: 'directionalLightDTO',
            direction : [1, 1, -2],
            intensity : 0.8
        };

        fillLight: directionalLightDTO = {
            type: 'directionalLightDTO',
            direction : [-1, 1, -1],
            intensity : 0.2
        };

        rimLight : spotLightDTO = {
            type: 'spotLightDTO',
            position: [2, 2, 0.5],
            direction : [-1, -1, 0.1],
            intensity : 0.2
        };

        render : scRendererDTO = {
            type: 'scRendererDTO',
            directionalLights: [this.keyLight, this.fillLight],
            spotLights: [this.rimLight],
            distance : null,
            camera : this.camera,
        }

        plane : sdPlaneDTO = {
            type: 'sdPlaneDTO',
            normal: [0, 0, 1],
            material : {
                type:'materialDTO',
                diffuse : [1.5, 1.5, 1.5] 
            }
        };


        constructor()
        {
            var colors = [[1,0,0], [0,1,0], [0,0,1]];
            var n = 3;
            var sd = new sdUnion();
            for (var i=0 ; i < n; ++i)
            {
                var r = i/(n-1);
                var box: sdBoxDTO = {
                    type: 'sdBoxDTO',
                    halfSize : [0.25, 0.25, 0.5],
                    material : {
                        type:'materialDTO',
                        diffuse : colors[i]
                    },
                    transform : mat4Translate(-(n-1)/2 + i*1, 0, 0.5)
                };
                var sdb =  new sdBox();
                sdb.createFrom(box);
                sd.array.push(sdb);
            }
/*
            for (var i=0 ; i < n; ++i)
            {
                var r = i/(n-1);
                var box: sdBoxDTO = {
                    type: 'sdBoxDTO',
                    halfSize : [0.25, 0.25, 0.5],
                    material : {
                        type:'materialDTO',
                        diffuse : [1, r, 1] 
                    },
                    transform : mat4Translate(-(n-1)/2 + i*1, 1, 0.5)
                };
                var sdb =  new sdBox();
                sdb.createFrom(box);
                sd.array.push(sdb);
            }
*/
            for (var i=0 ; i < n; ++i)
            {
                var r = i/(n-1);
                var sphere: sdSphereDTO = {
                    type: 'sdBoxDTO',
                    radius : 0.35,
                    material : {
                        type:'materialDTO',
                        diffuse : colors[i]
                    },
                    transform : mat4Translate(-(n-1)/2 + i*1, 0, 0.5)
                };
                var sds =  new sdSphere();
                sds.createFrom(sphere);
                sd.array.push(sds);
            }


            var sdp = new sdPlane();
            sdp.createFrom(this.plane);
            sd.array.push(sdp);

            this.render.distance = {};
            this.render.distance['__instance'] = sd;
        }
    }
}