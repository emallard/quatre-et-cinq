module qec  
{
    pushExample("GridWithBorder", () => new exGridWithBorder());

    export class exGridWithBorder
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

        grid : sdGridDTO = {
            type: 'sdGridDTO',
            size : 0.33,
            thickness : 0.01,
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
        /*
        box: sdBoxDTO = {
            type: 'sdBoxDTO',
            halfSize:[0.6,0.6,0.6],
            material : {
                type:'materialDTO',
                diffuse : [0, 1, 0] 
            },
            transform : mat4Identity()
        };*/

        border1 : sdBorderDTO = {
            type: 'sdBorderDTO',
            sd: this.sphere,
            borderIn: 0.0,
            borderOut: 0
        };

        intersection : sdIntersectionDTO = {
            type: 'sdIntersectionDTO',
            a : this.border1,
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