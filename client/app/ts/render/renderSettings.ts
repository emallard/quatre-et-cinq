module qec {

    export class renderSettings {
        sd: signedDistance;
        lights: ilight[] = [];

        camera: camera = new camera();
        shadows: boolean;
        refraction: boolean;

        backgroundColor = vec4.fromValues(1, 1, 1, 1);
        boundingBoxes: boolean;
        noColor = false;
        zColor = false;

        floorPlane = false;
    }
}