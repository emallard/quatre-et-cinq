module qec  
{
    pushExample("SphereAndShadow", ()=>new exSphereAndShadow());

    export class exSphereAndShadow
    {
        camera: cameraDTO = {
            type: 'cameraDTO',
            position: [1, -5, 2],//[3,-5,5],
            target : [0,1,0],
            up : [0,0,1],
            fov : Math.PI/6
        };

        light : spotLightDTO = {
            type: 'spotLightDTO',
            position : [-1, -1, 2],
            direction : [1, 1, 2],
            intensity : 1
        };

        plane : sdPlaneDTO = {
            type: 'sdPlaneDTO',
            normal: [0, 0, 1],
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 0] 
            }
        };

        sphere : sdSphereDTO = {
            type: 'sdSphereDTO',
            radius: 0.4,
            transform: mat4Translate(0, 0, 0.4),
            material : {
                type:'materialDTO',
                diffuse : [1, 0, 0] 
            }
        };

        union : sdUnionDTO = {
            type: 'sdUnionDTO',
            array: [this.plane, this.sphere],
        }

        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.union,
            camera : this.camera,
        }
    }
}