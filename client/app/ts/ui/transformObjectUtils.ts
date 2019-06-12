module qec {

    export class transformObjectUtils {

        editor: editor = inject(qec.editor);
        tmpObjectTransform = mat4.create();

        getMoveHandleScreenCoordinates(out: Float32Array, selected: editorObject) {

            var bounds = selected.top.totalBounds;
            mat4.invert(this.tmpObjectTransform, selected.inverseTransform);


            var camera = this.editor.getCamera();
            vec3.set(out,
                0.5 * (bounds[2] + bounds[0]),
                0.5 * (bounds[3] + bounds[1]),
                0.5 * (selected.profileBounds[3] + selected.profileBounds[1]));
            camera.getScreenPositionPreTransform(out, out, this.tmpObjectTransform);

        }

    }
}