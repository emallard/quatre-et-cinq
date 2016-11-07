module qec  
{
    pushExample("FieldsFont", () => new exFieldsFont());

    export class exFieldsFont
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

        topFont : scImageDTO = {
            type: 'scImageDTO',
            src: 'data/font.png'
        };

        profileFont : scImageDTO = {
            type: 'scImageDTO',
            src: 'data/cubeProfile.png'
        };

        fontFields : sdFieldsDTO = {
            type: 'sdFieldsDTO',
            topImage: this.topFont,
            topBounds: [-0.5,-0.5,0.5,0.5],
            profileImage: this.profileFont,
            profileBounds: [-0.2,-0.2,0.2,0.2],
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 1] 
            },
            transform:mat4.identity(mat4.create())
        };


        plane : sdPlaneDTO = {
            type: 'sdPlaneDTO',
            normal: [0, 0, 1],
            material : {
                type:'materialDTO',
                diffuse : [1, 1, 1] 
            }
        };

        union : sdUnionDTO = {
            type: 'sdUnionDTO',
            a: this.plane,
            b: this.fontFields,
        }

        render : scRendererDTO = {
            type: 'scRendererDTO',
            spotLights: [this.light],
            directionalLights : [],
            distance : this.union,
            camera : this.camera,
        }
    }
}