module qec 
{

    export class renderSettings
    {
        sd:signedDistance; 
        
        directionalLights:directionalLight[] = [];
        spotLights:spotLight[] = [];
        
        camera:camera = new camera();
        shadows:boolean;
        refraction:boolean;
        boundingBoxes:boolean;
    }
}