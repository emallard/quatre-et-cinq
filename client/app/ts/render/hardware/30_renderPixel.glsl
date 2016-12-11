
#define MAX_STEPS 100
#define EPS_INTERSECT 0.001
#define EPS_NORMAL_1 0.01
#define EPS_NORMAL_2 0.01
#define EPS_INTERSECT 0.001

float gMin = 0.0;
float gMax = 100.0;
#define KA 0.5
#define KD 0.5

uniform mat4 u_inversePMatrix;
uniform mat4 u_inverseTransformMatrix;
uniform vec3 u_lightP;
uniform int u_shadows;

varying vec2 vUv;

// http://graphics.stanford.edu/courses/cs148-10-summer/docs/2006--degreve--reflection_refraction.pdf
// https://github.com/hpicgs/cgsee/wiki/Ray-Box-Intersection-on-the-GPU


struct Ray {
    vec3 origin;
    vec3 direction;
    vec3 inv_direction;
    int sign0;
    int sign1;
    int sign2;
};

Ray makeRay(vec3 origin, vec3 direction) {
    Ray ray;
    ray.origin = origin;
    ray.direction = direction;
    ray.inv_direction = vec3(1.0) / direction;
    ray.sign0 = (ray.inv_direction.x < 0.0) ? 0 : 1;
    ray.sign1 = (ray.inv_direction.y < 0.0) ? 0 : 1;
    ray.sign2 = (ray.inv_direction.z < 0.0) ? 0 : 1;
    return ray;
}

void intersection_distances_no_if(
    in Ray ray, in vec3 aabb[2],
    out float tmin, out float tmax)
{
    float tymin, tymax, tzmin, tzmax;
    tmin = (aabb[ray.sign0].x - ray.origin.x) * ray.inv_direction.x;
    tmax = (aabb[1-ray.sign0].x - ray.origin.x) * ray.inv_direction.x;
    tymin = (aabb[ray.sign1].y - ray.origin.y) * ray.inv_direction.y;
    tymax = (aabb[1-ray.sign1].y - ray.origin.y) * ray.inv_direction.y;
    tzmin = (aabb[ray.sign2].z - ray.origin.z) * ray.inv_direction.z;
    tzmax = (aabb[1-ray.sign2].z - ray.origin.z) * ray.inv_direction.z;
    tmin = max(max(tmin, tymin), tzmin);
    tmax = min(min(tmax, tymax), tzmax);
    // post condition:
    // if tmin > tmax (in the code above this is represented by a return value of INFINITY)
    //     no intersection
    // else
    //     front intersection point = ray.origin + ray.direction * tmin (normally only this point matters)
    //     back intersection point  = ray.origin + ray.direction * tmax
}

struct RayMarch
{
    int noIntersection;
    float t;
    vec3 ro;
    vec3 rd;
    vec3 pos;
    vec3 normal;
    vec3 color;
};

/*
void rayBoxIntersection(vec3 box, vec3 ro, vec3 rd)
{
    float tmin = -10000.0;//-INFINITY;
    float tmax = 10000.0;//INFINITY;

    for (var i=0; i < 3 ; ++i)
    {
        if (rd[i] != 0.0) {
            var t1 = (-b[i] - ro[i])/rd[i];
            var t2 = ( b[i] - ro[i])/rd[i];    
            tmin = max(tmin, Math.min(t1, t2));
            tmax = min(tmax, Math.max(t1, t2));
        }
    }

    if (tmax <= tmin)
        return 10000;
    return tmin;

}
*/

float intersectDist(in vec3 ro, in vec3 rd, in float multiplier) {  
  float t = 4.0*EPS_INTERSECT;
  float dist = -1.0;
  
  for(int i=0; i<MAX_STEPS; ++i)
  {
    float dt = multiplier * getDist(ro + rd*t);
    
    if(dt < EPS_INTERSECT) {
      dist = t;
      break;
    }
    t += dt;    
    if(t > gMax)
      break;
  }

  return dist;
}


vec3 getNormal(in vec3 pos) {
  vec3 eps = vec3(EPS_NORMAL_2, 0.0, 0.0);
  vec3 nor;
  nor.x = getDist(pos+eps.xyy) - getDist(pos-eps.xyy);
  nor.y = getDist(pos+eps.yxy) - getDist(pos-eps.yxy);
  nor.z = getDist(pos+eps.yyx) - getDist(pos-eps.yyx);
  return normalize(nor);
}


RayMarch rayMarch (in vec3 ro, in vec3 rd, float multiplier) {

    RayMarch result;
    result.ro = ro;
    result.rd = rd;

    float t = intersectDist(ro, rd, multiplier);
        
    if (t>0.0) {      
        
        vec3 pos = ro + rd*t;
        vec3 normal = getNormal(pos-rd*EPS_NORMAL_1);
        
        vec3 col = getColor(pos);

        // intersect dist on reflected ray
        //reflIntersection = intersectDist(ro, rd);
        //reflColor = getColor(intersection.pos);
        /*
        float refractionIn = 0.5f;
        vec3 refrRo = pos;
        vec3 refrRd = refract(rd, normal, refractionIn);
        vec3 refrT = intersectDist(refrRo, refrRd, -1f);
        vec3 refrPos = refrRo + refrRd * refrT; 
        vec3 refrCol = getColor(refrPos);
        vec3 refrNormal = getNormal(refrPos-refrRd*EPS_NORMAL_1);
        refrCol = getLight(u_shadows, refrCol, refrPos, refrNormal, refrRd);
        */

        // refractionOut = 1.0f/refractionIn
        col = getLight(u_shadows, col, pos, normal, rd);

        result.noIntersection = 0;
        result.t = t;
        result.pos = pos;
        result.normal = normal;
        result.color = col;

        return result;
    }

    result.noIntersection = 1;
    result.color = GetSkyGradient(rd);
    //return vec3(0.0,0.0,0.0);

    return result;
}

vec3 render (in vec3 ro, in vec3 rd) {
    RayMarch r1 = rayMarch(ro, rd, 1.0);

    //if (r1.noIntersection == 1)
      return r1.color;
/*
    float refractionIn = 0.9;
    vec3 rd2 = refract(r1.rd, r1.normal, refractionIn);
    RayMarch r2 = rayMarch(r1.pos, rd2, -1.0);

    vec3 rd3 = refract(r2.rd, -r2.normal, refractionIn);
    RayMarch r3 = rayMarch(r2.pos, rd3, 1.0);
    
    float opacity = 0.4;
    return r1.color*0.6 + r2.color*0.3;// + r3.color*0.4;
  */  
}

void getRayRel(in vec2 uv, out vec3 ro, out vec3 rd)
{
    // http://antongerdelan.net/opengl/raycasting.html
    vec4 ray_clip = vec4(uv, -1.0, 1.0);
    vec4 ray_eye = u_inversePMatrix * ray_clip;
    ray_eye = vec4(ray_eye[0], ray_eye[1], -1.0, 0.0);
    
    rd = normalize(u_inverseTransformMatrix * ray_eye).xyz;
    ro = (u_inverseTransformMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
}

void main()
{
  vec3 rd;
  vec3 ro;
  getRayRel(2.0*vUv-1.0, ro, rd);

  gl_FragColor.a = 1.0;
  gl_FragColor.rgb = render(ro, rd);
}