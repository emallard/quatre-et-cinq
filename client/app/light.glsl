#define SS_K  15.0
#define SS_EPS 0.005
#define SS_MAX_STEPS 64
#define SS_EPS_INTERSECT 0.001

float getShadow (in vec3 pos, in vec3 toLight, float lightDist) {
  float shadow = 1.0;

  float t = SS_EPS;
  float dt;

  for(int i=0; i<SS_MAX_STEPS; ++i)
  {
    dt = getDist(pos+(toLight*t));
    
    if(dt < SS_EPS_INTERSECT)    // stop if intersect object
      return 0.0;

    shadow = min(shadow, SS_K*(dt/t));
    
    t += dt;
    
    if(t > lightDist)   // stop if reach light
      break;
  }
  
  return clamp(shadow, 0.0, 1.0);
}

float getDiffuse(vec3 pos, vec3 normal, vec3 toLight)
{
    float diffuse = dot(toLight, normal);
    diffuse = max(diffuse, 0.0);
    return diffuse;
}

float getSpecular(vec3 pos, vec3 normal, vec3 toLight, vec3 rd)
{
    vec3 reflRd = reflect(-toLight, normal);
    float specAngle = max(dot(reflRd, -rd), 0.0);
    float specular = pow(specAngle, 4.0);
    return specular;
}

vec3 applyLight(vec3 lightPos, int isShadow, vec3 color, vec3 pos, vec3 normal, vec3 rd)
{
    //float intensity = this.spotLights[i].intensity; 
    //vec3 lightPos = this.spotLights[i].position;
    float intensity = 1.0;
    vec3 toLight = normalize(lightPos - pos);

    float lightDist = distance(lightPos,pos);

    float diffuse = intensity * getDiffuse(pos, normal, toLight);
    float specular = intensity * getSpecular(pos, normal, toLight, rd);
    
    float shadow = 1.0;
    if (isShadow == 1)
        shadow = getShadow(pos, toLight, lightDist);
    
    float KD = 0.7; float KS = 0.5; 
    return shadow * ( KS*specular + KD*diffuse * color);
}
