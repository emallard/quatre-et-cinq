module qec {

    export interface ihardwareShaderLight
    {
        declareStruct(declared:any): void;
        declareUniforms(): string;
        generateLight(): string;
        setUniforms(uniforms:any);
    }
}