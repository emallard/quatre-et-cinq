module qec  
{
    pushExample("Box", ()=>new exBox());

    export class exBox
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

        box: sdBoxDTO = {
            type: 'sdBoxDTO',
            halfSize : [0.5, 0.5, 0.5],
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 1] 
            },
            transform : mat4Identity()
        };


        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.box,
            camera : this.camera,
        }
    }
}