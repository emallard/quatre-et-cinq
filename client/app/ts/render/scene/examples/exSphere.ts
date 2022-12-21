module qec  
{
    pushExample("Sphere", ()=>new exSphere());

    export class exSphere
    {
        camera: cameraDTO = {
            type: 'cameraDTO',
            position: [1, -3, 3],//[3,-5,5],
            target : [0,0,0],
            up : [0,0,1],
            fov : Math.PI/6
        };

        light : spotLightDTO = {
            type: 'spotLightDTO',
            position : [-2, -4, 2],
            direction : [2, 4, 2],
            intensity : 1
        };

        sphere : sdSphereDTO = {
            type: 'sdSphereDTO',
            radius: 0.4,
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 1] 
            }
        };

        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.sphere,
            camera : this.camera,
        }
    }
}