module qec 
{
    export interface irenderer
    {
        setContainerAndSize(element:HTMLElement, rWidth:number, rHeight:number);

        renderDebug(x:number, y:number, settings: renderSettings);

        render(settings: renderSettings);

        getCanvas():HTMLCanvasElement;

        showBoundingBox(b:boolean);

        updateShader(sd:signedDistance, lightCount:number);
        updateAllUniformsForAll();
        updateAllUniforms(sd: signedDistance);
        updateDiffuse(sd: signedDistance);
        updateTransform(sd: signedDistance);
        updateFloatTextures(sd: sdFields);
    }
}