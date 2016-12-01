/*
uniform samplerCube u_cubemap;
vec3 GetSkyGradient( const in vec3 vDir )
{
    return textureCube(u_cubemap, vDir).rgb;
}
*/
vec3 GetSkyGradient( const in vec3 vDir )
{
    //const vec3 cColourTop = vec3(0.7, 0.8, 1.0);
    //const vec3 cColourHorizon = cColourTop * 0.5;

    const vec3 cColourTop = vec3(0.3, 0.3, 0.3);
    const vec3 cColourHorizon = cColourTop * 0.5;

    float fBlend = clamp(vDir.z, 0.0, 1.0);
    return mix(cColourHorizon, cColourTop, fBlend);
}


float maxcomp( in vec3 p ) {
    return max(p.x,max(p.y,p.z));
}

float sdSphere( vec3 p, float s, mat4 invTransform )
{
    vec4 p2 = invTransform*vec4(p.xyz, 1.0);
    return length(p2.xyz)-s;
}
float sdBox( vec3 p, vec3 b ) {
    vec3  di = abs(p) - b;
    float mc = maxcomp(di);
    return min(mc,length(max(di,0.0)));
}

float sdPlane( vec3 p, vec3 n ) {
    return dot(p, n);
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


float sdFields_(vec3 p1, sampler2D u_topTexture, sampler2D u_profileTexture, vec4 u_topBounds, vec4 u_profileBounds, mat4 inverseTransform)
{
    vec4 p2 = inverseTransform * vec4(p1, 1.0);
    vec3 p = p2.xyz;

    float pz = 0.5*(u_profileBounds[3] + u_profileBounds[1]);   
    float sx = 0.5*(u_topBounds[2] - u_topBounds[0]);
    float sy = 0.5*(u_topBounds[3] - u_topBounds[1]);
    float sz = 0.5*(u_profileBounds[3] - u_profileBounds[1]);

    vec3 box = vec3(sx,sy,sz);

    p[2] -= pz;
    float distToBbox = sdBox(p, box);
    if (distToBbox > 0.1)
        return distToBbox;
    p[2] += pz;
        
    float u = (p[0] - u_topBounds[0]) / (u_topBounds[2] - u_topBounds[0]);
    float v = (p[1] - u_topBounds[1]) / (u_topBounds[3] - u_topBounds[1]);
    float d = getFieldDistance(u_topTexture, vec2(u, v));
    
    float u2 = (d - u_profileBounds[0]) / (u_profileBounds[2] - u_profileBounds[0]);
    float v2 = (p[2] - u_profileBounds[1]) / (u_profileBounds[3] - u_profileBounds[1]); 
    float d2 = getFieldDistance(u_profileTexture, vec2(u2, v2));
    
    return d2;
}

