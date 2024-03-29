module qec {
    export interface irenderer {
        setContainerAndSize(element: HTMLElement, rWidth: number, rHeight: number);

        renderDebug(x: number, y: number, settings: renderSettings);

        render(settings: renderSettings);

        getCanvas(): HTMLCanvasElement;
        getViewportWidth(): number;
        getViewportHeight(): number;

        showBoundingBox(b: boolean);

        updateShader(settings: renderSettings);
        updateAllUniformsForAll();

        // TODO remove

        updateAllUniforms(sd: signedDistance);
        updateDiffuse(sd: signedDistance);
        updateTransform(sd: signedDistance);
        updateFloatTextures(sd: sdFields);
        updateAllPackedTextures(packer: texturePacker);

    }
}