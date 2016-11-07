module qec  
{
    pushExample("Plane", ()=>new exPlane());

    export class exPlane
    {
        camera: cameraDTO = {
            type: 'cameraDTO',
            position: [1, -3, 1],
            target : [0,0,0],
            up : [0,0,1],
            fov : Math.PI/6
        };

        light : spotLightDTO = {
            type: 'spotLightDTO',
            position : [0, 0, 1],
            direction : [0, 0, -1],
            intensity : 1
        };

        plane : sdPlaneDTO = {
            type: 'sdPlaneDTO',
            normal: [0, 0, 1],
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 1] 
            }
        };

        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.plane,
            camera : this.camera,
        }
    }
}