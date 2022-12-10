module qec 
{

    export class renderSettings
    {
        sdArray:signedDistance[];
        
        directionalLights:directionalLight[] = [];
        spotLights:spotLight[] = [];
        
        camera:camera = new camera();
        shadows:boolean;
        refraction:boolean;
        boundingBoxes:boolean;
    }
}