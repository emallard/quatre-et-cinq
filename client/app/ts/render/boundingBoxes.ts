module qec {
    export class boundingBoxes {

        static tmpMin = vec3.create();
        static tmpMax = vec3.create();

        static getBoundingBoxHalfSize(sds: signedDistance[], center: Float32Array, halfSize: Float32Array) {
            boundingBoxes.getBoundingBox(sds, boundingBoxes.tmpMin, boundingBoxes.tmpMax, center, halfSize);
        }

        static getBoundingBox(sds: signedDistance[], min: Float32Array, max: Float32Array, center: Float32Array, halfSize: Float32Array) {
            vec3.set(min, 666666, 666666, 666666);
            vec3.set(max, -666666, -666666, -666666);

            let tmpMin = vec3.create();
            let tmpMax = vec3.create();
            let tmpTransform = mat4.create();

            let point = vec3.create();

            // find bounding boxes
            for (let s of sds) {
                s.getBounds(tmpMin, tmpMax);
                tmpTransform = s.transform;

                vec3.transformMat4(point, tmpMin, tmpTransform);

                for (let i = 0; i < 3; i++) {
                    min[i] = Math.min(min[i], point[i]);
                    max[i] = Math.max(max[i], point[i]);
                }

                vec3.transformMat4(point, tmpMax, tmpTransform);

                for (let i = 0; i < 3; i++) {
                    min[i] = Math.min(min[i], point[i]);
                    max[i] = Math.max(max[i], point[i]);
                }
            }

            vec3.set(center,
                (min[0] + max[0]) / 2,
                (min[1] + max[1]) / 2,
                (min[2] + max[2]) / 2);

            vec3.set(halfSize,
                (max[0] - min[0]) / 2,
                (max[1] - min[1]) / 2,
                (max[2] - min[2]) / 2);
        }

    }
}