
module qec {
    export function glsl_sd(): string {
        return `

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

float sdGrid(vec3 p, vec3 size, float thickness) {
    vec3 d = 0.5*size - abs(mod(p, size) - 0.5*size);
    //vec3 d = abs(floor((p + size*0.5)/size));
    float dMin = min(d[0], min(d[1], d[2]));
    return dMin - thickness;
}

/* OPERATIONS */
float opU( float d1, float d2 )
{
    return min(d1,d2);
}
float opS( float d1, float d2 )
{
    return max(d1,-d2);
}
float opI( float d1, float d2 )
{
    return max(d1,d2);
}

float opBorder(float d1, float thickness)
{
    return (d1 < 0.0) ? -d1 - thickness : d1;
}

`
    }
}
