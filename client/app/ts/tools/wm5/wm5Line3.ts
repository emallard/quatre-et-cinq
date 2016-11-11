// Adapted From:

// Geometric Tools, LLC
// Copyright (c) 1998-2014
// Distributed under the Boost Software License, Version 1.0.
// http://www.boost.org/LICENSE_1_0.txt
// http://www.geometrictools.com/License/Boost/LICENSE_1_0.txt
//
// File Version: 5.0.0 (2010/01/01)

module qec
{

    export class wm5Line3
    {

        origin = vec3.create();
        direction = vec3.create();

        setOriginAndDirection(origin:Float32Array, direction:Float32Array)
        {
            vec3.copy(this.origin, origin);
            vec3.copy(this.direction, direction);
        }

        setTwoPoints(a:Float32Array, b:Float32Array)
        {
            vec3.copy(this.origin, a);
            vec3.subtract(this.direction, b, a);
            var l = vec3.length(this.direction);
            if ( l==0)
            {
                this.direction[0] = 1;
            }
            else
            {
                vec3.scale(this.direction, this.direction, 1/l);
            }

        }
    }
}