module qec {

    export class renderSettings {
        sd: signedDistance;
        lights: ilight[] = [];

        camera: camera = new camera();
        shadows: boolean;
        refraction: boolean;

        boundingBoxes: boolean;
        noColor = false;
        zColor = false;

        floorPlane = false;
    }
}