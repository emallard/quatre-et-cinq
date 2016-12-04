module qec  
{
    pushExample("IntersectionWithBorder", () => new exIntersectionWithBorder());

    export class exIntersectionWithBorder
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
        

        ground: sdBoxDTO = {
            type: 'sdBoxDTO',
            halfSize : [0.5, 0.1, 0.25],
            material : {
                type:'materialDTO',
                diffuse : [0, 1, 0] 
            },
            transform : mat4Identity()
        };

        sphere : sdSphereDTO = {
            type: 'sdSphereDTO',
            radius: 0.4,
            material : {
                type:'materialDTO',
                diffuse : [0, 0, 1] 
            }
        };

        borderSphere : sdBorderDTO = {
            type: 'sdBorderDTO',
            sd: this.sphere,
            borderIn: 0.05,
            borderOut: 0.0
        };

        intersection : sdIntersectionDTO = {
            type: 'sdIntersectionDTO',
            a : this.ground,
            b : this.borderSphere
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