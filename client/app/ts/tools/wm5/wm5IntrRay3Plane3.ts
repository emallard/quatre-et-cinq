
module qec {

    export class wm5IntrRay3Plane3 {
        mRayParameter = 0;
        mIntersectionType = 0;
        intr = new wm5IntrLine3Plane3();

        setAll(origin: Float32Array, direction: Float32Array, plane: wm5Plane3) {
            this.intr.setAll(origin, direction, plane);
        }

        find(): boolean {
            this.intr.find();
            this.mIntersectionType = this.intr.getIntersectionType();
            this.mRayParameter = this.intr.getLineParameter();

            if (this.mIntersectionType == IT_POINT && this.mRayParameter > 0) {
                return true;
            }

            this.mIntersectionType = IT_EMPTY;
            return false;
        }

        getIntersectionType() {
            return this.mIntersectionType;
        }

        getIntersection(dest: Float32Array) {
            this.intr.getIntersection(dest);
        }
    }
}