module qec  
{
    pushExample("Repeat2", () => new exRepeat2());

    export class exRepeat2
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
            radius: 0.2,
            material : {
                type:'materialDTO',
                diffuse : [0, 0, 1] 
            }
        };

        borderSphere : sdBorderDTO = {
            type: 'sdBorderDTO',
            sd: this.sphere,
            borderIn: 0.02,
            borderOut: 0.0
        };

        repeat : sdRepeatDTO = {
            type: 'sdRepeatDTO',
            sd : this.borderSphere,
            box: [0.4, 0.4, 0.4]
        };

        box: sdBoxDTO = {
            type: 'sdBoxDTO',
            halfSize : [0.6,0.6,0.6],
            material : {
                type:'materialDTO',
                diffuse : [0, 1, 0] 
            },
            transform : mat4Array(mat4.rotateZ(mat4.create(), mat4.identity(mat4.create()), Math.PI/6))
        };

        borderBox : sdBorderDTO = {
            type: 'sdBorderDTO',
            sd: this.box,
            borderIn: 0.02,
            borderOut: 0.0
        };

        intersection : sdIntersectionDTO = {
            type: 'sdIntersectionDTO',
            a : this.borderBox,
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