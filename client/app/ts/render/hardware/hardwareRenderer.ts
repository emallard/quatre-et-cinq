declare var THREE;

module qec {


    export class hardwareRenderer implements irenderer {
        container: HTMLElement;
        rendererCanvas: HTMLCanvasElement;
        width: number;
        height: number;

        gRenderer: any;
        gViewQuad: any;
        gShaderMaterial: any;
        gScene: any;
        gCamera: any;
        cubemap: any;

        fragmentShader = '';

        expl: hardwareSignedDistanceExplorer;
        text: hardwareShaderText;

        setFragmentShader(text: string) {
            this.fragmentShader = text;
            //console.log(text);
        }

        setContainerAndSize(container: HTMLElement, rWidth: number, rHeight: number) {
            this.container = container;
            this.width = rWidth;
            this.height = rHeight;
            console.log("set hardwareRenderer " + rWidth + "," + rHeight);

            this.initTHREE();

            this.expl = new hardwareSignedDistanceExplorer();
            this.text = new hardwareShaderText();

            this.gShaderMaterial.uniforms.u_inverseTransforms = { type: "m4v", value: [] };
            this.gShaderMaterial.uniforms.u_diffuses = { type: "3fv", value: [] };
            this.gShaderMaterial.uniforms.u_floatTextures = { type: "tv", value: [] };
            //this.gShaderMaterial.uniforms.u_topTextureIndex = { type: "fv", value: []};
            //this.gShaderMaterial.uniforms.u_profileTextureIndex = { type: "fv", value: []};
            this.gShaderMaterial.uniforms.u_topTextureSpriteBounds = { type: "4fv", value: [] };
            this.gShaderMaterial.uniforms.u_profileTextureSpriteBounds = { type: "4fv", value: [] };
            this.gShaderMaterial.uniforms.u_topBounds = { type: "4fv", value: [] };
            this.gShaderMaterial.uniforms.u_profileBounds = { type: "4fv", value: [] };
        }

        getViewportWidth(): number {
            return this.width;
        }

        getViewportHeight(): number {
            return this.height;
        }

        getCanvas(): HTMLCanvasElement {
            return this.rendererCanvas;
        }

        showBoundingBox(b: boolean) {

        }

        updateShader(sd: signedDistance, lightCount: number, packer: texturePacker) {
            console.log('hardwareRenderer.updateShader');

            this.expl.explore(sd);
            var generatedPart =
                this.text.generateDistance(this.expl, packer)
                + this.text.generateColor(this.expl);

            var generatedLight = this.text.generateLight(lightCount);

            this.fragmentShader = ''
                + resources.all['app/ts/render/hardware/10_sd.glsl']
                + resources.all['app/ts/render/hardware/11_sdFields.glsl']
                + generatedPart
                + resources.all['app/ts/render/hardware/20_light.glsl']
                + generatedLight
                + resources.all['app/ts/render/hardware/30_renderPixel.glsl'];

            //console.log(generatedPart);
            //console.log(generatedLight);

            this.gViewQuad.material.fragmentShader = this.fragmentShader;
            this.gViewQuad.material.needsUpdate = true;

            this.updateAllUniformsForAll();
            this.updateAllPackedTextures(packer);
        }

        updateAllUniformsForAll() {
            for (var i = 0; i < this.expl.array.length; ++i)
                this.updateAllUniforms(this.expl.array[i].sd);
        }

        updateAllUniforms(sd: signedDistance) {
            this.updateDiffuse(sd);
            this.updateTransform(sd);
            if (sd instanceof sdFields)
                this.updateFloatTextures(sd);
        }

        fakePos = vec3.create();
        inverseTransform = mat4.create();
        updateDiffuse(sd: signedDistance) {
            var hsd = this.expl.getHsd(sd);
            var diffuse = sd.getMaterial(this.fakePos).diffuse;
            if (this.gShaderMaterial.uniforms.u_diffuses.value[hsd.index] == null)
                this.gShaderMaterial.uniforms.u_diffuses.value[hsd.index] = new THREE.Vector3();

            this.gShaderMaterial.uniforms.u_diffuses.value[hsd.index].fromArray(diffuse);
        }

        updateTransform(sd: signedDistance) {
            var hsd = this.expl.getHsd(sd);
            sd.getInverseTransform(this.inverseTransform);

            if (this.gShaderMaterial.uniforms.u_inverseTransforms.value[hsd.index] == null)
                this.gShaderMaterial.uniforms.u_inverseTransforms.value[hsd.index] = new THREE.Matrix4();

            var m = this.gShaderMaterial.uniforms.u_inverseTransforms.value[hsd.index];
            m.fromArray(this.inverseTransform);
        }

        updateFloatTextures(sd: sdFields) {
            var hsd = this.expl.getHsd(sd);

            // bounds
            var topBounds = new THREE.Vector4();
            topBounds.fromArray(sd.topBounds);

            var profileBounds = new THREE.Vector4();
            profileBounds.fromArray(sd.profileBounds);

            this.gShaderMaterial.uniforms.u_topBounds.value[hsd.sdFieldIndex] = topBounds;
            this.gShaderMaterial.uniforms.u_profileBounds.value[hsd.sdFieldIndex] = profileBounds;

            var topSpriteBounds = new THREE.Vector4();
            topSpriteBounds.fromArray(sd.topSpriteBounds);
            var profileSpriteBounds = new THREE.Vector4();
            profileSpriteBounds.fromArray(sd.profileSpriteBounds);

            this.gShaderMaterial.uniforms.u_topTextureSpriteBounds.value[hsd.sdFieldIndex] = topSpriteBounds;
            this.gShaderMaterial.uniforms.u_profileTextureSpriteBounds.value[hsd.sdFieldIndex] = profileSpriteBounds;

            // texture
            // TODO suppr
            /*
            var topDataTexture = new THREE.DataTexture( sd.topTexture.data, sd.topTexture.width, sd.topTexture.height, THREE.RGBAFormat, THREE.FloatType);
            topDataTexture.needsUpdate = true;
            var profileDataTexture = new THREE.DataTexture( sd.profileTexture.data, sd.profileTexture.width, sd.profileTexture.height, THREE.RGBAFormat, THREE.FloatType);
            profileDataTexture.needsUpdate = true;   
            this.gShaderMaterial.uniforms.u_topTextures.value[hsd.sdFieldIndex] = topDataTexture;
            this.gShaderMaterial.uniforms.u_profileTextures.value[hsd.sdFieldIndex] = profileDataTexture;
            */
        }

        updateAllPackedTextures(packer: texturePacker) {
            packer.allBigTextures.forEach((t, i) => {
                var texture = new THREE.DataTexture(t.data, t.width, t.height, THREE.RGBAFormat, THREE.FloatType);
                texture.needsUpdate = true;
                this.gShaderMaterial.uniforms.u_floatTextures.value[i] = texture;
            });
        }

        renderDebug(x: number, y: number, settings: renderSettings) {
            alert('not supported');
        }

        render(settings: renderSettings) {
            var camera = settings.camera;
            var sd = settings.sd;
            camera.rendererInit(this.width, this.height);

            this.gShaderMaterial.uniforms.u_inversePMatrix = { type: "Matrix4fv", value: camera.inversePMatrix },
                this.gShaderMaterial.uniforms.u_inverseTransformMatrix = { type: "Matrix4fv", value: camera.inverseTransformMatrix },
                this.gShaderMaterial.uniforms.u_shadows = { type: "1i", value: settings.shadows ? 1 : 0 }

            if (this.gShaderMaterial.uniforms.u_lightPositions == null) {
                this.gShaderMaterial.uniforms.u_lightPositions = { type: "3fv", value: [] };
                this.gShaderMaterial.uniforms.u_lightIntensities = { type: "1fv", value: [] };
            }

            settings.spotLights.forEach((l, i) => {
                if (this.gShaderMaterial.uniforms.u_lightPositions.value[i] == null) {
                    this.gShaderMaterial.uniforms.u_lightPositions.value[i] = new THREE.Vector3();
                    this.gShaderMaterial.uniforms.u_lightIntensities.value[i] = 0;
                }
                this.gShaderMaterial.uniforms.u_lightPositions.value[i].fromArray(l.position);
                this.gShaderMaterial.uniforms.u_lightIntensities.value[i] = l.intensity;
            })

            this.gRenderer.render(this.gScene, this.gCamera);
        }


        initTHREE() {
            // setup WebGL renderer

            //            this.gRenderer = new THREE.WebGLRenderer(
            //                {/*preserveDrawingBuffer: true*/}
            //            );

            this.rendererCanvas = document.createElement('canvas');
            this.rendererCanvas.id = "hardwareRenderer";
            var context = this.rendererCanvas.getContext('webgl2');
            this.gRenderer = new THREE.WebGLRenderer({ canvas: this.rendererCanvas, context: context });

            this.gRenderer.setSize(this.width, this.height);
            //gRenderer.setClearColorHex(0x000000, 1);

            this.gRenderer.setClearColor(0xffffff, 1);
            this.gRenderer.setPixelRatio(window.devicePixelRatio);
            //gRenderer.autoClear = false;

            //this.container.appendChild(this.gRenderer.domElement);
            this.container.appendChild(this.rendererCanvas);

            // camera to render, orthogonal (fov=0)
            this.gCamera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, -1, 1);

            // scene for rendering
            this.gScene = new THREE.Scene();
            this.gScene.add(this.gCamera);

            // compile shader
            var vertexShader =
                'varying vec2 vUv;' +
                'void main() {vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}';

            var fragmentShader =
                'varying vec2 vUv;' +
                'void main() {gl_FragColor = vec4(vUv[0], vUv[1], 0 , 1);}';

            if (this.fragmentShader) fragmentShader = this.fragmentShader;

            this.gShaderMaterial = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                needsUpdate: true
            });

            // setup plane in scene for rendering
            this.gViewQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 0), this.gShaderMaterial);
            var node = new THREE.Object3D();
            node.add(this.gViewQuad);
            this.gScene.add(node);

            //this.recompileShader();

            // cubemap
            /*
            var texture = new THREE.CubeTexture();
		    var loaded = 0;
            for (var i=0; i<6; ++i)
            {
                texture.images[ i ] = resources.all['data/cubemap/cubemap' + i + '.jpg'];
            }
			texture.needsUpdate = true;
            this.cubemap = texture;
            */
        }
    }

}