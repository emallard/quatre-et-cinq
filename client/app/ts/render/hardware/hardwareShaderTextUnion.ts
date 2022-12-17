module qec {

    export class hardwareShaderTextUnion
    {
        
        inner:ihardwareShaderText[];
        setArray(array:signedDistance[])
        {
            this.inner = array.map(x => 
                {
                    if (x instanceof sdFields1)
                        return new hardwareShaderTextFields1(x);
                    if (x instanceof sdFields2)
                        return new hardwareShaderTextFields2(x);
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

        generateDist(): string
        {
            let txt = `float getDist(vec3 pos) {
                
                float d = 6666.0;
                `;

            for (let sh of this.inner)
            {
                txt += sh.generateDist(false);
            }
            txt += 'return d;}';
            return txt;
        }
        
        generateColor(): string
        {
            let txt = `vec3 getColor(vec3 pos, vec3 normal) {
                float d = 6666.0;
                vec3 color = vec3(1.0,1.0,1.0);
                //vec3 color = normal;
                `;
            /*
            for (let sh of this.inner)
            {
                txt += sh.generateDist(true);
            }
            */
            txt += 'return color;}';
            return txt;
        }
    }
}