uniform mat4 u_inverseTransforms[3];

uniform sampler2D u_topTextures[2];
uniform sampler2D u_profileTextures[2];
uniform vec4 u_topBounds[2];
uniform vec4 u_profileBounds[2];

float getDist_2(vec3 pos) { 
  return sdFields_(pos,
    u_topTextures[1],
    u_profileTextures[1],
    u_topBounds[1],
    u_profileBounds[1],
    u_inverseTransforms[2]
  );}

float getDist_1(vec3 pos) { 
  return sdFields_(pos,
    u_topTextures[0],
    u_profileTextures[0],
    u_topBounds[0],
    u_profileBounds[0],
    u_inverseTransforms[1]
  );}

float getDist_0(vec3 pos) { 
  float d=666.0;
  d = opU(d, getDist_1(pos));
  d = opU(d, getDist_2(pos));
  return d;
}

float getDist(vec3 pos) { return getDist_0(pos); }


uniform vec3 u_diffuses[3];

vec3 getColor_2(vec3 pos) { return u_diffuses[2]; }

vec3 getColor_1(vec3 pos) { return u_diffuses[1]; }

vec3 getColor_0(vec3 pos) {
  float d=666.0;
  float d2;  vec3 color;
  d2 = getDist_1(pos);
  if (d2 < d) { d = d2; color = getColor_1(pos);}
  d2 = getDist_2(pos);
  if (d2 < d) { d = d2; color = getColor_2(pos);}
  return color;
}

vec3 getColor(vec3 pos) { return getColor_0(pos); }
