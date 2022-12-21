module qec  
{
    pushExample("Repeat", () => new exRepeat());

    export class exRepeat
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

        sphere : sdSphereDTO = {
            type: 'sdSphereDTO',
            radius: 0.05,
            material : {
                type:'materialDTO',
                diffuse : [0, 0, 1] 
            }
        };

        repeat : sdRepeatDTO = {
            type: 'sdRepeatDTO',
            sd : this.sphere,
            box: [0.3, 0.3, 0.3]
        };

        box: sdBoxDTO = {
            type: 'sdBoxDTO',
            halfSize : [0.6,0.6,0.6],
            material : {
                type:'materialDTO',
                diffuse : [0, 1, 0] 
            },
            transform : mat4Identity()
        };

        intersection : sdIntersectionDTO = {
            type: 'sdIntersectionDTO',
            a : this.box,
            b : this.repeat
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