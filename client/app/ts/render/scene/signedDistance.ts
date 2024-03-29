module qec {


    export function instanceOfSignedDistance(object: any): object is signedDistance {
        return 'isSignedDistance' in object
    }

    export interface signedDistance {

        isSignedDistance: boolean;
        svgId: string;
        uniqueName: string;
        transform: Float32Array;
        inverseTransform: Float32Array;

        getDist(pos: Float32Array, boundingBox: boolean, debug: boolean): number;

        getDist2(pos: Float32Array, rd: Float32Array, boundingBox: boolean, debug: boolean): number;

        //intersectBounds(out:Float32Array, ro:Float32Array, rd:Float32Array)

        getMaterial(pos: Float32Array): material;

        getInverseTransform(out: Float32Array);

        getBounds(min: Float32Array, max: Float32Array);

        //getTransform(out: Float32Array);
    }
}