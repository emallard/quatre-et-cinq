
module qec {


    export class wm5Plane3 {
        normal = vec3.create();
        constant = 0;

        distanceTo(p: Float32Array): number {
            return vec3.dot(this.normal, p) - this.constant;
        }

        computeConstant(p: Float32Array) {
            this.constant = -vec3.dot(this.normal, p);
        }
    }

    export var IT_EMPTY = 1;
    export var IT_POINT = 2;
    export var IT_SEGMENT = 3;
    export var IT_POLYGON = 4;
    export var IT_LINE = 5;

    export class wm5IntrLine3Plane3 {
        lineOrigin = vec3.create();
        lineDirection = vec3.create();
        plane: wm5Plane3;
        lineParameter = 0;
        mIntersectionType = IT_EMPTY;

        setAll(lineOrigin: Float32Array, lineDirection: Float32Array, plane: wm5Plane3) {
            this.plane = plane;
            vec3.copy(this.lineDirection, lineDirection);
            vec3.copy(this.lineOrigin, lineOrigin);
        }

        ZERO_TOLERANCE = 1e-20;
        find() {
            //Real DdN = mLine->Direction.Dot(mPlane->Normal);
            var DdN = vec3.dot(this.lineDirection, this.plane.normal)

            //Real signedDistance = mPlane->DistanceTo(mLine->Origin);
            var signedDistance = this.plane.distanceTo(this.lineOrigin);

            if (Math.abs(DdN) > this.ZERO_TOLERANCE) {
                // The line is not parallel to the plane, so they must intersect.
                this.lineParameter = -signedDistance / DdN;
                this.mIntersectionType = IT_POINT;
                return true;
            }

            /*
             if (Math.abs(signedDistance) <= ZERO_TOLERANCE)
             {
             // The line is coincident with the plane, so choose t = 0 for the
             // parameter.
             self.lineParameter = 0;
             self.mIntersectionType = IT_LINE;
             return true;
             }
             */

            this.mIntersectionType = IT_EMPTY;
            return false;
        }


        getLineParameter() {
            return this.lineParameter;
        }

        getIntersectionType() {
            return this.mIntersectionType;
        }

        getIntersection(dest: Float32Array) {
            for (var i = 0; i < 3; ++i) {
                dest[i] = this.lineOrigin[i] + this.lineParameter * this.lineDirection[i];
            }
        }
    }
}