
uniform vec3 u_lightPositions[3];
uniform float u_lightIntensities[3];

vec3 getLight(int shadows, vec3 col, vec3 pos, vec3 normal, vec3 rd) { 
    vec3 result = vec3(0.0,0.0,0.0);
    result = result + applyLight(u_lightPositions[0], u_lightIntensities[0], shadows, col, pos, normal, rd);
    result = result + applyLight(u_lightPositions[1], u_lightIntensities[1], shadows, col, pos, normal, rd);
    result = result + applyLight(u_lightPositions[2], u_lightIntensities[2], shadows, col, pos, normal, rd);
    return result;
}
