module qec {

    export class hardwareShaderLights
    {
        inner: ihardwareShaderLight[]

        setLights(lights: ilight[])
        {
            this.inner = lights.map(x => 
                {
                    if (x instanceof directionalLight)
                        return new hardwareShaderDirectionalLight(x);
                    if (x instanceof spotLight)
                        return new hardwareShaderSpotLight(x);
                    return null;
                });
        }

        declareStruct(declared:any):void
        {
            for (let sh of this.inner)
                sh.declareStruct(declared);
        }

        declareUniforms(): string
        {
            let txt = '';
            for (let sh of this.inner)
                txt += sh.declareUniforms();
            return txt;
        }

        setUniforms(uniforms:any)
        {
            for (let sh of this.inner)
                sh.setUniforms(uniforms);
        }

        generateLight(): string
        {
            let txt = `vec3 getLight(int shadows, vec3 col, vec3 pos, vec3 normal, vec3 rd) 
            {  
                vec3 result = vec3(0.0, 0.0, 0.0);
                `;

            for (let sh of this.inner)
            {
                txt += sh.generateLight();
            }
            txt += 'return result;}';
            return txt;
        }
    }
}