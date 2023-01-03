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

        sd: signedDistance[];
        text: hardwareShaderTextUnion;
        textLights: hardwareShaderLights;

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

            this.text = new hardwareShaderTextUnion();
            this.textLights = new hardwareShaderLights();

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

        updateShader(settings: renderSettings) {

            this.sd = (<sdUnion>settings.sd).array;
            this.text.setArray(this.sd);
            this.textLights.setLights(settings.lights);

            console.log('hardwareRenderer.updateShader');

            let generatedPart = '';
            {
                let structs = {};
                this.text.declareStruct(structs);


                for (let t in structs) {
                    generatedPart += `struct ${t} { ${structs[t]} };\n`;
                }

                generatedPart += this.text.declareUniforms() + '\n';
                generatedPart += this.text.generateDist() + '\n';
                if (settings.noColor)
                    generatedPart += `vec3 getColor(vec3 pos, vec3 normal) { return vec3(1.0,1.0,1.0); }`;
                else
                    generatedPart += this.text.generateColor() + '\n';
            }

            let generatedLight = '';
            {
                let structsLight = {};
                this.textLights.declareStruct(structsLight);
                for (let t in structsLight) {
                    generatedPart += `struct ${t} { ${structsLight[t]} };\n`;
                }


                generatedLight += this.textLights.declareUniforms() + '\n';
                generatedLight += this.textLights.generateLight();
            }

            this.fragmentShader = ''
                + resources.all['app/ts/render/hardware/10_sd.glsl']
                + generatedPart
                + resources.all['app/ts/render/hardware/20_light.glsl']
                + generatedLight
                + resources.all['app/ts/render/hardware/30_renderPixel.glsl'];

            console.log(generatedPart);
            console.log(generatedLight);

            this.gViewQuad.material.fragmentShader = this.fragmentShader;
            this.gViewQuad.material.needsUpdate = true;

            this.updateAllUniformsForAll();
        }

        /*
        generateLight(count:number) : string
        {
            var shader = '';
            
            shader += 'vec3 getLight(int shadows, vec3 col, vec3 pos, vec3 normal, vec3 rd) { \n'
            shader += '    vec3 result = vec3(0.0,0.0,0.0);\n'
            for (var i=0; i < count; ++i)
            {
                shader += '    result = result + applyLight(vec3(100.0,-100.0,200.0), 1.0, shadows, col, pos, normal, rd);\n';
            }
            shader += '    return result;\n}\n\n';

            return shader;
        }
        */

        updateAllUniformsForAll() {
            this.text.setUniforms(this.gShaderMaterial.uniforms);
            this.textLights.setUniforms(this.gShaderMaterial.uniforms);
        }

        /*
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
        }

        updateFloatTextures2(sd: sdFields2) {
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
        }

        updateAllPackedTextures(packer: texturePacker) {
            packer.allBigTextures.forEach((t, i) => {
                var texture = new THREE.DataTexture(t.data, t.width, t.height, THREE.RGBAFormat, THREE.FloatType);
                texture.needsUpdate = true;
                this.gShaderMaterial.uniforms.u_floatTextures.value[i] = texture;
            });
        }*/

        renderDebug(x: number, y: number, settings: renderSettings) {
            alert('not supported');
        }

        render(settings: renderSettings) {
            var camera = settings.camera;
            camera.rendererInit(this.width, this.height);

            this.gShaderMaterial.uniforms.u_inversePMatrix = { type: "Matrix4fv", value: camera.inversePMatrix },
                this.gShaderMaterial.uniforms.u_inverseTransformMatrix = { type: "Matrix4fv", value: camera.inverseTransformMatrix },
                this.gShaderMaterial.uniforms.u_shadows = { type: "1i", value: settings.shadows ? 1 : 0 }

            if (this.gShaderMaterial.uniforms.u_lightPositions == null) {
                this.gShaderMaterial.uniforms.u_lightPositions = { type: "3fv", value: [] };
                this.gShaderMaterial.uniforms.u_lightIntensities = { type: "1fv", value: [] };
            }

            this.gRenderer.render(this.gScene, this.gCamera);
        }


        initTHREE() {
            // setup WebGL renderer

            //            this.gRenderer = new THREE.WebGLRenderer(
            //                {/*preserveDrawingBuffer: true*/}
            //            );

            this.rendererCanvas = document.createElement('canvas');
            this.rendererCanvas.id = "hardwareRenderer";
            var context = this.rendererCanvas.getContext('webgl2', { preserveDrawingBuffer: true });
            this.gRenderer = new THREE.WebGLRenderer({ canvas: this.rendererCanvas, context: context });
            this.gRenderer.setSize(this.width, this.height, true);

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
        }

        setDegradation(coef: number) {
            this.gRenderer.setSize(this.width / coef, this.height / coef, false);
            this.rendererCanvas.style.width = '' + this.width + 'px';
            this.rendererCanvas.style.height = '' + this.height + 'px';
        }

        updateAllUniforms(sd: signedDistance) { }
        updateDiffuse(sd: signedDistance) { }
        updateTransform(sd: signedDistance) { }
        updateFloatTextures(sd: sdFields) { }
        updateAllPackedTextures(packer: texturePacker) { }
    }

}