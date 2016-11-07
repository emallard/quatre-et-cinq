
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

float intersectDist(in vec3 ro, in vec3 rd) {  
  float t = gMin;
  float dist = -1.0;
  
  for(int i=0; i<MAX_STEPS; ++i)
  {
    float dt = getDist(ro + rd*t);
    
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

#define SS_K  15.0
#define SS_EPS 0.005
#define SS_MAX_STEPS 64
float getShadow (in vec3 pos, in vec3 toLight) {
  float shadow = 1.0;
  float lightDist = distance(u_lightP,pos);

  float t = SS_EPS;
  float dt;

  for(int i=0; i<SS_MAX_STEPS; ++i)
  {
    dt = getDist(pos+(toLight*t));
    
    if(dt < EPS_INTERSECT)    // stop if intersect object
      return 0.0;

    shadow = min(shadow, SS_K*(dt/t));
    
    t += dt;
    
    if(t > lightDist)   // stop if reach light
      break;
  }
  
  return clamp(shadow, 0.0, 1.0);
}

vec3 rayMarch (in vec3 ro, in vec3 rd) {
  
    float t = intersectDist(ro, rd);
        
    if (t>0.0) {      
        
        vec3 pos = ro + rd*t;
        vec3 nor = getNormal(pos-rd*EPS_NORMAL_1);
        
        // diffuse lighting
        
        vec3 toLight = normalize(u_lightP-pos);
        float _dot = max(dot(toLight,nor),0.0);
        vec3 col = getColor(pos);
        col = KA*col + KD*_dot;

        // shadow
        if (u_shadows == 1)
        {
          float shadow = getShadow(pos, toLight);
          if (shadow == 0.0)
            col *= 0.5;// shadow;
        }

        return col;
        //return vec3(1);
    }
    return vec3(0.0,0.0,0.0);
}

vec3 render (in vec3 ro, in vec3 rd) {
  vec3 col = rayMarch(ro, rd);
  return col;
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