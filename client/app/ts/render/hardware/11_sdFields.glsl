
float g_sdFieldsDistCount = 0.0;

/*
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
*/


float getFieldDistanceWithSprite(sampler2D field, vec2 uv, vec4 spriteBounds)
{
    //vec2 _uv = vec2(clamp(uv.x, 0.0, 1.0), clamp(uv.y, 0.0, 1.0));
    vec2 _uv = clamp(uv, 0.0, 1.0);
    vec2 uv2 = vec2 (
                    mix(spriteBounds[0], spriteBounds[2], _uv.x),
                    mix(spriteBounds[1], spriteBounds[3], _uv.y)
    );
    vec4 color = texture2D(field, uv2);
    return color[0];
}

float sdFieldsWithSprites0_(vec3 p1, 
    sampler2D u_topTexture, sampler2D u_profileTexture, 
    vec4 u_topTextureSpriteBounds, vec4 u_profileTextureSpriteBounds,
    vec4 u_topBounds, vec4 u_profileBounds, 
    mat4 inverseTransform)
{
    g_sdFieldsDistCount++;
    vec4 p2 = inverseTransform * vec4(p1, 1.0);
    vec3 p = p2.xyz;

/*
    float pz = 0.5*(u_profileBounds[3] + u_profileBounds[1]);   
    float sx = 0.5*(u_topBounds[2] - u_topBounds[0]);
    float sy = 0.5*(u_topBounds[3] - u_topBounds[1]);
    float sz = 0.5*(u_profileBounds[3] - u_profileBounds[1]);

    vec3 box = vec3(sx,sy,sz);

    p[2] -= pz;
    float distToBbox = sdBox(p, box);
    if (distToBbox > 0.01)
        return distToBbox;
    p[2] += pz;
*/        
    float u = (p[0] - u_topBounds[0]) / (u_topBounds[2] - u_topBounds[0]);
    float v = (p[1] - u_topBounds[1]) / (u_topBounds[3] - u_topBounds[1]);
    float d = getFieldDistanceWithSprite(u_topTexture, vec2(u, v), u_topTextureSpriteBounds);
    
    float u2 = (d - u_profileBounds[0]) / (u_profileBounds[2] - u_profileBounds[0]);
    float v2 = (p[2] - u_profileBounds[1]) / (u_profileBounds[3] - u_profileBounds[1]); 
    float d2 = getFieldDistanceWithSprite(u_profileTexture, vec2(u2, v2), u_profileTextureSpriteBounds);
    
    return d2;
}

float sdFieldsWithSprites1_(vec3 p1, 
    sampler2D u_topTexture, sampler2D u_profileTexture, 
    vec4 u_topTextureSpriteBounds, vec4 u_profileTextureSpriteBounds,
    vec4 u_topBounds, vec4 u_profileBounds, 
    mat4 inverseTransform)
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
    if (distToBbox > 0.01)
        return distToBbox;

    return sdFieldsWithSprites0_(
            p1, u_topTexture, u_profileTexture, 
            u_topTextureSpriteBounds, u_profileTextureSpriteBounds,
            u_topBounds, u_profileBounds, inverseTransform);
}

struct Ray {
    vec3 origin;
    vec3 direction;
    vec3 inv_direction;
    //int sign0;
    //int sign1;
    //int sign2;
};

Ray makeRay(vec3 origin, vec3 direction) {
    Ray ray;
    ray.origin = origin;
    ray.direction = direction;
    ray.inv_direction = vec3(1.0) / direction;
    //ray.sign0 = (ray.inv_direction.x < 0.0) ? 0 : 1;
    //ray.sign1 = (ray.inv_direction.y < 0.0) ? 0 : 1;
    //ray.sign2 = (ray.inv_direction.z < 0.0) ? 0 : 1;
    return ray;
}
/*
struct RayBoxIntersection
{
    vec3 aabbMin;
    vec3 aabbMax; 
    float tmin;
    float tmax;
}

void precalcRayBoxIntersection(Ray ray, int sdIndex, vec4 u_topBounds, vec4 u_profileBounds,)
{
    float sx = 0.5*(u_topBounds[2] - u_topBounds[0]);
    float sy = 0.5*(u_topBounds[3] - u_topBounds[1]);
    aabbMin = vec3(-sx, -sy, u_profileBounds[1]);
    aabbMax = vec3(sx, sy, u_profileBounds[3]);
    
    RayBoxIntersection intersection;
    rayboxIntersection(ray, aabbMin, aabbMax, intersection);
    u_sdRayBoxIntersection[sdIndex] = intersection;
}

void rayboxIntersection(in Ray ray, in vec3 aabbMin, in vec3 aabbMax, out RayBoxIntersection intersection)
{   
    vec3 t1 = (aabbMin - ray.origin) * ray.inv_direction;
    vec3 t2 = (aabbMax - ray.origin) * ray.inv_direction;

    vec3 tmin = min(t1, t2);
    vec3 tmax = max(t1, t2);
    
    float ftmin = max(tmin.x, max(tmin.y, tmin.z));
    float ftmax = min(tmax.x, min(tmax.y, tmax.z));

    intersection.aabbMin = aabbMin;
    intersection.aabbMax = aabbMax;
    intersection.tmin = ftMin;
    intersection.tmax = ftMax;
}*/


float rayboxIntersection(in Ray ray, in vec3 aabbMin, in vec3 aabbMax)
{  
    vec3 t1 = (aabbMin - ray.origin) * ray.inv_direction;
    vec3 t2 = (aabbMax - ray.origin) * ray.inv_direction;

    vec3 tmin = min(t1, t2);
    vec3 tmax = max(t1, t2);
    
    float ftmin = max(tmin.x, max(tmin.y, tmin.z));
    float ftmax = min(tmax.x, min(tmax.y, tmax.z));

    if (ftmin > ftmax)
        return 10000.0;
    return ftmin;
}


void sdFieldsGetBoundingBox(vec4 u_topBounds, vec4 u_profileBounds, out vec3 aabbMin, out vec3 aabbMax)
{
    float sx = 0.5*(u_topBounds[2] - u_topBounds[0]);
    float sy = 0.5*(u_topBounds[3] - u_topBounds[1]);
    aabbMin = vec3(-sx, -sy, u_profileBounds[1]);
    aabbMax = vec3(sx, sy, u_profileBounds[3]);
}

float sdFieldsWithSprites2_(vec3 p1, vec3 rd, 
    sampler2D u_topTexture, sampler2D u_profileTexture, 
    vec4 u_topTextureSpriteBounds, vec4 u_profileTextureSpriteBounds,
    vec4 u_topBounds, vec4 u_profileBounds, 
    mat4 inverseTransform)
{
    vec4 p2 = inverseTransform * vec4(p1, 1.0);
    vec3 p = p2.xyz;
    // TODO transform rd.
    Ray ray = makeRay(p, rd);

    vec3 aabbMin;
    vec3 aabbMax;
    sdFieldsGetBoundingBox(u_topBounds, u_profileBounds, aabbMin, aabbMax);
    float t = rayboxIntersection(ray, aabbMin, aabbMax);
    if (t <= 0.01)
        return sdFieldsWithSprites0_(
            p1, u_topTexture, u_profileTexture, 
            u_topTextureSpriteBounds, u_profileTextureSpriteBounds,
            u_topBounds, u_profileBounds, inverseTransform);
    
    //g_sdFieldsDistCount++;
    return t;
}