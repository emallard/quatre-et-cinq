module qec  
{
    pushExample("FieldsWithTransform", () => new exFieldsWithTransform());

    export class exFieldsWithTransform
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

        topCube : scImageDTO = {
            type: 'scImageDTO',
            src: 'data/cubeTop.png'
        };

        profileCube : scImageDTO = {
            type: 'scImageDTO',
            src: 'data/cubeProfile.png'
        };

        fieldsCube : sdFieldsDTO = {
            type: 'sdFieldsDTO',
            topImage: this.topCube,
            topBounds: [-0.5,-0.5,0.5,0.5],
            profileImage: this.profileCube,
            profileBounds: [-0.5,-0.5,0.5,0.5],
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 1] 
            },
            transform : mat4.fromTranslation(mat4.create(), vec3.fromValues(0,0,-0.5))
        };

        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.fieldsCube,
            camera : this.camera,
        }
    }
}