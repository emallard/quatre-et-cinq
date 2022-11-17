module qec {

    export class scSceneDTO
    {
        objects:any[] = [];
        directionalLights:directionalLightDTO[] = [];
        spotLights:spotLightDTO[] = [];
        cameras:cameraDTO[] = [];
    }
}