module qec {

    export class scRendererDTO {
        type : string;
        spotLights: any;
        directionalLights: any;
        distance: any;
        camera: cameraDTO;
    }

    export class scRenderer implements canCreate<scRendererDTO>
    {
        //rp:renderPixel;
        camera : camera;
        settings = new renderSettings();

        createFrom(dto:scRendererDTO)
        {
            this.camera = dto.camera['__instance'];
            this.settings.boundingBoxes = false;
            this.settings.shadows = false;
            this.settings.sd = dto.distance['__instance'];
            this.settings.camera = this.camera;
            this.settings.spotLights = dto.spotLights.map(l => l['__instance']);
            this.settings.directionalLights = dto.directionalLights.map(l => l['__instance']);
        }
    }
}