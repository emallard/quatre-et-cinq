module qec {

    export class hardwareShaderTextFields2 implements ihardwareShaderText
    {
        sd: sdFields2;
        structName = 'sdFields2';

        constructor(sd: sdFields2)
        {
            this.sd = sd;
        }

        declareStruct(declared:any):void
        {
            
            if (declared[this.structName] == undefined)
            declared[this.structName] = `
                sampler2D topTexture;
                sampler2D profileTexture;
                mat4 inverseTransform;
                vec3 diffuse;
                vec3 boundingBox;
            `;           
        }

        declareUniforms(): string
        {
            return `uniform ${this.structName} u_sd_${this.sd.uniqueName};`
        }

        generateDist(assignColor:boolean): string
        {
            let sd = this.sd;
            let name = `u_sd_${sd.uniqueName}`;
            return `
            {
                vec4 p = ${name}.inverseTransform * vec4(pos, 1.0);

                vec3 p2 = vec3(p.x, p.y, p.z - ${name}.boundingBox[2]);
                float distToBbox = sdBox(p2, ${name}.boundingBox);
                
                if (distToBbox < d)
                {
                if (distToBbox > 2.0)
                {
                    d = min(d, distToBbox);
                }
                else
                {
                    ${this.getDistTop(name+'.topTexture', sd.top, 'd0')}

                    float originToPointX = p[0]-(${sd.profileOrigin[0].toFixed(3)});
                    float originToPointY = p[1]-(${sd.profileOrigin[1].toFixed(3)});

                    // Axis:
                    float dotProduct = originToPointX*(${sd.profileAxis[0].toFixed(3)}) + originToPointY*(${sd.profileAxis[1].toFixed(3)});
                    ${this.getDistProfile(name+'.profileTexture', sd.profile, 'dotProduct', 'd1')};

                    float previousD = d;
                    d = min(d, max(d0, max(d1, distToBbox)));
                    ${assignColor ? 'if (d != previousD) { color = '+ name + '.diffuse; }' : ''}
                }
                }
            }
            `;
        }

        getDistTop(texture:string, top:partTop, distanceVar:string):string
        {
            return `
            vec2 uvTop = vec2(
                (p[0] - ${top.topBounds[0].toFixed(3)}) / (${(top.topBounds[2] - top.topBounds[0]).toFixed(3)}),
                (p[1] - ${top.topBounds[1].toFixed(3)}) / (${(top.topBounds[3] - top.topBounds[1]).toFixed(3)})
            );
            ${this.getFieldDistanceWithSprite(texture, 'uvTop', top.topSprite.bounds, distanceVar)}
            `;
        }

        getDistProfile(texture:string, profile:partProfile, length:string, distanceVar:string): string
        {
            return `
                vec2 uvProfile = vec2(
                    (${length} - ${profile.profileBounds[0].toFixed(3)}) / ${(profile.profileBounds[2] - profile.profileBounds[0]).toFixed(3)},
                    (p[2] - ${profile.profileBounds[1].toFixed(3)}) / ${(profile.profileBounds[3] - profile.profileBounds[1]).toFixed(3)}
                );
                ${this.getFieldDistanceWithSprite(texture, 'uvProfile', profile.profileSprite.bounds, distanceVar)}
            `;
        }

        getFieldDistanceWithSprite(texture:string, uv:string, spriteBounds:Float32Array, distanceVar:string): string
        {
            return `
            ${uv} = clamp(${uv}, 0.0, 1.0);

            ${uv} = vec2 (
                mix(${spriteBounds[0].toFixed(3)}, ${spriteBounds[2].toFixed(3)}, ${uv}.x),
                mix(${spriteBounds[1].toFixed(3)}, ${spriteBounds[3].toFixed(3)}, ${uv}.y)
            );
            vec4 ${distanceVar}textureColor = texture2D(${texture}, clamp(${uv}, 0.0, 1.0));
            float ${distanceVar} = ${distanceVar}textureColor[0];
            `;
        }

        setUniforms(uniforms:any)
        {
            let sd = this.sd;
            
            let uniform = uniforms[`u_sd_${sd.uniqueName}`];
            if (uniform == undefined)
            {
                uniform = {
                    value: {
                        diffuse: new THREE.Vector3(),
                        inverseTransform: new THREE.Matrix4(),
                        boundingBox: new THREE.Vector3(),
                        topTexture: null,
                        profileTexture: null,
                    }
                };
                uniforms[`u_sd_${sd.uniqueName}`] = uniform;
            }
            
            uniform.value.diffuse.fromArray(sd.material.diffuse);
            uniform.value.boundingBox.fromArray(sd.boundingBox);
            uniform.value.inverseTransform.fromArray(sd.inverseTransform);
            uniform.value.topTexture = sd.top.topSprite.bigTexture.threeDataTexture;
            uniform.value.profileTexture = sd.profile.profileSprite.bigTexture.threeDataTexture;

            //console.log(uniforms[`u_sd_${sd.uniqueName}`]);

            //uniforms[`u_sd_${sd.uniqueName}.diffuse`] = v;
            //uniforms[`u_sd_${sd.uniqueName}.inverseTransform`] = m;
            //uniforms[`u_sd_${sd.uniqueName}.topTexture`] = sd.topSprite.bigTexture.threeDataTexture;
            //uniforms[`u_sd_${sd.uniqueName}.boundingBox`] = boundingBox;

            //uniforms[`u_sd_${sd.uniqueName}.topSpriteBounds`] =  sd.topSprite.bounds;
            //uniforms[`u_sd_${sd.uniqueName}.topBounds`] = sd.topBounds;
        }
    }
}