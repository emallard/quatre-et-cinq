
float maxcomp( in vec3 p ) {
    return max(p.x,max(p.y,p.z));
}

float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}
float sdBox( vec3 p, vec3 b ) {
    vec3  di = abs(p) - b;
    float mc = maxcomp(di);
    return min(mc,length(max(di,0.0)));
}

/* OPERATIONS */
float opU( float d1, float d2 )
{
    return min(d1,d2);
}
float opS( float d1, float d2 )
{
    return max(-d1,d2);
}
float opI( float d1, float d2 )
{
    return max(d1,d2);
}

float getFieldDistance(sampler2D field, vec2 uv)
{
    vec2 _uv = vec2(clamp(uv.x, 0.0, 1.0), clamp(uv.y, 0.0, 1.0));
    vec4 color = texture2D(field, _uv);
    return color[0];
}

uniform sampler2D u_topTextures[4];
uniform sampler2D u_profileTextures[4];
uniform vec2 u_halfSizeTops[4];
uniform vec2 u_halfSizeProfiles[4];


float sdFields0(vec3 p)
{
    vec2 uv = 0.5 + p.xy * (1.0/(2.0*u_halfSizeTops[0]));
    float d = getFieldDistance(u_topTextures[0], uv);   
    float d2 = getFieldDistance(u_profileTextures[0],
      0.5 + vec2(d, p.z) * (1.0/(2.0*u_halfSizeProfiles[0]))); 
    return d2;
}

float sdFields_(vec3 p, sampler2D u_topTexture, sampler2D u_profileTexture, vec2 u_halfSizeTop, vec2 u_halfSizeProfile)
{
    vec2 uv = 0.5 + p.xy * (1.0/(2.0*u_halfSizeTop));
    float d = getFieldDistance(u_topTexture, uv);   
    float d2 = getFieldDistance(u_profileTexture,
      0.5 + vec2(d, p.z) * (1.0/(2.0*u_halfSizeProfile))); 
    return d2;
}

/*
float sdFields1(vec3 p)
{
    float u = 0.5 + p.x/(2.0*u_halfSizeTops[1].x);
    float v = 0.5 + p.y/(2.0*u_halfSizeTops[1].y);
    float d = getFieldDistance(u_topTextures[1], u, v);   
    float d2 = getFieldDistance(u_profileTextures[1], 0.5+d/(2.0*u_halfSizeProfiles[1].x), 0.5 + p[2] /(2.0*u_halfSizeProfiles[1].y));
    return d2;
}
*/
float sdFields(vec3 pos)
{
    float d = 666.0;
    d = opU(d, sdFields0(pos));
    //d = opU(d, sdFields1(pos));
    return d;
}

float getDist(vec3 pos)
{
  /*
  float d0 = sdBox(pos, vec3(0.4, 0.2, 0.1));
  float d1 = sdSphere(pos, 0.3);
  return opS(d1, d0);
  */

  //return sdSphere(pos, 0.3);  

  return sdFields(pos);
}

vec3 getColor(vec3 pos)
{
  return vec3(0.5,0.5,0.5);
}
