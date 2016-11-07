module qec  
{
    pushExample("Owl", () => new exOwl());

    export class exOwl
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
/*
        svg : scSvgDTO = {
            type: 'scSvgDTO'
            src: 'data/tuto-owl/cartoon-owl.svg'
        };
*/
        top1 : scImageDTO = {
            type: 'scImageDTO',
            src: 'data/tuto-owl/top1.png'
        };

        profile1 : scImageDTO = {
            type: 'scImageDTO',
            src: 'data/cubeProfile.png'
        };

        fields : sdFieldsDTO = {
            type: 'sdFieldsDTO',
            topImage: this.top1,
            topBounds: [-0.5,-0.5,0.5,0.5],
            profileImage: this.profile1,
            profileBounds: [-0.5,-0.5,0.5,0.5],
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 1] 
            },
            transform:mat4.identity(mat4.create())
        };

        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.fields,
            camera : this.camera,
        }
    }
}