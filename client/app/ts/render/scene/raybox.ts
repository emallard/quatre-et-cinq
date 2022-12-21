
module qec {

    export class Ray {
        origin = vec3.create();
        direction = vec3.create();
        inv_direction = vec3.create();
        sign0:number;
        sign1:number;
        sign2:number;
    };

    export function makeRay(ray:Ray, origin:Float32Array, direction:Float32Array) : Ray {
        vec3.copy(ray.origin, origin);
        vec3.copy(ray.direction, direction);
        for (var i=0; i < 3; ++i)
            ray.inv_direction[i] = 1.0 / direction[i];
        ray.sign0 = (ray.inv_direction[0] < 0.0) ? 1 : 0;
        ray.sign1 = (ray.inv_direction[1] < 0.0) ? 1 : 0;
        ray.sign2 = (ray.inv_direction[2] < 0.0) ? 1 : 0;
        return ray;
    }


    export class raybox {

        static intersection(ray:Ray, aabb:Float32Array[], debug:boolean) : number
        {
            var tx1 = (aabb[0][0] - ray.origin[0])*ray.inv_direction[0];
            var tx2 = (aabb[1][0] - ray.origin[0])*ray.inv_direction[0];
        
            var tmin = Math.min(tx1, tx2);
            var tmax = Math.max(tx1, tx2);
        
            var ty1 = (aabb[0][1] - ray.origin[1])*ray.inv_direction[1];
            var ty2 = (aabb[1][1] - ray.origin[1])*ray.inv_direction[1];
        
            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));
            
            var tz1 = (aabb[0][2] - ray.origin[2])*ray.inv_direction[2];
            var tz2 = (aabb[1][2] - ray.origin[2])*ray.inv_direction[2];
        
            tmin = Math.max(tmin, Math.min(tz1, tz2));
            tmax = Math.min(tmax, Math.max(tz1, tz2));

            if (debug)
                console.log('hop', tmin, tmax);

            if (tmin > tmax)
                return 10000;
            else
                return tmin;

            //return tmax >= tmin;
        }

        static intersection_test0(ray:Ray, aabb:Float32Array[], debug:boolean) : number
        {
            var txmin = (aabb[ray.sign0][0] - ray.origin[0]) * ray.inv_direction[0];
            var txmax = (aabb[1-ray.sign0][0] - ray.origin[0]) * ray.inv_direction[0];
            var tymin = (aabb[ray.sign1][1] - ray.origin[1]) * ray.inv_direction[1];
            var tymax = (aabb[1-ray.sign1][1] - ray.origin[1]) * ray.inv_direction[1];
            var tzmin = (aabb[ray.sign2][2] - ray.origin[2]) * ray.inv_direction[2];
            var tzmax = (aabb[1-ray.sign2][2] - ray.origin[2]) * ray.inv_direction[2];
            var tmin = Math.max(Math.max(txmin, tymin), tzmin);
            var tmax = Math.min(Math.min(txmax, tymax), tzmax);

            if (debug)
                console.log(tmin, tmax);

            if (tmin > tmax)
                return 10000;
            else
                return tmin;
            // post condition:
            // if tmin > tmax (in the code above this is represented by a return value of INFINITY)
            //     no intersection
            // else
            //     front intersection point = ray.origin + ray.direction * tmin (normally only this point matters)
            //     back intersection point  = ray.origin + ray.direction * tmax
        }

        static inbox(aabb:Float32Array[], ro:Float32Array, m:number) : boolean
        {
            return ro[0] > (aabb[0][0]+m) && ro[0] < (aabb[1][0]+m)
                && ro[1] > (aabb[0][1]+m) && ro[1] < (aabb[1][1]+m)
                && ro[2] > (aabb[0][2]+m) && ro[2] < (aabb[1][2]+m);
        }
    }
    
}