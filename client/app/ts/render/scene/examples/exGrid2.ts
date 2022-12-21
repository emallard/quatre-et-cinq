module qec  
{
    pushExample("Grid2", () => new exGrid2());

    export class exGrid2
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
            position : [2, -4, 2],
            direction : [-2, 4, 2],
            intensity : 1
        };

        grid : sdGrid2DTO = {
            type: 'sdGrid2DTO',
            size:0.33,
            thickness:0.001,
            material : {
                type:'materialDTO',
                diffuse : [0, 1, 0] 
            },
        };

        sphere: sdSphereDTO = {
            type: 'sdSphereDTO',
            radius:0.6,
            material : {
                type:'materialDTO',
                diffuse : [0, 1, 0] 
            },
            transform : mat4Identity()
        };

        intersection : sdIntersectionDTO = {
            type: 'sdIntersectionDTO',
            a : this.sphere,
            b : this.grid
        };


        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.intersection,
            camera : this.camera,
        }
    }
}