module qec {

    export class hardwareShaderTextFields1 implements ihardwareShaderText
    {
        sd: sdFields1;
        structName = 'sdFields1';

        constructor(sd: sdFields1)
        {
            this.sd = sd;
        }

        declareStruct(declared:any):void
        {
            if (declared[this.structName] == undefined)
            declared[this.structName] = `
                sampler2D topTexture;
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
                        vec2 uv = vec2(
                            (p[0] - ${sd.top.topBounds[0].toFixed(3)}) / (${(sd.top.topBounds[2] - sd.top.topBounds[0]).toFixed(3)}),
                            (p[1] - ${sd.top.topBounds[1].toFixed(3)}) / (${(sd.top.topBounds[3] - sd.top.topBounds[1]).toFixed(3)})
                        );

                        vec2 _uv = clamp(uv, 0.0, 1.0);
                        vec2 uv2 = vec2 (
                                        mix(${sd.top.topSprite.bounds[0].toFixed(3)}, ${sd.top.topSprite.bounds[2].toFixed(3)}, _uv.x),
                                        mix(${sd.top.topSprite.bounds[1].toFixed(3)}, ${sd.top.topSprite.bounds[3].toFixed(3)}, _uv.y)
                        );
                        vec4 textureColor = texture2D(${name}.topTexture, uv2);
                        float d0 = textureColor[0];
                        
                        d = min(d, max(d0, distToBbox));
                        ${assignColor ? 'if (d == d0) { color = '+ name + '.diffuse; }' : ''}
                    }
                }
                
            }
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
                        topTexture: null,
                        boundingBox: new THREE.Vector3()
                    }
                };
                uniforms[`u_sd_${sd.uniqueName}`] = uniform;
            }
            
            uniform.value.diffuse.fromArray(sd.material.diffuse);
            uniform.value.boundingBox.fromArray(sd.boundingBox);
            uniform.value.inverseTransform.fromArray(sd.inverseTransform);
            uniform.value.topTexture = sd.top.topSprite.bigTexture.threeDataTexture;
            /*
            
            let v = new THREE.Vector3();
            v.fromArray(sd.material.diffuse);
            let m = new THREE.Matrix4();
            m.fromArray(sd.inverseTransform);
            let boundingBox = new THREE.Vector3();
            boundingBox.fromArray(sd.boundingBox);

            console.log(v);
            uniforms[`u_sd_${sd.uniqueName}`] = {
                value: {
                    diffuse: v,
                    inverseTransform: m,
                    topTexture: sd.top.topSprite.bigTexture.threeDataTexture,
                    boundingBox: boundingBox
                }
            };
            */
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