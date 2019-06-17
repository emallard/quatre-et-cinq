module qec {

    export class transformObjectUtils {

        editor: editor = inject(qec.editor);
        tmpObjectTransform = mat4.create();

        getMoveHandleScreenCoordinates(out: Float32Array, selected: editorObject) {

            var camera = this.editor.getCamera();
            selected.getAbsoluteBottomCenter(out);
            camera.getScreenPosition(out, out);
        }

        getScaleTopHandleScreenCoordinates(out: Float32Array, selected: editorObject) {

            var camera = this.editor.getCamera();
            selected.getAbsoluteTopCenter(out);
            camera.getScreenPosition(out, out);
        }

    }
}