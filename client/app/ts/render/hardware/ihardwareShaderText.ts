module qec {

    export interface ihardwareShaderText
    {
        declareStruct(declared:any): void;
        declareUniforms(): string;
        generateDist(assignColor:boolean): string;
        setUniforms(uniforms:any);
    }
}