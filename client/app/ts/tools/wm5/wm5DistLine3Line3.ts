// Adapted from:
// -------------

// Geometric Tools, LLC
// Copyright (c) 1998-2013
// Distributed under the Boost Software License, Version 1.0.
// http://www.boost.org/LICENSE_1_0.txt
// http://www.geometrictools.com/License/Boost/LICENSE_1_0.txt
//
// File Version: 5.0.1 (2010/10/01)

module qec
{

    export class wm5DistLine3Line3
    {

        mLine0Origin = vec3.create();
        mLine0Direction = vec3.create();
        mLine1Origin = vec3.create();
        mLine1Direction = vec3.create();
        mClosestPoint0 = vec3.create();
        mClosestPoint1 = vec3.create();
        mLine0Parameter = 0;
        mLine1Parameter = 0;

        ZERO_TOLERANCE = 1e-20;

        setLines(line0:wm5Line3, line1:wm5Line3)
        {
            vec3.copy(this.mLine0Origin, line0.origin);
            vec3.copy(this.mLine0Direction, line0.direction);
            vec3.copy(this.mLine1Origin, line1.origin);
            vec3.copy(this.mLine1Direction, line1.direction);
        }

        getDistance = function ()
        {
            return Math.sqrt(this.getSquared());
        }

        diff = vec3.create();

        getSquared()
        {

            var mLine0Origin = this.mLine0Origin;
            var mLine0Direction = this.mLine0Direction;
            var mLine1Origin = this.mLine1Origin;
            var mLine1Direction = this.mLine1Direction;
            var diff = this.diff;

            //Vector3<Real> diff = mLine0->Origin - mLine1->Origin;
            vec3.subtract(diff, mLine0Origin, mLine1Origin);

            //Real a01 = -mLine0->Direction.Dot(mLine1->Direction);
            var a01 = -vec3.dot(mLine0Direction, mLine1Direction);

            //Real b0 = diff.Dot(mLine0->Direction);
            var b0 = vec3.dot(diff, mLine0Direction);

            //Real c = diff.SquaredLength();
            var c = vec3.dot(diff, diff);

            //Real det = Math<Real>::FAbs((Real)1 - a01*a01);
            var det = Math.abs(1 - a01 * a01);

            var b1, s0, s1, sqrDist;

            if (det >= this.ZERO_TOLERANCE)
            {
                // Lines are not parallel.
                b1 = -vec3.dot(diff, mLine1Direction);
                var invDet = 1 / det;
                s0 = (a01 * b1 - b0) * invDet;
                s1 = (a01 * b0 - b1) * invDet;
                sqrDist = s0 * (s0 + a01 * s1 + 2 * b0) +
                    s1 * (a01 * s0 + s1 + 2 * b1) + c;
            }
            else
            {
                // Lines are parallel, select any closest pair of points.
                s0 = -b0;
                s1 = 0;
                sqrDist = b0 * s0 + c;
            }

            for (var i = 0; i < 3; ++i)
            {
                this.mClosestPoint0[i] = mLine0Origin[i] + s0 * mLine0Direction[i];
                this.mClosestPoint1[i] = mLine1Origin[i] + s1 * mLine1Direction[i];
            }

            this.mLine0Parameter = s0;
            this.mLine1Parameter = s1;

            // Account for numerical round-off errors.
            if (sqrDist < 0)
            {
                sqrDist = 0;
            }
            return sqrDist;
        }

        getClosestPoint0(dest:Float32Array)
        {
            vec3.copy(dest, this.mClosestPoint0);
        }

        getClosestPoint1(dest:Float32Array)
        {
            vec3.copy(dest, this.mClosestPoint1);
        }

        getLine0Parameter()
        {
            return this.mLine0Parameter;
        }

        getLine1Parameter()
        {
            return this.mLine1Parameter;
        }
    }
}
