module qec {

    export class hardwareShaderSpotLight implements ihardwareShaderLight
    {
        light: spotLight;
        structName = 'lightSpot';

        constructor(light: spotLight)
        {
            this.light = light;
        }

        declareStruct(declared:any):void
        {
            if (declared[this.structName] == undefined)
            declared[this.structName] = `
                vec3 position;
                float intensity;
            `;           
        }

        declareUniforms(): string
        {
            return `uniform ${this.structName} u_light_${this.light.uniqueName};`
        }

        generateLight(): string
        {
            let name = `u_light_${this.light.uniqueName}`;
            let KD = 0.7;
            let KS = 0.5;
            return `
            {
                vec3 toLight = normalize(${name}.position - pos);
                float diffuse = ${name}.intensity * getDiffuse(pos, normal, toLight);
                float specular = ${name}.intensity * getSpecular(pos, normal, toLight, rd);
                result += ${KS}*specular + ${KD}*diffuse * col;
            }
            `
        }

        setUniforms(uniforms:any)
        {
            let v = new THREE.Vector3();
            v.fromArray(this.light.position);
            
            uniforms[`u_light_${this.light.uniqueName}`] = {
                value: {
                    intensity: this.light.intensity,
                    position: v
                }
            };

            //console.log(uniforms[`u_sd_${sd.uniqueName}`]);
        }
    }
}