module qec {

    export class cameraControllerCallbacks {
        getCamera: () => camera;
        setRenderFlag: () => void;
        getViewportWidth: () => number;
        getViewportHeight: () => number;
    }
}