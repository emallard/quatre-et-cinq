var qec;
(function (qec) {
    var bsplineDrawer = (function () {
        function bsplineDrawer() {
        }
        bsplineDrawer.prototype.drawSpline = function (pts, canv) {
            var ctx = canv.getContext('2d');
            //ctx.clearRect(0,0,canv.width,canv.height);
            if (pts.length == 0) {
                return;
            }
            var spline = new qec.bspline();
            spline.setPoints(pts, 3, true);
            ctx.beginPath();
            var oldx, oldy, x, y;
            oldx = spline.calcAt(0)[0];
            oldy = spline.calcAt(0)[1];
            ctx.moveTo(oldx, oldy);
            for (var t = 0; t <= 1; t += 0.001) {
                var interpol = spline.calcAt(t);
                x = interpol[0];
                y = interpol[1];
                ctx.lineTo(x, y);
                oldx = x;
                oldy = y;
            }
            oldx = spline.calcAt(0)[0];
            oldy = spline.calcAt(0)[1];
            ctx.lineTo(oldx, oldy);
            ctx.fill();
            ctx.closePath();
        };
        return bsplineDrawer;
    }());
    qec.bsplineDrawer = bsplineDrawer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var editor = (function () {
        function editor() {
            var _this = this;
            this.simpleRenderer = new qec.simpleRenderer();
            this.hardwareRenderer = new qec.hardwareRenderer();
            this.renderSettings = new qec.renderSettings();
            this.showBoundingBox = false;
            this.sdUnion = new qec.sdUnion();
            this.sdGround = new qec.sdBox();
            this.editorObjects = [];
            this.selectedIndex = -1;
            this.rimLight = new qec.spotLight();
            this.keyLight = new qec.spotLight();
            this.fillLight = new qec.spotLight();
            this.helper = new qec.svgHelper();
            this.svgAutoHeightHelper = qec.injectNew(qec.svgAutoHeightHelper);
            this.renderFlag = false;
            this.updateFlag = false;
            this.exportSTL = qec.inject(qec.exportSTL);
            this.container = ko.observable();
            this.indexObject = 0;
            this.container.subscribe(function () { return _this.init(_this.container()); });
        }
        editor.prototype.init = function (containerElt) {
            var simple = false;
            this.simpleRenderer = new qec.simpleRenderer();
            this.simpleRenderer.setContainerAndSize(containerElt, 300, 300);
            this.simpleRenderer.canvas.style.display = 'none';
            this.hardwareRenderer = new qec.hardwareRenderer();
            this.hardwareRenderer.setContainerAndSize(containerElt, 800, 600);
            this.setSimpleRenderer(simple);
            this.renderSettings.camera.setCam(vec3.fromValues(0, -1, 3), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 1));
            /*
            keyLight.createFrom({
                type: 'directionalLightDTO',
                position: [-2, -2, 0],
                direction : [1, 1, -2],
                intensity : 0.8
            });

            fillLight.createFrom({
                type: 'directionalLightDTO',
                position: [2, -2, 0],
                direction : [-1, 1, -1],
                intensity : 0.2
            });
            */
            this.rimLight.createFrom({
                type: 'spotLightDTO',
                position: [2, 2, 0.5],
                direction: [-1, -1, 0.1],
                intensity: 0.2
            });
            this.keyLight.createFrom({
                type: 'spotLightDTO',
                position: [-1, -1, 5],
                direction: [0, 0, 0],
                intensity: 0.8
            });
            this.fillLight.createFrom({
                type: 'spotLightDTO',
                position: [2, -2, 0.5],
                direction: [-1, 1, -1],
                intensity: 0.2
            });
            //this.renderSettings.directionalLights.push(keyLight);//, fillLight);
            this.renderSettings.spotLights.push(this.keyLight, this.fillLight, this.rimLight);
            this.sdGround = new qec.sdBox();
            this.sdGround.getMaterial(null).setDiffuse(0.8, 0.8, 0.8);
            this.sdGround.setHalfSize(2, 2, 0.01);
        };
        editor.prototype.setSelectedIndex = function (index) {
            var _this = this;
            this.selectedIndex = index;
            this.editorObjects.forEach(function (o, i) {
                o.setSelected(i == index);
                _this.renderer.updateDiffuse(o.sd);
            });
            this.setRenderFlag();
        };
        editor.prototype.getCamera = function () {
            return this.renderSettings.camera;
        };
        editor.prototype.toggleSimpleRenderer = function () {
            this.setSimpleRenderer(this.renderer != this.simpleRenderer);
            this.setRenderFlag();
        };
        editor.prototype.setSimpleRenderer = function (simple) {
            if (simple) {
                this.renderer = this.simpleRenderer;
                this.simpleRenderer.getCanvas().style.display = 'block';
                this.hardwareRenderer.getCanvas().style.display = 'none';
            }
            else {
                this.renderer = this.hardwareRenderer;
                this.simpleRenderer.getCanvas().style.display = 'none';
                this.hardwareRenderer.getCanvas().style.display = 'block';
            }
        };
        editor.prototype.toggleShowBoundingBox = function () {
            this.showBoundingBox = !this.showBoundingBox;
            this.renderer.showBoundingBox(this.showBoundingBox);
            this.setRenderFlag();
        };
        editor.prototype.toggleGroundOrientation = function () {
            if (this.sdGround.halfSize[0] < 0.02)
                this.sdGround.setHalfSize(2, 0.01, 2);
            else if (this.sdGround.halfSize[1] < 0.02)
                this.sdGround.setHalfSize(2, 2, 0.01);
            else if (this.sdGround.halfSize[2] < 0.02)
                this.sdGround.setHalfSize(0.01, 2, 2);
            this.setRenderFlag();
        };
        editor.prototype.importSvg = function (content, done) {
            var _this = this;
            this.originalSvgContent = content;
            this.svgAutoHeightHelper.setSvg(content, function () {
                _this.helper.setSvg(content, function () { return _this.nextImport(done); });
            });
        };
        editor.prototype.nextImport = function (done) {
            var _this = this;
            //var eltCount = 1; 
            var eltCount = this.helper.getElementsId().length;
            if (this.indexObject < eltCount) {
                var id = this.helper.getElementsId()[this.indexObject];
                console.log(id);
                this.helper.drawOnly(id, function () {
                    var autoHeight = _this.svgAutoHeightHelper.valueForIds[id];
                    _this.afterDraw(autoHeight * 0.05);
                    _this.nextImport(done);
                });
                this.indexObject++;
            }
            else {
                this.setUpdateFlag();
                done();
            }
        };
        editor.prototype.afterDraw = function (autoHeight) {
            //$('.debug').append(this.helper.canvas);
            //$('.debug').append(this.helper.canvas2);
            this.helper.setRealSizeToFit(vec2.fromValues(1, 1));
            var size = this.helper.getBoundingRealSize();
            var center = this.helper.getRealCenter();
            //console.log('size :' , size, 'center', center, 'autoHeight', autoHeight);
            var l = new qec.editorObject();
            this.editorObjects.push(l);
            l.setTopImg2(this.helper.canvas2, vec4.fromValues(-0.5 * size[0], -0.5 * size[1], 0.5 * size[0], 0.5 * size[1]));
            l.setProfileHeight(autoHeight);
            l.setDiffuseColor(this.helper.getColor());
            mat4.identity(l.inverseTransform);
            mat4.translate(l.inverseTransform, l.inverseTransform, vec3.fromValues(center[0], center[1], 0));
            mat4.invert(l.inverseTransform, l.inverseTransform);
            l.updateSignedDistance();
            //l.top.debugInfoInCanvas();
            //$('.debug').append(l.profile.canvas);
        };
        editor.prototype.updateScene = function () {
            // update scene
            this.sdUnion.array = [this.sdGround];
            for (var i = 0; i < this.editorObjects.length; ++i) {
                this.sdUnion.array.push(this.editorObjects[i].sd);
            }
            this.renderSettings.sd = this.sdUnion;
            this.renderer.updateShader(this.sdUnion, this.renderSettings.spotLights.length);
        };
        editor.prototype.render = function () {
            if (this.renderer == null)
                return;
            this.renderSettings.sd = this.sdUnion;
            //console.log("render");
            this.renderer.render(this.renderSettings);
            //this.renderer.renderDebug(100, 100, this.rp, this.cam);
        };
        editor.prototype.updateLoop = function () {
            if (this.updateFlag) {
                this.updateScene();
                this.updateFlag = false;
                this.renderFlag = true;
            }
            if (this.renderFlag) {
                this.renderFlag = false;
                this.render();
            }
        };
        editor.prototype.setRenderFlag = function () {
            this.renderFlag = true;
        };
        editor.prototype.setUpdateFlag = function () {
            this.updateFlag = true;
        };
        /*
        setDiffuse(i:number, r:number, g:number, b:number)
        {
            this.editorObjects[i].sd.getMaterial(null).setDiffuse(r, g, b);
            var sd = this.editorObjects[i].sd;
            if (this.renderer instanceof hardwareRenderer)
                (<hardwareRenderer> this.renderer).updateDiffuse(sd);
        }*/
        editor.prototype.getAllSd = function () {
            return this.editorObjects.map(function (l) { return l.sd; });
        };
        editor.prototype.toggleShadows = function () {
            this.renderSettings.shadows = !this.renderSettings.shadows;
            this.setRenderFlag();
        };
        editor.prototype.computeSTL = function () {
            return this.exportSTL.compute(this.getAllSd());
        };
        editor.prototype.light1 = function () {
            this.keyLight.intensity = 0.8;
            this.fillLight.intensity = 0.2;
            this.rimLight.intensity = 0.2;
            this.setRenderFlag();
        };
        editor.prototype.light2 = function () {
            this.keyLight.intensity = 0;
            this.fillLight.intensity = 0.5;
            this.rimLight.intensity = 0.5;
            this.setRenderFlag();
        };
        return editor;
    }());
    qec.editor = editor;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var editorObject = (function () {
        function editorObject() {
            //canvas = document.createElement('canvas');
            this.sd = new qec.sdFields();
            this.top = new qec.distanceFieldCanvas();
            this.profile = new qec.distanceFieldCanvas();
            this.diffuseColor = vec3.create();
            this.inverseTransform = mat4.create();
            this.bsplineDrawer = new qec.bsplineDrawer();
            this.lineDrawer = new qec.lineDrawer();
            this.profilePoints = [];
            this.profileBounds = vec4.create();
            this.tmpProfileCanvas = document.createElement('canvas');
            this.profileSmooth = true;
            // default profile
            vec4.set(this.profileBounds, -0.2, 0, 0, 0.5);
            this.profilePoints = [[-0.2, 0], [-0.1, 0], [0, 0], [0, 0.1], [0, 0.2], [0, 0.3], [0, 0.4], [0, 0.5], [-0.1, 0.5], [-0.2, 0.5]];
            //this.profile.canvas.style.border = 'solid 1px red';
            //$('.debug').append(this.profile.canvas);    
        }
        editorObject.prototype.setDiffuseColor = function (rgb) {
            vec3.set(this.diffuseColor, rgb[0], rgb[1], rgb[2]);
            this.sd.material.setDiffuse(rgb[0], rgb[1], rgb[2]);
        };
        editorObject.prototype.setSelected = function (b) {
            if (b)
                this.sd.material.setDiffuse(1, 0, 0);
            else
                this.sd.material.setDiffuse(this.diffuseColor[0], this.diffuseColor[1], this.diffuseColor[2]);
        };
        editorObject.prototype.setProfileHeight = function (height) {
            var newBounds = vec4.fromValues(-this.top.distanceField.maxDepth, 0, 0, height);
            //var newBounds = vec4.fromValues(this.profileBounds[0],this.profileBounds[1],this.profileBounds[2], height);
            this.scaleProfilePoints(newBounds);
        };
        editorObject.prototype.scaleProfilePoints = function (newBounds) {
            //console.log('new bounds : ' + vec4.str(newBounds));
            for (var i = 0; i < this.profilePoints.length; ++i) {
                var dx = (this.profilePoints[i][0] - this.profileBounds[0]) / (this.profileBounds[2] - this.profileBounds[0]);
                var dy = (this.profilePoints[i][1] - this.profileBounds[1]) / (this.profileBounds[3] - this.profileBounds[1]);
                this.profilePoints[i][0] = newBounds[0] + dx * (newBounds[2] - newBounds[0]);
                this.profilePoints[i][1] = newBounds[1] + dy * (newBounds[3] - newBounds[1]);
            }
            vec4.copy(this.profileBounds, newBounds);
            this.setProfilePoints(this.profilePoints);
        };
        editorObject.prototype.setProfilePoints = function (points) {
            /*
            console.log('setProfilePoints');
            console.log('profileBounds ' + vec4.str(this.profileBounds));
            console.log('profilePoints ' + JSON.stringify(this.profilePoints));
            */
            this.profilePoints = points;
            // update canvas width and height
            var boundW = this.profileBounds[2] - this.profileBounds[0];
            var boundH = this.profileBounds[3] - this.profileBounds[1];
            var canvasWidth = 400;
            var canvasHeight = 400;
            if (boundH > boundW)
                canvasWidth = canvasHeight * boundW / boundH;
            else
                canvasHeight = canvasWidth * boundH / boundW;
            this.tmpProfileCanvas.width = canvasWidth;
            this.tmpProfileCanvas.height = canvasHeight;
            var ctx = this.tmpProfileCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.tmpProfileCanvas.width, this.tmpProfileCanvas.height);
            // convert profile points to pixels
            var canvasPoints = [];
            var profileBounds = this.profileBounds;
            for (var j = 0; j < this.profilePoints.length; ++j) {
                var x = this.profilePoints[j][0];
                var y = this.profilePoints[j][1];
                var px = (x - profileBounds[0]) / (profileBounds[2] - profileBounds[0]) * this.tmpProfileCanvas.width;
                var py = this.tmpProfileCanvas.height - (y - profileBounds[1]) / (profileBounds[3] - profileBounds[1]) * this.tmpProfileCanvas.height;
                canvasPoints.push([px, py]);
            }
            // draw bspline
            if (this.profileSmooth)
                this.bsplineDrawer.drawSpline(canvasPoints, this.tmpProfileCanvas);
            else
                this.lineDrawer.drawLine(canvasPoints, this.tmpProfileCanvas);
            // draw for distance field
            this.profile.drawUserCanvasForProfile(this.tmpProfileCanvas, this.profileBounds, 0.1);
            this.profile.update();
        };
        editorObject.prototype.setTopSrc = function (src, bounds, done) {
            var _this = this;
            var img = new Image();
            img.onload = function () {
                _this.setTopImg2(img, bounds);
                done();
            };
            img.src = src;
        };
        editorObject.prototype.setTopImg2 = function (img, bounds) {
            this.top.drawUserCanvasForTop(img, bounds, 0.1);
            this.top.update();
            //$('.debug').append(this.top.canvas);
            //this.profile.debugInfoInCanvas();
            //$(".debug")[0].appendChild(this.profile.canvas);
        };
        editorObject.prototype.updateSignedDistance = function () {
            this.sd.init(this.top.floatTexture, this.top.totalBounds, this.profile.floatTexture, this.profile.totalBounds);
            mat4.copy(this.sd.inverseTransform, this.inverseTransform);
        };
        return editorObject;
    }());
    qec.editorObject = editorObject;
})(qec || (qec = {}));
var qec;
(function (qec) {
    // https://gist.githubusercontent.com/paulkaplan/6d5f0ab2c7e8fdc68a61/raw/6bde174e27ae21905d871af3ef9fa3143919079f/binary_stl_writer.js
    var exportSTL = (function () {
        function exportSTL() {
            this.icount = 70;
            this.jcount = 70;
            this.kcount = 70;
        }
        exportSTL.prototype.compute = function (sds) {
            this.densities = new Float32Array(this.icount * this.jcount * this.kcount);
            //var diffuses = new Float32Array(3*100*100*50);
            var sdUni = new qec.sdUnion();
            sds.forEach(function (x) { return sdUni.array.push(x); });
            var pos = vec3.create();
            var bounds = new Float32Array(6);
            var diffuse = vec3.create();
            var tmpMat = mat4.create();
            var min = vec3.create();
            var max = vec3.create();
            for (var s = 0; s < sds.length; ++s) {
                var sd = sds[s];
                var bchs = sd.boundingCenterAndHalfSize;
                sd.getInverseTransform(tmpMat);
                mat4.invert(tmpMat, tmpMat);
                vec3.set(min, bchs[0] - bchs[4], bchs[1] - bchs[4], bchs[2] - bchs[5]);
                vec3.set(max, bchs[0] + bchs[4], bchs[1] + bchs[4], bchs[2] + bchs[5]);
                vec3.transformMat4(min, min, tmpMat);
                vec3.transformMat4(max, max, tmpMat);
                for (var b = 0; b < 3; ++b) {
                    bounds[b] = Math.min(min[b], bounds[b]);
                    bounds[3 + b] = Math.max(max[b], bounds[3 + b]);
                }
            }
            console.log('export bounding box : ' + float32ArrayToString(bounds));
            //return "";
            for (var i = 0; i < this.icount; ++i) {
                console.log('' + i + '/' + (this.icount - 1));
                var ri = i / (this.icount - 1);
                for (var j = 0; j < this.jcount; ++j) {
                    var rj = j / (this.jcount - 1);
                    for (var k = 0; k < this.kcount; ++k) {
                        var rk = k / (this.kcount - 1);
                        pos[0] = (1 - ri) * bounds[0] + ri * bounds[3];
                        pos[1] = (1 - rj) * bounds[1] + rj * bounds[4];
                        pos[2] = (1 - rk) * bounds[2] + rk * bounds[5];
                        var d = sdUni.getDist(pos, false, false);
                        //sd.getMaterial(pos).getColor(diffuse);
                        var q = this.getq(i, j, k);
                        this.densities[q] = d;
                    }
                }
            }
            //console.log(densities[this.getq(5,5,5)] + '=' + d.toFixed(3));
            var stl = "solid blablabla\n";
            var mc = new marchingCubes();
            var nn = vec3.fromValues(1, 0, 0);
            var bsx = (bounds[3] - bounds[0]) / (this.icount - 1);
            var bsy = (bounds[4] - bounds[1]) / (this.jcount - 1);
            var bsz = (bounds[5] - bounds[2]) / (this.kcount - 1);
            for (var i = 0; i < this.icount - 1; ++i) {
                console.log('' + i + '/' + (this.icount - 1));
                for (var j = 0; j < this.jcount - 1; ++j) {
                    for (var k = 0; k < this.kcount - 1; ++k) {
                        var q1 = this.getq(i, j, k);
                        var q2 = this.getq(i + 1, j, k);
                        var q3 = this.getq(i, j + 1, k);
                        var q4 = this.getq(i + 1, j + 1, k);
                        var q5 = this.getq(i, j, k + 1);
                        var q6 = this.getq(i + 1, j, k + 1);
                        var q7 = this.getq(i, j + 1, k + 1);
                        var q8 = this.getq(i + 1, j + 1, k + 1);
                        mc.polygonize(this.densities[q1], this.densities[q2], this.densities[q3], this.densities[q4], this.densities[q5], this.densities[q6], this.densities[q7], this.densities[q8], nn, nn, nn, nn, nn, nn, nn, nn, 0);
                        for (var pi = 0; pi < mc.posArrayLength;) {
                            stl += ("facet normal 0 0 0\n");
                            stl += ("outer loop \n");
                            stl += "vertex " + bsx * (i + mc.posArray[pi++]) + " " + bsy * (j + mc.posArray[pi++]) + " " + bsz * (k + mc.posArray[pi++]) + '\n';
                            stl += "vertex " + bsx * (i + mc.posArray[pi++]) + " " + bsy * (j + mc.posArray[pi++]) + " " + bsz * (k + mc.posArray[pi++]) + '\n';
                            stl += "vertex " + bsx * (i + mc.posArray[pi++]) + " " + bsy * (j + mc.posArray[pi++]) + " " + bsz * (k + mc.posArray[pi++]) + '\n';
                            stl += ("endloop \n");
                            stl += ("endfacet \n");
                        }
                    }
                }
            }
            stl += "endsolid";
            return stl;
        };
        exportSTL.prototype.getq = function (i, j, k) {
            return i + j * this.icount + k * this.icount * this.jcount;
        };
        return exportSTL;
    }());
    qec.exportSTL = exportSTL;
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
    var marchingCubes = (function () {
        function marchingCubes() {
            this.posArray = new Float32Array(1000);
            this.posArrayLength = 0;
            this.normalArray = new Float32Array(1000);
            this.normalArrayLength = 0;
            this.vlist = new Float32Array(12 * 3);
            this.nlist = new Float32Array(12 * 3);
            this.edgeTable = new Int32Array([
                0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
                0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
                0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
                0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
                0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c,
                0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
                0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac,
                0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
                0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c,
                0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
                0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc,
                0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
                0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c,
                0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
                0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc,
                0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
                0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
                0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
                0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
                0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
                0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
                0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
                0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
                0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
                0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
                0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
                0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
                0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
                0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
                0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
                0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
                0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
            ]);
            this.triTable = new Int32Array([
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
                3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
                3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
                3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
                9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1,
                9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
                2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1,
                8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1,
                9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
                4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1,
                3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1,
                1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1,
                4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1,
                4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1,
                9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
                5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1,
                2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1,
                9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
                0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
                2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1,
                10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
                4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1,
                5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1,
                5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1,
                9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1,
                0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1,
                1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1,
                10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1,
                8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1,
                2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1,
                7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1,
                9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1,
                2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1,
                11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1,
                9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1,
                5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1,
                11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1,
                11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
                1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1,
                9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1,
                5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1,
                2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
                0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
                5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1,
                6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1,
                3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1,
                6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1,
                5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1,
                1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
                10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1,
                6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1,
                8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1,
                7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1,
                3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
                5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1,
                0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1,
                9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1,
                8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1,
                5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1,
                0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1,
                6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1,
                10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1,
                10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1,
                8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1,
                1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
                3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1,
                0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1,
                10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1,
                3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1,
                6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1,
                9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1,
                8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1,
                3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1,
                6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1,
                0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1,
                10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1,
                10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1,
                2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1,
                7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1,
                7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1,
                2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1,
                1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1,
                11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1,
                8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1,
                0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1,
                7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
                10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
                2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
                6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1,
                7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1,
                2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1,
                1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1,
                10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1,
                10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1,
                0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1,
                7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1,
                6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1,
                8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1,
                9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1,
                6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1,
                4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1,
                10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1,
                8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1,
                0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1,
                1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1,
                8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1,
                10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1,
                4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1,
                10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
                5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
                11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1,
                9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
                6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1,
                7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1,
                3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1,
                7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1,
                9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1,
                3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1,
                6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1,
                9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1,
                1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1,
                4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1,
                7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1,
                6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1,
                3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1,
                0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1,
                6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1,
                0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1,
                11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1,
                6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1,
                5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1,
                9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1,
                1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1,
                1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1,
                10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1,
                0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1,
                5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1,
                10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1,
                11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1,
                9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1,
                7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1,
                2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1,
                8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1,
                9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1,
                9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1,
                1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1,
                9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1,
                9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1,
                5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1,
                0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1,
                10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1,
                2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1,
                0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1,
                0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1,
                9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1,
                5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1,
                3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1,
                5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1,
                8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1,
                0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1,
                9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1,
                0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1,
                1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1,
                3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1,
                4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1,
                9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1,
                11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1,
                11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1,
                2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1,
                9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1,
                3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1,
                1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1,
                4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1,
                4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1,
                0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1,
                3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1,
                3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1,
                0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1,
                9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1,
                1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
            ]);
        }
        marchingCubes.prototype.pushPosArray = function (f) {
            this.posArray[this.posArrayLength++] = f;
        };
        marchingCubes.prototype.pushNormalArray = function (f) {
            this.normalArray[this.normalArrayLength++] = f;
        };
        marchingCubes.prototype.VIntX = function (pout, nout, offset, isol, x, y, z, valp1, valp2, n1, n2) {
            var mu = (isol - valp1) / (valp2 - valp1);
            pout[offset + 0] = x + mu;
            pout[offset + 1] = y;
            pout[offset + 2] = z;
            //nout [offset + 0] = lerp(n1[0], n2[0], mu);
            //nout [offset + 1] = lerp(n1[1], n2[1], mu);
            //nout [offset + 2] = lerp(n1[2], n2[2], mu);
        };
        marchingCubes.prototype.VIntY = function (pout, nout, offset, isol, x, y, z, valp1, valp2, n1, n2) {
            var mu = (isol - valp1) / (valp2 - valp1);
            pout[offset + 0] = x;
            pout[offset + 1] = y + mu;
            pout[offset + 2] = z;
            //nout [offset + 0] = lerp(n1[0], n2[0], mu);
            //nout [offset + 1] = lerp(n1[1], n2[1], mu);
            //nout [offset + 2] = lerp(n1[2], n2[2], mu);
        };
        marchingCubes.prototype.VIntZ = function (pout, nout, offset, isol, x, y, z, valp1, valp2, n1, n2) {
            var mu = (isol - valp1) / (valp2 - valp1);
            pout[offset + 0] = x;
            pout[offset + 1] = y;
            pout[offset + 2] = z + mu;
            //nout [offset + 0] = lerp(n1[0], n2[0], mu);
            //nout [offset + 1] = lerp(n1[1], n2[1], mu);
            //nout [offset + 2] = lerp(n1[2], n2[2], mu);
        };
        marchingCubes.prototype.polygonize = function (field0, field1, field2, field3, field4, field5, field6, field7, normal0, normal1, normal2, normal3, normal4, normal5, normal6, normal7, isol) {
            var vlist = this.vlist;
            var nlist = this.nlist;
            this.posArrayLength = 0;
            this.normalArrayLength = 0;
            var cubeindex = 0;
            if (field0 < isol)
                cubeindex |= 1;
            if (field1 < isol)
                cubeindex |= 2;
            if (field2 < isol)
                cubeindex |= 8;
            if (field3 < isol)
                cubeindex |= 4;
            if (field4 < isol)
                cubeindex |= 16;
            if (field5 < isol)
                cubeindex |= 32;
            if (field6 < isol)
                cubeindex |= 128;
            if (field7 < isol)
                cubeindex |= 64;
            // If cube is entirely in/out of the surface - bail, nothing to draw.
            var bits = this.edgeTable[cubeindex];
            if (bits == 0)
                return;
            var d = 1;
            var fx = 0;
            var fy = 0;
            var fz = 0;
            var fx2 = fx + d;
            var fy2 = fy + d;
            var fz2 = fz + d;
            // Top of the cube
            if ((bits & 1) != 0) {
                this.VIntX(this.vlist, this.nlist, 0, isol, fx, fy, fz, field0, field1, normal0, normal1);
            }
            if ((bits & 2) != 0) {
                this.VIntY(this.vlist, this.nlist, 3, isol, fx2, fy, fz, field1, field3, normal1, normal3);
            }
            if ((bits & 4) != 0) {
                this.VIntX(this.vlist, this.nlist, 6, isol, fx, fy2, fz, field2, field3, normal2, normal3);
            }
            if ((bits & 8) != 0) {
                this.VIntY(this.vlist, this.nlist, 9, isol, fx, fy, fz, field0, field2, normal0, normal2);
            }
            // Bottom of the cube
            if ((bits & 16) != 0) {
                this.VIntX(this.vlist, this.nlist, 12, isol, fx, fy, fz2, field4, field5, normal4, normal5);
            }
            if ((bits & 32) != 0) {
                this.VIntY(this.vlist, this.nlist, 15, isol, fx2, fy, fz2, field5, field7, normal5, normal7);
            }
            if ((bits & 64) != 0) {
                this.VIntX(this.vlist, this.nlist, 18, isol, fx, fy2, fz2, field6, field7, normal6, normal7);
            }
            if ((bits & 128) != 0) {
                this.VIntY(this.vlist, this.nlist, 21, isol, fx, fy, fz2, field4, field6, normal4, normal6);
            }
            // Vertical lines of the cube
            if ((bits & 256) != 0) {
                this.VIntZ(this.vlist, this.nlist, 24, isol, fx, fy, fz, field0, field4, normal0, normal4);
            }
            if ((bits & 512) != 0) {
                this.VIntZ(this.vlist, this.nlist, 27, isol, fx2, fy, fz, field1, field5, normal1, normal5);
            }
            if ((bits & 1024) != 0) {
                this.VIntZ(this.vlist, this.nlist, 30, isol, fx2, fy2, fz, field3, field7, normal3, normal7);
            }
            if ((bits & 2048) != 0) {
                this.VIntZ(this.vlist, this.nlist, 33, isol, fx, fy2, fz, field2, field6, normal2, normal6);
            }
            cubeindex <<= 4; // Re-purpose cubeindex into an offset into triTable.
            var numtris = 0;
            var i = 0;
            while (this.triTable[cubeindex + i] != -1) {
                var o1 = 3 * this.triTable[cubeindex + i + 0];
                var o2 = 3 * this.triTable[cubeindex + i + 1];
                var o3 = 3 * this.triTable[cubeindex + i + 2];
                this.pushPosArray(vlist[o1 + 0]);
                this.pushPosArray(vlist[o1 + 1]);
                this.pushPosArray(vlist[o1 + 2]);
                this.pushPosArray(vlist[o2 + 0]);
                this.pushPosArray(vlist[o2 + 1]);
                this.pushPosArray(vlist[o2 + 2]);
                this.pushPosArray(vlist[o3 + 0]);
                this.pushPosArray(vlist[o3 + 1]);
                this.pushPosArray(vlist[o3 + 2]);
                /*
                this.pushNormalArray(nlist [o1 + 0]);
                this.pushNormalArray(nlist [o1 + 1]);
                this.pushNormalArray(nlist [o1 + 2]);
                this.pushNormalArray(nlist [o2 + 0]);
                this.pushNormalArray(nlist [o2 + 1]);
                this.pushNormalArray(nlist [o2 + 2]);
                this.pushNormalArray(nlist [o3 + 0]);
                this.pushNormalArray(nlist [o3 + 1]);
                this.pushNormalArray(nlist [o3 + 2]);
                */
                i += 3;
                numtris++;
            }
        };
        return marchingCubes;
    }());
    qec.marchingCubes = marchingCubes;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var lineDrawer = (function () {
        function lineDrawer() {
        }
        lineDrawer.prototype.drawLine = function (pts, canv) {
            var ctx = canv.getContext('2d');
            //ctx.clearRect(0,0,canv.width,canv.height);
            if (pts.length == 0) {
                return;
            }
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (var i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i][0], pts[i][1]);
            }
            ctx.lineTo(pts[0][0], pts[0][1]);
            ctx.fill();
            ctx.closePath();
        };
        return lineDrawer;
    }());
    qec.lineDrawer = lineDrawer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var saveWork = (function () {
        function saveWork() {
        }
        saveWork.prototype.generateContent = function (editor) {
            var svg = editor.originalSvgContent;
            var zip = new JSZip();
            zip.file("svg.svg", svg);
            // 3d
            editor.editorObjects.forEach(function (o) {
                var data = {
                    // o.profilePoints;
                    // o.profileBounds;
                    // o.profileSmooth;
                    inverseTransform: o.sd.inverseTransform,
                    diffuseColor: o.diffuseColor,
                };
                JSON.stringify(data);
            });
            // camera and lights position
            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                // see FileSaver.js
                //saveAs(content, "example.zip");
            });
        };
        return saveWork;
    }());
    qec.saveWork = saveWork;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var svgAutoHeightHelper = (function () {
        function svgAutoHeightHelper() {
            this.svgHelper = new qec.svgHelper();
            this.valueForIds = {};
            this.indexInIds = 0;
        }
        svgAutoHeightHelper.prototype.setSvg = function (content, done) {
            var _this = this;
            this.svgHelper.setSvg(content, function () {
                _this.indexInIds = 0;
                _this.stack = null;
                _this.nextDraw(done);
            });
        };
        svgAutoHeightHelper.prototype.nextDraw = function (done) {
            var _this = this;
            var ids = this.svgHelper.elementsId;
            if (this.indexInIds < ids.length) {
                this.draw(ids[this.indexInIds], function () {
                    _this.indexInIds++;
                    _this.nextDraw(done);
                });
            }
            else {
                done();
            }
        };
        svgAutoHeightHelper.prototype.draw = function (id, done) {
            var _this = this;
            this.svgHelper.drawOnly(id, function () {
                if (_this.stack == null) {
                    _this.stack = new Uint8ClampedArray(_this.svgHelper.canvas.width * _this.svgHelper.canvas.height);
                    _this.stack.fill(0, 0, _this.stack.length);
                }
                var c = _this.svgHelper.canvas;
                var ctxId = c.getContext('2d');
                var imageDataId = ctxId.getImageData(0, 0, c.width, c.height);
                var max = 0;
                // find maxValue under visible pixels
                for (var q = 0; q < _this.stack.length; q++) {
                    var stackValue = _this.stack[q];
                    if (imageDataId.data[4 * q + 3] > 0 &&
                        (imageDataId.data[4 * q] != 255
                            || imageDataId.data[4 * q + 1] != 255
                            || imageDataId.data[4 * q + 2] != 255)) {
                        max = Math.max(max, stackValue);
                    }
                }
                var valueForId = max + 1;
                _this.valueForIds[id] = valueForId;
                console.log('autoHeight for ' + id + ' = ' + valueForId);
                for (var q = 0; q < _this.stack.length; q++) {
                    if (imageDataId.data[4 * q + 3] > 0 &&
                        (imageDataId.data[4 * q] != 255
                            || imageDataId.data[4 * q + 1] != 255
                            || imageDataId.data[4 * q + 2] != 255)) {
                        _this.stack[q] = valueForId;
                    }
                }
                done();
            });
        };
        return svgAutoHeightHelper;
    }());
    qec.svgAutoHeightHelper = svgAutoHeightHelper;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var svgHelper = (function () {
        function svgHelper() {
            this.canvas = document.createElement('canvas');
            this.canvas2 = document.createElement('canvas');
            this.realSize = vec2.create();
        }
        svgHelper.prototype.setSvg = function (content, done) {
            var _this = this;
            this.contentSvg = content;
            var parser = new DOMParser();
            var doc = parser.parseFromString(content, "image/svg+xml");
            this.svgRootElement = doc.documentElement;
            this.layers = this.findLayers(this.svgRootElement);
            this.elements = [];
            this.layers.forEach(function (l) { return _this.getAllElementsInLayer(l, _this.elements); });
            this.elementsId = this.elements.map(function (e) { return e.getAttribute('id'); });
            var img = new Image();
            img.onload = function () {
                _this.imgWidth = img.width;
                _this.imgHeight = img.height;
                console.log(_this.imgWidth, _this.imgHeight);
                done();
            };
            img.src = "data:image/svg+xml;base64," + btoa(this.contentSvg);
        };
        svgHelper.prototype.getElementsId = function () {
            return this.elementsId;
        };
        svgHelper.prototype.drawOnly = function (id, done) {
            var _this = this;
            this.currentId = id;
            this.elements.forEach(function (e) { return _this.setVisible(e, 'hidden'); });
            var found = this.elements.find(function (e) { return e.getAttribute('id') == id; });
            this.setVisible(found, 'visible');
            this.canvas.width = this.imgWidth;
            this.canvas.height = this.imgHeight;
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            var svg_xml = (new XMLSerializer()).serializeToString(this.svgRootElement);
            var img = new Image();
            img.onload = function () {
                ctx.drawImage(img, 0, 0);
                var boundingInPx = _this.getBoundingBoxInPx();
                var w = boundingInPx[2] - boundingInPx[0] + 1;
                var h = boundingInPx[3] - boundingInPx[1] + 1;
                _this.canvas2.width = w;
                _this.canvas2.height = h;
                var ctx2 = _this.canvas2.getContext('2d');
                ctx2.drawImage(img, boundingInPx[0], boundingInPx[1], w, h, 0, 0, w, h);
                done();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svg_xml);
        };
        svgHelper.prototype.setVisible = function (elt, v) {
            var style = {};
            var styleStr = elt.getAttribute('style');
            if (styleStr == null)
                styleStr = '';
            var newStyle = qec.styleAttribute.setField(styleStr, 'visibility', v);
            elt.setAttribute('style', newStyle);
        };
        svgHelper.prototype.getColor = function () {
            var _this = this;
            var found = this.elements.find(function (e) { return e.getAttribute('id') == _this.currentId; });
            var style = found.getAttribute('style');
            var i = style.indexOf('fill:');
            if (i >= 0) {
                var col = style.substring(i + 5, i + 5 + 7);
                var rgb = this.hexToRgb(col);
                if (rgb != null)
                    return rgb;
            }
            return [0.5, 0.5, 0.5];
        };
        svgHelper.prototype.setRealSizeToFit = function (realSizeContainer) {
            var scaleX = (realSizeContainer[0]) / this.imgWidth;
            var scaleY = (realSizeContainer[1]) / this.imgHeight;
            var scale = Math.min(scaleX, scaleY);
            this.realSize[0] = this.imgWidth * scale;
            this.realSize[1] = this.imgHeight * scale;
        };
        svgHelper.prototype.getBoundingRealSize = function () {
            var bounds = this.getBoundingBoxInPx();
            var pxWidth = bounds[2] - bounds[0];
            var pxHeight = bounds[3] - bounds[1];
            return [pxWidth / this.imgWidth * this.realSize[0], pxHeight / this.imgHeight * this.realSize[1]];
        };
        svgHelper.prototype.getRealCenter = function () {
            var bounds = this.getBoundingBoxInPx();
            var cx = 0.5 * bounds[2] + 0.5 * bounds[0];
            var cy = 0.5 * bounds[3] + 0.5 * bounds[1];
            return [(cx - this.imgWidth / 2) / this.imgWidth * this.realSize[0],
                -1 * ((cy - this.imgHeight / 2) / this.imgHeight) * this.realSize[1]];
        };
        svgHelper.prototype.getBoundingBoxInPx = function () {
            var ctx = this.canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            var bounds = [0, 0, 0, 0];
            var first = true;
            for (var i = 0; i < imageData.width; ++i) {
                for (var j = 0; j < imageData.height; ++j) {
                    var q = 4 * (i + j * imageData.width);
                    if (imageData.data[q + 3] > 0 &&
                        (imageData.data[q] != 255
                            || imageData.data[q + 1] != 255
                            || imageData.data[q + 2] != 255)) {
                        if (first || i < bounds[0])
                            bounds[0] = i;
                        if (first || j < bounds[1])
                            bounds[1] = j;
                        if (first || i > bounds[2])
                            bounds[2] = i;
                        if (first || j > bounds[3])
                            bounds[3] = j;
                        first = false;
                    }
                }
            }
            return bounds;
        };
        svgHelper.prototype.findLayers = function (elt) {
            var foundList = [];
            for (var i = 0; i < elt.childNodes.length; ++i) {
                var child = elt.childNodes[i];
                if (child instanceof SVGGElement) {
                    foundList.push(child);
                }
            }
            return foundList;
        };
        svgHelper.prototype.getAllElementsInLayer = function (elt, foundList) {
            for (var i = 0; i < elt.childNodes.length; ++i) {
                var child = elt.childNodes[i];
                if (child instanceof SVGElement) {
                    foundList.push(child);
                }
            }
        };
        svgHelper.prototype.hexToRgb = function (hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16) / 255,
                parseInt(result[2], 16) / 255,
                parseInt(result[3], 16) / 255
            ] : null;
        };
        return svgHelper;
    }());
    qec.svgHelper = svgHelper;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var updateLoop = (function () {
        function updateLoop() {
            this.controllerManager = qec.inject(qec.controllerManager);
            this.editor = qec.inject(qec.editor);
        }
        updateLoop.prototype.afterInject = function () {
            this.loop();
        };
        updateLoop.prototype.loop = function () {
            var _this = this;
            this.controllerManager.updateLoop();
            this.editor.updateLoop();
            requestAnimationFrame(function () { return _this.loop(); });
        };
        return updateLoop;
    }());
    qec.updateLoop = updateLoop;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var cameraDTO = (function () {
        function cameraDTO(position, target, up, fov) {
            if (position === void 0) { position = [1, 1, 1]; }
            if (target === void 0) { target = [0, 0, 0]; }
            if (up === void 0) { up = [1, 0, 0]; }
            if (fov === void 0) { fov = Math.PI / 6; }
            this.position = position;
            this.target = target;
            this.up = up;
            this.fov = fov;
            this.type = 'cameraDTO';
        }
        return cameraDTO;
    }());
    qec.cameraDTO = cameraDTO;
    var camera = (function () {
        function camera() {
            this.projMatrix = mat4.create();
            this.transformMatrix = mat4.create();
            this.inversePMatrix = mat4.create();
            this.inverseTransformMatrix = mat4.create();
            this.position = vec3.create();
            this.target = vec3.create();
            this.up = vec3.create();
            this.fov = Math.PI / 6;
            this.ray_eye = vec4.create();
            this.ray_clip = vec4.create();
            this.ray_wor = vec4.create();
        }
        camera.prototype.createFrom = function (dto) {
            vec3FromArray(this.position, dto.position);
            vec3FromArray(this.target, dto.target);
            vec3FromArray(this.up, dto.up);
            this.fov = dto.fov;
            this.updateMatrices();
        };
        camera.prototype.toDTO = function (dto) {
            vec3ToArray(dto.position, this.position);
            vec3ToArray(dto.target, this.target);
            vec3ToArray(dto.up, this.up);
            dto.fov = this.fov;
        };
        camera.prototype.setCam = function (camPos, camCenter, camUp) {
            vec3.copy(this.position, camPos);
            vec3.copy(this.target, camCenter);
            vec3.copy(this.up, camUp);
            this.updateMatrices();
        };
        camera.prototype.setPosition = function (v) {
            vec3.copy(this.position, v);
            this.updateMatrices();
        };
        camera.prototype.setTarget = function (v) {
            vec3.copy(this.target, v);
            this.updateMatrices();
        };
        camera.prototype.setUp = function (v) {
            vec3.copy(this.up, v);
            this.updateMatrices();
        };
        camera.prototype.rendererInit = function (canvasWidth, canvasHeight) {
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            mat4.perspective(this.projMatrix, this.fov, canvasWidth / canvasHeight, 0.1, 100);
            mat4.invert(this.inversePMatrix, this.projMatrix);
        };
        camera.prototype.updateMatrices = function () {
            mat4.lookAt(this.transformMatrix, this.position, this.target, this.up);
            mat4.invert(this.inverseTransformMatrix, this.transformMatrix);
        };
        camera.prototype.getRay = function (mx, my, ro, rd) {
            var x = (2.0 * mx) / this.canvasWidth - 1.0;
            var y = 1.0 - (2.0 * my) / this.canvasHeight;
            this.getRayRel(x, y, ro, rd);
        };
        camera.prototype.getRayRel = function (x, y, ro, rd) {
            //console.log('rayrel : ' + x + ' , ' + y);
            // http://antongerdelan.net/opengl/raycasting.html
            vec4.set(this.ray_clip, x, y, -1.0, 1.0);
            vec4.transformMat4(this.ray_eye, this.ray_clip, this.inversePMatrix);
            ;
            this.ray_eye[2] = -1.0;
            this.ray_eye[3] = 0.0;
            vec4.transformMat4(this.ray_wor, this.ray_eye, this.inverseTransformMatrix);
            vec3.normalize(rd, this.ray_wor);
            vec3.set(ro, 0, 0, 0);
            vec3.transformMat4(ro, ro, this.inverseTransformMatrix);
        };
        return camera;
    }());
    qec.camera = camera;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var directionalLightDTO = (function () {
        function directionalLightDTO() {
        }
        return directionalLightDTO;
    }());
    qec.directionalLightDTO = directionalLightDTO;
    var directionalLight = (function () {
        function directionalLight() {
            this.position = vec3.create();
            this.direction = vec3.create();
            this.intensity = 1;
        }
        directionalLight.prototype.createFrom = function (dto) {
            vec3FromArray(this.position, dto.position);
            vec3FromArray(this.direction, dto.direction);
            this.intensity = dto.intensity;
            vec3.normalize(this.direction, this.direction);
        };
        return directionalLight;
    }());
    qec.directionalLight = directionalLight;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var distanceField = (function () {
        function distanceField() {
            this.halfSize = vec2.create();
            this.xy = new Uint32Array(2);
        }
        distanceField.prototype.initCommon = function (fieldWidth, fieldHeight, halfWidth, halfHeight) {
            this.M = fieldWidth;
            this.N = fieldHeight;
            this.halfSize[0] = halfWidth;
            this.halfSize[1] = halfHeight;
            this.L = new Uint32Array(this.M * this.N * 2);
            this.D = new Float32Array(this.M * this.N);
        };
        distanceField.prototype.initDisc = function (fieldSize, radius, halfWidth, halfHeight) {
            this.initCommon(fieldSize, fieldSize, halfWidth, halfHeight);
            for (var i = 0; i < this.M; ++i) {
                for (var j = 0; j < this.N; ++j) {
                    var q = (j * this.M + i);
                    var x = this.halfSize[0] * (2 * i / this.M - 1);
                    var y = this.halfSize[1] * (2 * j / this.N - 1);
                    this.D[q] = Math.sqrt(x * x + y * y) - radius;
                }
            }
        };
        distanceField.prototype.initSquare = function (fieldSize, squareHalfSize, halfWidth, halfHeight) {
            this.initCommon(fieldSize, fieldSize, halfWidth, halfHeight);
            for (var i = 0; i < this.M; ++i) {
                for (var j = 0; j < this.N; ++j) {
                    var q = (j * this.M + i);
                    var x = this.halfSize[0] * (2 * i / this.M - 1);
                    var y = this.halfSize[1] * (2 * j / this.N - 1);
                    var dx = Math.max(-squareHalfSize - x, 0, x - squareHalfSize);
                    var dy = Math.max(-squareHalfSize - y, 0, y - squareHalfSize);
                    if (dx + dy > 0)
                        this.D[q] = Math.sqrt(dx * dx + dy * dy);
                    else {
                        dx = Math.min(x - (-squareHalfSize), squareHalfSize - x);
                        dy = Math.min(y - (-squareHalfSize), squareHalfSize - y);
                        this.D[q] = -Math.min(dx, dy);
                    }
                }
            }
        };
        distanceField.prototype.initFromImageData = function (data, dataWidth, dataHeight, halfWidth, halfHeight) {
            this.initCommon(dataWidth, dataHeight, halfWidth, halfHeight);
            for (var i = 0; i < this.M; ++i) {
                for (var j = 0; j < this.N; ++j) {
                    //if (data[4 * (j * this.M + i)] > 0)
                    if (this.isBorderImageData(data, dataWidth, dataHeight, i, j)) {
                        this.setL(i, j, 0, 0);
                    }
                    else {
                        this.setL(i, j, 1024, 1024);
                    }
                }
            }
            for (var j = 1; j < this.N; ++j) {
                //console.log('1st pass: ' + j);
                for (var i = 0; i < this.M; ++i) {
                    this.setIfDistMin(i, j, 0, -1, 0, 1);
                }
                for (var i = 1; i < this.M; ++i) {
                    this.setIfDistMin(i, j, -1, 0, 1, 0);
                }
                for (var i = this.M - 2; i >= 0; --i) {
                    this.setIfDistMin(i, j, 1, 0, 1, 0);
                }
            }
            for (var j = this.N - 2; j >= 0; --j) {
                //console.log('2nd pass: ' + j);
                for (var i = 0; i < this.M; ++i) {
                    this.setIfDistMin(i, j, 0, 1, 0, 1);
                }
                for (var i = 1; i < this.M; ++i) {
                    this.setIfDistMin(i, j, -1, 0, 1, 0);
                }
                for (var i = this.M - 2; i >= 0; --i) {
                    this.setIfDistMin(i, j, 1, 0, 1, 0);
                }
            }
            // Convert Distances:
            for (var q = 0; q < this.M * this.N; ++q) {
                this.D[q] *= 2 * this.halfSize[0] / this.M;
            }
        };
        distanceField.prototype.isPixelSet = function (data, width, height, i, j) {
            var q = 4 * ((height - 1 - j) * width + i);
            return (data[q] != 255 || data[q + 1] != 255 || data[q + 2] != 255) && data[q + 3] != 0;
        };
        distanceField.prototype.isBorderImageData = function (data, width, height, i, j) {
            if (!this.isPixelSet(data, width, height, i, j)) {
                return false;
            }
            for (var di = -1; di <= 1; ++di) {
                for (var dj = -1; dj <= 1; ++dj) {
                    if (di + i >= 0 && di + i < width
                        && dj + j >= 0 && dj + j < height) {
                        if (!this.isPixelSet(data, width, height, di + i, dj + j)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        distanceField.prototype.setL = function (i, j, x, y) {
            var q = (j * this.M + i);
            this.L[2 * q] = x;
            this.L[2 * q + 1] = y;
            this.D[q] = Math.sqrt(x * x + y * y);
        };
        distanceField.prototype.getD = function (i, j) {
            var q = (j * this.M + i);
            return this.D[q];
        };
        distanceField.prototype.distL = function (i, j, dx, dy) {
            var q = (j * this.M + i);
            var x = this.L[2 * q];
            var y = this.L[2 * q + 1];
            return Math.sqrt((x + dx) * (x + dx) + (y + dy) * (y + dy));
        };
        distanceField.prototype.setIfDistMin = function (i, j, di, dj, dx, dy) {
            //var l1 = this.distL(i, j,       0, 0);
            var l1 = this.D[j * this.M + i];
            var l2 = this.distL(i + di, j + dj, dx, dy);
            if (l2 < l1) {
                //console.log("<");
                var q = ((j + dj) * this.M + (i + di));
                var x = this.L[2 * q];
                var y = this.L[2 * q + 1];
                this.setL(i, j, x + dx, y + dy);
            }
        };
        distanceField.prototype.setSignFromImageData = function (data, width, height) {
            this.maxDepth = 0;
            for (var i = 0; i < this.M; ++i) {
                for (var j = 0; j < this.N; ++j) {
                    if (this.isPixelSet(data, width, height, i, j)) 
                    //if (data[4 * ((this.N-1-j) * this.M + i)] == 0)
                    {
                        var q = j * this.M + i;
                        var d = this.D[q];
                        if (d > this.maxDepth)
                            this.maxDepth = d;
                        this.D[q] = -d;
                    }
                }
            }
        };
        distanceField.prototype.fillImageData = function (data, scale) {
            for (var i = 0; i < this.M; ++i) {
                //console.log('i' + i);
                for (var j = 0; j < this.N; ++j) {
                    var q = 4 * ((this.N - 1 - j) * this.M + i);
                    var d = this.D[j * this.M + i] * scale;
                    data[q] = 0;
                    data[q + 1] = 0;
                    data[q + 2] = 0;
                    data[q + 3] = 255;
                    if (d > 0) {
                        data[q] = d;
                    }
                    else {
                        data[q + 1] = -d;
                    }
                }
            }
        };
        return distanceField;
    }());
    qec.distanceField = distanceField;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var distanceFieldCanvas = (function () {
        function distanceFieldCanvas() {
            this.srcLoaded = false;
            this.floatTexture = new qec.floatTexture();
            this.totalBounds = vec4.create();
            this.optimizedBounds = vec4.create();
            this.dfMaxWidth = 400;
            this.dfMaxHeight = 400;
            this.canvas = document.createElement('canvas');
        }
        distanceFieldCanvas.prototype.setDistanceFieldMaxSize = function (maxWidth, maxHeight) {
            this.dfMaxWidth = maxWidth;
            this.dfMaxHeight = maxHeight;
        };
        distanceFieldCanvas.prototype.initCommon = function (fieldSize, bounds) {
            this.canvas.width = fieldSize;
            this.canvas.height = fieldSize;
            this.distanceField = new qec.distanceField();
        };
        distanceFieldCanvas.prototype.initDisc = function (fieldSize, radius, halfWidth, halfHeight) {
            this.initCommon(fieldSize, vec4.fromValues(-halfWidth, -halfHeight, halfWidth, halfHeight));
            this.distanceField.initDisc(fieldSize, radius, halfWidth, halfHeight);
            this.updateFloatTexture();
        };
        distanceFieldCanvas.prototype.initSquare = function (fieldSize, squareHalfSize, halfWidth, halfHeight) {
            this.initCommon(fieldSize, vec4.fromValues(-halfWidth, -halfHeight, halfWidth, halfHeight));
            this.distanceField.initSquare(fieldSize, squareHalfSize, halfWidth, halfHeight);
            this.updateFloatTexture();
        };
        distanceFieldCanvas.prototype.drawUserCanvasForTop = function (img, _bounds, margin) {
            this.drawUserCanvasBase(img, _bounds, margin, false);
        };
        distanceFieldCanvas.prototype.drawUserCanvasForProfile = function (img, _bounds, margin) {
            this.drawUserCanvasBase(img, _bounds, margin, true);
        };
        distanceFieldCanvas.prototype.drawUserCanvasBase = function (img, _bounds, margin, profile) {
            this.totalBounds = vec4.fromValues(_bounds[0] - margin, _bounds[1] - margin, _bounds[2] + margin, _bounds[3] + margin);
            var boundW = _bounds[2] - _bounds[0];
            var boundH = _bounds[3] - _bounds[1];
            var totalBoundW = this.totalBounds[2] - this.totalBounds[0];
            var totalBoundH = this.totalBounds[3] - this.totalBounds[1];
            var dfWidth = this.dfMaxWidth;
            var dfHeight = this.dfMaxHeight;
            if (totalBoundH > totalBoundW)
                dfWidth = Math.round(dfHeight * (totalBoundW / totalBoundH));
            else
                dfHeight = Math.round(dfWidth * (totalBoundH / totalBoundW));
            var newImgWidth = dfWidth * (boundW / totalBoundW);
            var newImgHeight = dfHeight * (boundH / totalBoundH);
            var offsetX = (dfWidth - newImgWidth) / 2;
            var offsetY = (dfHeight - newImgHeight) / 2;
            /*
            console.log('bounds : ' + vec4.str(_bounds));
            console.log('totalBounds : ' + vec4.str(this.totalBounds));

            console.log('dfWidth : ' + dfWidth);
            console.log('dfHeight : ' + dfHeight);

            console.log('offsetX : ' + offsetX);
            console.log('offsetY : ' + offsetY);
            */
            this.canvas.width = dfWidth;
            this.canvas.height = dfHeight;
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, newImgWidth, newImgHeight);
            // draw left margin if profile
            if (profile)
                ctx.drawImage(img, 0, 0, 1, img.height, 0, offsetY, offsetX, newImgHeight);
            if (this.distanceField == null) {
                this.distanceField = new qec.distanceField();
            }
            var df = this.distanceField;
            var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            df.initFromImageData(imageData.data, this.canvas.width, this.canvas.height, 0.5 * totalBoundW, 0.5 * totalBoundH);
            df.setSignFromImageData(imageData.data, this.canvas.width, this.canvas.height);
        };
        distanceFieldCanvas.prototype.update = function () {
            this.updateFloatTexture();
        };
        distanceFieldCanvas.prototype.updateFloatTexture = function () {
            var texture = this.floatTexture;
            var df = this.distanceField;
            if (texture.width * texture.height != df.M * df.N) {
                texture.data = new Float32Array(df.M * df.N * 4);
            }
            texture.width = df.M;
            texture.height = df.N;
            for (var q = 0; q < texture.width * texture.height; q++) {
                var d = df.D[q];
                texture.data[4 * q + 0] = d;
                texture.data[4 * q + 1] = d;
                texture.data[4 * q + 2] = d;
                texture.data[4 * q + 3] = d;
            }
        };
        distanceFieldCanvas.prototype.computeDistanceFieldFromSrcs = function (src1, halfWidth, halfHeight, callback) {
            var _this = this;
            console.log('dfCanvas : ' + src1);
            this.srcLoaded = false;
            this.loadImg(src1, function (img1) {
                _this.computeDistanceField(img1, halfWidth, halfHeight);
                _this.srcLoaded = true;
                callback();
            });
        };
        distanceFieldCanvas.prototype.computeDistanceField = function (img1, halfWidth, halfHeight) {
            this.initCommon(img1.width, null);
            this.drawUserCanvasForTop(img1, new Float32Array([-halfWidth, -halfHeight, halfWidth, halfHeight]), 0.01);
            /*
                        var width = img1.width;
                        var height = img1.height;
                        this.canvas.width = width;
                        this.canvas.height = height;
            
                        this.distanceField = new distanceField();
                        var df = this.distanceField;
                        var ctx = this.canvas.getContext('2d');
            
                        ctx.clearRect(0,0,width,height);
                        ctx.drawImage(img1, 0, 0, img1.width, img1.height);
                        var imageData = ctx.getImageData(0, 0, width, height);
                        df.initFromImageData(imageData.data, width, height, halfWidth, halfHeight);
            
                        //df.fillImageData(imageData.data);
                        //ctx.putImageData(imageData,0,0);
            
                        ctx.clearRect(0,0,width,height);
                        ctx.drawImage(img1, 0, 0, img1.width, img1.height);
                        imageData = ctx.getImageData(0, 0, width,height);
                        df.setSignFromImageData(imageData.data, width, height);
            
                        //df.fillImageData(imageData.data, 50000);
                        //ctx.putImageData(imageData,0,0);
                        */
        };
        distanceFieldCanvas.prototype.loadImg = function (src1, callback) {
            var img = new Image();
            img.onload = function () { callback(img); };
            img.src = src1;
        };
        distanceFieldCanvas.prototype.loadImgs = function (src1, src2, callback) {
            var img = new Image();
            img.onload = function () {
                var img2 = new Image();
                img2.onload = function () {
                    callback(img, img2);
                };
                img2.src = src2;
            };
            img.src = src1;
        };
        distanceFieldCanvas.prototype.debugInfoInCanvas = function () {
            var ctx = this.canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.distanceField.fillImageData(imageData.data, 2550);
            ctx.putImageData(imageData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
        };
        return distanceFieldCanvas;
    }());
    qec.distanceFieldCanvas = distanceFieldCanvas;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var floatTexture = (function () {
        function floatTexture() {
        }
        return floatTexture;
    }());
    qec.floatTexture = floatTexture;
    function createFloatTextureFromDistanceField(df) {
        var texture = new floatTexture();
        texture.width = df.M;
        texture.height = df.N;
        texture.data = new Float32Array(df.M * df.N * 4);
        for (var q = 0; q < texture.width * texture.height; q++) {
            var d = df.D[q];
            texture.data[4 * q + 0] = d;
            texture.data[4 * q + 1] = d;
            texture.data[4 * q + 2] = d;
            texture.data[4 * q + 3] = d;
        }
        return texture;
    }
    qec.createFloatTextureFromDistanceField = createFloatTextureFromDistanceField;
    function updateFloatTextureFromDistanceField(texture, df) {
        if (texture.width * texture.height != df.M * df.N) {
            texture.data = new Float32Array(df.M * df.N * 4);
        }
        texture.width = df.M;
        texture.height = df.N;
        for (var q = 0; q < texture.width * texture.height; q++) {
            var d = df.D[q];
            texture.data[4 * q + 0] = d;
            texture.data[4 * q + 1] = d;
            texture.data[4 * q + 2] = d;
            texture.data[4 * q + 3] = d;
        }
        return texture;
    }
    qec.updateFloatTextureFromDistanceField = updateFloatTextureFromDistanceField;
    function texture2D(t, u, v, outColor) {
        var fx = u * (t.width - 1);
        var fy = v * (t.height - 1);
        var x = Math.floor(fx);
        var y = Math.floor(fy);
        var dx = fx - x;
        var dy = fy - y;
        if (x == t.width - 1) {
            x = t.width - 2;
            dx = 1;
        }
        if (y == t.height - 1) {
            y = t.height - 2;
            dy = 1;
        }
        for (var i = 0; i < 4; i++)
            outColor[i] = texture2DComponent(t, x, y, dx, dy, i);
    }
    qec.texture2D = texture2D;
    function texture2DComponent(t, x, y, dx, dy, comp) {
        return texture2Dat(t, x, y, comp) * (1 - dx) * (1 - dy)
            + texture2Dat(t, x + 1, y, comp) * dx * (1 - dy)
            + texture2Dat(t, x, y + 1, comp) * (1 - dx) * dy
            + texture2Dat(t, x + 1, y + 1, comp) * dx * dy;
    }
    function texture2Dat(t, x, y, index) {
        return t.data[4 * (y * t.width + x) + index];
    }
})(qec || (qec = {}));
var qec;
(function (qec) {
    var hardwareRenderer = (function () {
        function hardwareRenderer() {
            this.fragmentShader = '';
            this.fakePos = vec3.create();
            this.inverseTransform = mat4.create();
        }
        hardwareRenderer.prototype.setFragmentShader = function (text) {
            this.fragmentShader = text;
            //console.log(text);
        };
        hardwareRenderer.prototype.setContainerAndSize = function (container, rWidth, rHeight) {
            this.container = container;
            this.width = rWidth;
            this.height = rHeight;
            this.initTHREE();
            this.expl = new qec.hardwareSignedDistanceExplorer();
            this.text = new qec.hardwareShaderText();
            this.text.expl = this.expl;
            this.gShaderMaterial.uniforms.u_inverseTransforms = { type: "m4v", value: [] };
            this.gShaderMaterial.uniforms.u_diffuses = { type: "3fv", value: [] };
            this.gShaderMaterial.uniforms.u_topTextures = { type: "tv", value: [] };
            this.gShaderMaterial.uniforms.u_profileTextures = { type: "tv", value: [] };
            this.gShaderMaterial.uniforms.u_topBounds = { type: "4fv", value: [] };
            this.gShaderMaterial.uniforms.u_profileBounds = { type: "'fv", value: [] };
        };
        hardwareRenderer.prototype.getCanvas = function () {
            return this.gRenderer.domElement;
        };
        hardwareRenderer.prototype.showBoundingBox = function (b) {
        };
        hardwareRenderer.prototype.updateShader = function (sd, lightCount) {
            console.log('hardwareRenderer.updateShader');
            this.expl.explore(sd);
            var generatedPart = this.text.generateDistance()
                + this.text.generateColor();
            var generatedLight = this.text.generateLight(lightCount);
            this.fragmentShader = ''
                + qec.resources.all['app/sd.glsl']
                + generatedPart
                + qec.resources.all['app/light.glsl']
                + generatedLight
                + qec.resources.all['app/renderPixel.glsl'];
            this.gViewQuad.material.fragmentShader = this.fragmentShader;
            this.gViewQuad.material.needsUpdate = true;
            this.updateAllUniformsForAll();
        };
        hardwareRenderer.prototype.updateAllUniformsForAll = function () {
            for (var i = 0; i < this.expl.array.length; ++i)
                this.updateAllUniforms(this.expl.array[i].sd);
        };
        hardwareRenderer.prototype.updateAllUniforms = function (sd) {
            this.updateDiffuse(sd);
            this.updateTransform(sd);
            if (sd instanceof qec.sdFields)
                this.updateFloatTextures(sd);
        };
        hardwareRenderer.prototype.updateDiffuse = function (sd) {
            var hsd = this.expl.getHsd(sd);
            var diffuse = sd.getMaterial(this.fakePos).diffuse;
            if (this.gShaderMaterial.uniforms.u_diffuses.value[hsd.index] == null)
                this.gShaderMaterial.uniforms.u_diffuses.value[hsd.index] = new THREE.Vector3();
            this.gShaderMaterial.uniforms.u_diffuses.value[hsd.index].fromArray(diffuse);
        };
        hardwareRenderer.prototype.updateTransform = function (sd) {
            var hsd = this.expl.getHsd(sd);
            sd.getInverseTransform(this.inverseTransform);
            if (this.gShaderMaterial.uniforms.u_inverseTransforms.value[hsd.index] == null)
                this.gShaderMaterial.uniforms.u_inverseTransforms.value[hsd.index] = new THREE.Matrix4();
            var m = this.gShaderMaterial.uniforms.u_inverseTransforms.value[hsd.index];
            m.fromArray(this.inverseTransform);
        };
        hardwareRenderer.prototype.updateFloatTextures = function (sd) {
            var hsd = this.expl.getHsd(sd);
            var topDataTexture = new THREE.DataTexture(sd.topTexture.data, sd.topTexture.width, sd.topTexture.height, THREE.RGBAFormat, THREE.FloatType);
            topDataTexture.needsUpdate = true;
            var profileDataTexture = new THREE.DataTexture(sd.profileTexture.data, sd.profileTexture.width, sd.profileTexture.height, THREE.RGBAFormat, THREE.FloatType);
            profileDataTexture.needsUpdate = true;
            var topBounds = new THREE.Vector4();
            topBounds.fromArray(sd.topBounds);
            var profileBounds = new THREE.Vector4();
            profileBounds.fromArray(sd.profileBounds);
            this.gShaderMaterial.uniforms.u_topTextures.value[hsd.sdFieldIndex] = topDataTexture;
            this.gShaderMaterial.uniforms.u_profileTextures.value[hsd.sdFieldIndex] = profileDataTexture;
            this.gShaderMaterial.uniforms.u_topBounds.value[hsd.sdFieldIndex] = topBounds;
            this.gShaderMaterial.uniforms.u_profileBounds.value[hsd.sdFieldIndex] = profileBounds;
        };
        hardwareRenderer.prototype.renderDebug = function (x, y, settings) {
            alert('not supported');
        };
        hardwareRenderer.prototype.render = function (settings) {
            var _this = this;
            var camera = settings.camera;
            var sd = settings.sd;
            camera.rendererInit(this.width, this.height);
            this.gShaderMaterial.uniforms.u_inversePMatrix = { type: "Matrix4fv", value: camera.inversePMatrix },
                this.gShaderMaterial.uniforms.u_inverseTransformMatrix = { type: "Matrix4fv", value: camera.inverseTransformMatrix },
                this.gShaderMaterial.uniforms.u_shadows = { type: "1i", value: settings.shadows ? 1 : 0 };
            if (this.gShaderMaterial.uniforms.u_lightPositions == null) {
                this.gShaderMaterial.uniforms.u_lightPositions = { type: "3fv", value: [] };
                this.gShaderMaterial.uniforms.u_lightIntensities = { type: "1fv", value: [] };
            }
            settings.spotLights.forEach(function (l, i) {
                if (_this.gShaderMaterial.uniforms.u_lightPositions.value[i] == null) {
                    _this.gShaderMaterial.uniforms.u_lightPositions.value[i] = new THREE.Vector3();
                    _this.gShaderMaterial.uniforms.u_lightIntensities.value[i] = 0;
                }
                _this.gShaderMaterial.uniforms.u_lightPositions.value[i].fromArray(l.position);
                _this.gShaderMaterial.uniforms.u_lightIntensities.value[i] = l.intensity;
            });
            this.gRenderer.render(this.gScene, this.gCamera);
        };
        hardwareRenderer.prototype.initTHREE = function () {
            // setup WebGL renderer
            this.gRenderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
            this.gRenderer.setSize(this.width, this.height);
            //gRenderer.setClearColorHex(0x000000, 1);
            this.gRenderer.setClearColor(0xffffff, 1);
            this.gRenderer.setPixelRatio(window.devicePixelRatio);
            //gRenderer.autoClear = false;
            this.container.appendChild(this.gRenderer.domElement);
            // camera to render, orthogonal (fov=0)
            this.gCamera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, -1, 1);
            // scene for rendering
            this.gScene = new THREE.Scene();
            this.gScene.add(this.gCamera);
            // compile shader
            var vertexShader = 'varying vec2 vUv;' +
                'void main() {vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}';
            var fragmentShader = 'varying vec2 vUv;' +
                'void main() {gl_FragColor = vec4(vUv[0], vUv[1], 0 , 1);}';
            if (this.fragmentShader)
                fragmentShader = this.fragmentShader;
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
        };
        return hardwareRenderer;
    }());
    qec.hardwareRenderer = hardwareRenderer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var hardwareShaderText = (function () {
        function hardwareShaderText() {
        }
        hardwareShaderText.prototype.generateDistance = function () {
            console.log('generateDistance');
            var shader = '';
            var hsdArray = this.expl.array;
            shader += 'uniform mat4 u_inverseTransforms[' + hsdArray.length + '];\n\n';
            var count = this.expl.getSdFieldsCount();
            shader += count == 0 ? '' :
                'uniform sampler2D u_topTextures[' + count + '];\n' +
                    'uniform sampler2D u_profileTextures[' + count + '];\n' +
                    'uniform vec4 u_topBounds[' + count + '];\n' +
                    'uniform vec4 u_profileBounds[' + count + '];\n\n';
            for (var i = hsdArray.length - 1; i >= 0; --i) {
                shader += this.generateOneDistance(hsdArray[i]);
                shader += '\n\n';
            }
            shader +=
                'float getDist(vec3 pos) { return getDist_0(pos); }\n';
            return shader;
        };
        hardwareShaderText.prototype.generateOneDistance = function (hsd) {
            var sd = hsd.sd;
            console.log('generateOneDistance ' + hsd.index);
            if (sd instanceof qec.sdUnion) {
                var array = sd.array;
                var concat = '  float d=666.0;\n';
                for (var j = 0; j < array.length; ++j) {
                    var childHsd = this.expl.getHsd(array[j]);
                    concat += '  d = opU(d, getDist_' + childHsd.index + '(pos));\n';
                }
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                    + '\n' + concat
                    + '  return d;'
                    + '\n}';
            }
            if (sd instanceof qec.sdFields) {
                var m = mat4.create();
                sd.getInverseTransform(m);
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                    + '\n  return sdFields_(pos,'
                    + '\n    u_topTextures[' + hsd.sdFieldIndex + '],'
                    + '\n    u_profileTextures[' + hsd.sdFieldIndex + '],'
                    + '\n    u_topBounds[' + hsd.sdFieldIndex + '],'
                    + '\n    u_profileBounds[' + hsd.sdFieldIndex + '],'
                    + '\n    u_inverseTransforms[' + hsd.index + ']'
                    + '\n  );}';
            }
            if (sd instanceof qec.sdBox) {
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                    + '\n  return sdBox(pos, ' + vec3.str(sd.halfSize) + ');'
                    + '\n}';
            }
            if (sd instanceof qec.sdSphere) {
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                    + '\n  return sdSphere(pos, ' + sd.radius + ', u_inverseTransforms[' + hsd.index + ']);'
                    + '\n}';
            }
            if (sd instanceof qec.sdPlane) {
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                    + '\n  return sdPlane(pos, ' + vec3.str(sd.normal) + ');'
                    + '\n}';
            }
            return '';
        };
        hardwareShaderText.prototype.generateColor = function () {
            console.log('generateColor');
            var shader = '';
            var hsdArray = this.expl.array;
            shader += '\n\nuniform vec3 u_diffuses[' + hsdArray.length + '];\n\n';
            console.log(hsdArray[0]);
            for (var i = hsdArray.length - 1; i >= 0; --i) {
                shader += this.generateOneColor(hsdArray[i]);
                shader += '\n\n';
            }
            shader +=
                'vec3 getColor(vec3 pos) { return getColor_0(pos); }\n';
            return shader;
        };
        hardwareShaderText.prototype.generateOneColor = function (hsd) {
            var sd = hsd.sd;
            var fakePos = vec3.create();
            if (sd instanceof qec.sdUnion) {
                var array = sd.array;
                var concat = '  float d=666.0;\n  float d2;  vec3 color;\n';
                for (var j = 0; j < array.length; ++j) {
                    var childHsd = this.expl.getHsd(array[j]);
                    concat += '  d2 = getDist_' + childHsd.index + '(pos);\n'
                        + '  if (d2 < d) { d = d2; color = getColor_' + childHsd.index + '(pos);}\n';
                }
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                    + '\n' + concat
                    + '  return color;'
                    + '\n}';
            }
            else {
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) { return u_diffuses[' + hsd.index + ']; }';
            }
        };
        hardwareShaderText.prototype.generateLight = function (count) {
            var shader = '';
            shader += '\n\nuniform vec3 u_lightPositions[' + count + '];\n\n';
            shader += '\n\nuniform float u_lightIntensities[' + count + '];\n\n';
            shader += 'vec3 getLight(int shadows, vec3 col, vec3 pos, vec3 normal, vec3 rd) { \n';
            shader += '    vec3 result = vec3(0.0,0.0,0.0);\n';
            for (var i = 0; i < count; ++i) {
                shader += '    result = result + applyLight(u_lightPositions[' + i + '], u_lightIntensities[' + i + '], shadows, col, pos, normal, rd);\n';
            }
            shader += '    return result;\n}\n\n';
            return shader;
        };
        return hardwareShaderText;
    }());
    qec.hardwareShaderText = hardwareShaderText;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var hardwareSignedDistance = (function () {
        function hardwareSignedDistance() {
            this.sdFieldIndex = -1;
        }
        return hardwareSignedDistance;
    }());
    qec.hardwareSignedDistance = hardwareSignedDistance;
    var hardwareSignedDistanceExplorer = (function () {
        function hardwareSignedDistanceExplorer() {
            this.array = [];
        }
        hardwareSignedDistanceExplorer.prototype.explore = function (sd) {
            this.recCount = 0;
            this.sdFieldsCount = 0;
            this.array = [];
            this.exploreRec(sd);
        };
        hardwareSignedDistanceExplorer.prototype.exploreRec = function (sd) {
            var hsd = new hardwareSignedDistance();
            this.array.push(hsd);
            hsd.sd = sd;
            hsd.index = this.recCount;
            this.recCount++;
            if (sd instanceof qec.sdFields) {
                hsd.sdFieldIndex = this.sdFieldsCount;
                this.sdFieldsCount++;
            }
            else if (sd instanceof qec.sdUnion) {
                for (var i = 0; i < sd.array.length; ++i)
                    this.exploreRec(sd.array[i]);
            }
        };
        hardwareSignedDistanceExplorer.prototype.getSdFieldsCount = function () {
            var c = 0;
            for (var i = 0; i < this.array.length; ++i)
                if (this.array[i].sd instanceof qec.sdFields)
                    c++;
            return c;
        };
        hardwareSignedDistanceExplorer.prototype.getHsd = function (sd) {
            var found = this.array.find(function (hsd) { return hsd.sd == sd; });
            return found;
        };
        return hardwareSignedDistanceExplorer;
    }());
    qec.hardwareSignedDistanceExplorer = hardwareSignedDistanceExplorer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    /*
        export class parallelRenderDTO
        {
            clientCount = 10;
            lineCount = 50;
        }
    */
    var parallelRenderer = (function () {
        function parallelRenderer() {
            this.clients = [];
        }
        parallelRenderer.prototype.setContainerAndSize = function (element, rWidth, rHeight) {
            var canvas = document.createElement('canvas');
            this.canvas = canvas;
            canvas.width = rWidth;
            canvas.height = rHeight;
            canvas.style.border = "1px solid";
            element.appendChild(canvas);
            this.sharedRenderedData = new Uint8ClampedArray(canvas.width * canvas.height * 4);
            this.clientCount = 4;
            this.lineCount = rHeight / this.clientCount;
            for (var i = 0; i < this.clientCount; ++i) {
                var w = new qec.renderClient('#' + i, this.canvas, this.sharedRenderedData);
                this.clients.push(w);
            }
        };
        /*
                render(rp:renderPixel, camera:camera)
                {
                    for (var i=0; i<this.clients.length; ++i)
                    {
                        this.clients[i].init(rp, camera, ()=>this.initDone(rp, camera));
                    }
                }
        */
        parallelRenderer.prototype.initDTO = function (sceneDTO, done) {
            var run = new qec.runAll();
            for (var i = 0; i < this.clients.length; ++i) {
                run.push(this.initDTOAt(this.clients[i], sceneDTO));
            }
            run.run(done);
        };
        parallelRenderer.prototype.initDTOAt = function (client, sceneDTO) {
            return (function (done) { return client.initDTO(sceneDTO, done); });
        };
        parallelRenderer.prototype.render = function (cam, done) {
            var _this = this;
            this.onRenderDone = done;
            var run = new qec.runAll();
            // update clients with new cam
            for (var i = 0; i < this.clients.length; ++i) {
                run.push(this.prepareRender(this.clients[i], cam));
            }
            run.run(function () { return _this.render2(); });
        };
        parallelRenderer.prototype.render2 = function () {
            console.log('render2');
            /*
            var ctx = this.canvas.getContext('2d');
            ctx.fillStyle = "green";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            */
            this.lineIndex = 0;
            for (var i = 0; i < this.clients.length; ++i) {
                this.nextRender(this.clients[i]);
            }
        };
        parallelRenderer.prototype.prepareRender = function (client, cam) {
            return (function (done) { return client.prepareRender(cam, done); });
        };
        parallelRenderer.prototype.nextRender = function (client) {
            var _this = this;
            if (this.lineIndex < this.canvas.height) {
                client.render(this.lineIndex, this.lineCount, function () { return _this.nextRender(client); });
                this.lineIndex += this.lineCount;
            }
            else {
                // wait for all render to finish
                for (var i = 0; i < this.clients.length; ++i) {
                    if (!this.clients[i].renderDone) {
                        return;
                    }
                }
                var ctx = this.canvas.getContext('2d');
                var imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                imageData.data.set(this.sharedRenderedData);
                ctx.putImageData(imageData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
                this.onRenderDone();
            }
        };
        return parallelRenderer;
    }());
    qec.parallelRenderer = parallelRenderer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var pointLightDTO = (function () {
        function pointLightDTO() {
        }
        return pointLightDTO;
    }());
    qec.pointLightDTO = pointLightDTO;
    var pointLight = (function () {
        function pointLight() {
            this.position = vec3.create();
        }
        pointLight.prototype.createFrom = function (dto) {
            vec3FromArray(this.position, dto.position);
        };
        return pointLight;
    }());
    qec.pointLight = pointLight;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var renderClient = (function () {
        function renderClient(name, canvas, sharedRenderedData) {
            var _this = this;
            this.name = name;
            this.canvas = canvas;
            this.sharedRenderedData = sharedRenderedData;
            this.initDone = false;
            this.prepareRenderDone = false;
            this.renderDone = false;
            this.camDTO = new qec.cameraDTO();
            var worker = new Worker("app/built/renderWorker.js");
            this.worker = worker;
            worker.onmessage = function (evt) {
                if (evt.data.type == qec.renderWorkerInitDoneMessage.staticType) {
                    _this.initDone = true;
                    // console.log(this.name + ' : initDone')
                    _this.onInitDone();
                }
                else if (evt.data.type == qec.renderWorkerPrepareRenderDoneMessage.staticType) {
                    _this.onPrepareRenderDone();
                }
                else if (evt.data.type == qec.renderWorkerRenderDoneMessage.staticType) {
                    var msg = evt.data;
                    //console.log(this.name + ' : render done at line ' + msg.lineIndex);
                    var ctx = _this.canvas.getContext('2d');
                    _this.sharedRenderedData.set(msg.imageData, msg.lineIndex * _this.canvas.width * 4);
                    console.log('client finished ' + name);
                    _this.renderDone = true;
                    _this.onRenderDone();
                }
            };
        }
        renderClient.prototype.init = function (rp, camera, onInitDone) {
            this.initDone = false;
            this.onInitDone = onInitDone;
            var sd = rp.sd;
            var msgOut = new qec.renderWorkerInitMessage();
            msgOut.topTexture = sd.topTexture;
            msgOut.topBounds = sd.topBounds;
            msgOut.profileTexture = sd.profileTexture;
            msgOut.profileBounds = sd.profileBounds;
            //msgOut.lightPos = rp.uLightPos;
            msgOut.canvasWidth = this.canvas.width;
            msgOut.canvasHeight = this.canvas.height;
            msgOut.camera = camera;
            this.worker.postMessage(msgOut);
        };
        renderClient.prototype.initDTO = function (sceneDTO, onInitDone) {
            this.initDone = false;
            this.onInitDone = onInitDone;
            var msgOut = new qec.renderWorkerInitDTOMessage();
            msgOut.sceneDTO = sceneDTO;
            msgOut.canvasWidth = this.canvas.width;
            msgOut.canvasHeight = this.canvas.height;
            this.worker.postMessage(msgOut);
        };
        renderClient.prototype.prepareRender = function (cam, onPrepareRenderDone) {
            console.log('client prepare render ' + name);
            this.prepareRenderDone = false;
            this.onPrepareRenderDone = onPrepareRenderDone;
            var msgOut = new qec.renderWorkerPrepareRenderMessage();
            cam.toDTO(this.camDTO);
            msgOut.cam = this.camDTO;
            this.worker.postMessage(msgOut);
        };
        renderClient.prototype.render = function (lineIndex, lineCount, onRenderDone) {
            console.log('client render ' + name);
            this.renderDone = false;
            this.onRenderDone = onRenderDone;
            var msgOut = new qec.renderWorkerRenderMessage();
            msgOut.lineIndex = lineIndex;
            msgOut.lineCount = lineCount;
            this.worker.postMessage(msgOut);
        };
        return renderClient;
    }());
    qec.renderClient = renderClient;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var renderCollide = (function () {
        function renderCollide() {
            this.debug = false;
            this.pos = vec3.create();
            this.MAX_STEPS = 64;
            this.EPS_INTERSECT = 0.001;
            this.hasCollided = false;
            this.dist = 0;
            this.posAll = vec3.create();
        }
        renderCollide.prototype.collide = function (sd, ro, rd) {
            this.sdIndex = 0;
            this.intersectDist(sd, ro, rd, 0, 100);
        };
        renderCollide.prototype.collideAll = function (sdArray, ro, rd) {
            var minDistAll = 66666;
            var hasCollidedAll = false;
            var sdIndexAll = 0;
            for (var i = 0; i < sdArray.length; ++i) {
                this.collide(sdArray[i], ro, rd);
                if (this.hasCollided && this.dist < minDistAll) {
                    //console.log('hasCollided : ' + i);
                    hasCollidedAll = true;
                    sdIndexAll = i;
                    minDistAll = this.dist;
                    vec3.copy(this.posAll, this.pos);
                }
            }
            this.hasCollided = hasCollidedAll;
            this.dist = minDistAll;
            vec3.copy(this.pos, this.posAll);
            this.sdIndex = sdIndexAll;
        };
        renderCollide.prototype.intersectDist = function (sd, ro, rd, tMin, tMax) {
            var t = tMin;
            this.dist = -1.0;
            this.hasCollided = false;
            for (var i = 0; i < this.MAX_STEPS; ++i) {
                this.pos[0] = ro[0] + rd[0] * t;
                this.pos[1] = ro[1] + rd[1] * t;
                this.pos[2] = ro[2] + rd[2] * t;
                var dt = sd.getDist(this.pos, false, this.debug); // * this.c_fSmooth;
                //this.minDist = Math.min(this.minDist, dt);
                if (this.debug)
                    console.log('march #' + i + ' : ' + dt + ' : ' + vec3.str(this.pos));
                if (dt < this.EPS_INTERSECT) {
                    this.dist = t;
                    this.hasCollided = true;
                    break;
                }
                t += dt;
                if (t > tMax)
                    break;
            }
        };
        return renderCollide;
    }());
    qec.renderCollide = renderCollide;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var renderPixel = (function () {
        function renderPixel() {
            this.debug = false;
            this.out = vec4.create();
            this.MAX_STEPS = 100;
            this.c_fSmooth = 0.70;
            this.EPS_NORMAL_1 = 0.01;
            this.EPS_NORMAL_2 = 0.01;
            this.EPS_INTERSECT = 0.001;
            this.shadows = false;
            this.SS_K = 15.0;
            this.SS_MAX_STEPS = 64;
            this.SS_EPS = 0.005;
            this.outPos = vec3.create();
            this.outNormal = vec3.create();
            this.pos2 = vec3.create();
            this.sdColor = vec3.create();
            this.toLight2 = vec3.create();
            this.minusRd = vec3.create();
            this.distEpsPos = vec3.create();
            this.outLighting = vec3.create();
            this.reflRd = vec3.create();
            this.reflRo = vec3.create();
            this.reflPos = vec3.create();
            this.reflCol = vec3.create();
            this.showBoundingBox = false;
            this.reflection = false;
            this.rayToBounds = true;
            this.intersectPos = vec3.create();
            this.diffToLight = vec3.create();
            this.ssTmp = vec3.create();
        }
        renderPixel.prototype.init = function (settings) {
            this.sd = settings.sd;
            this.directionalLights = settings.directionalLights;
            this.spotLights = settings.spotLights;
            this.shadows = settings.shadows;
        };
        renderPixel.prototype.render = function (ro, rd, debugInfo) {
            if (debugInfo === void 0) { debugInfo = false; }
            this.debug = debugInfo;
            return this.doRender(ro, rd);
        };
        renderPixel.prototype.doRender = function (ro, rd) {
            if (this.debug)
                console.log('ro', ro, 'rd', rd);
            var hit = this.rayMarch(this.sd, ro, rd, this.out, this.outPos, this.outNormal);
            if (hit && this.reflection) {
                this.reflect(this.reflRd, rd, this.outNormal);
                for (var i = 0; i < 3; ++i)
                    this.reflRo[i] = this.outPos[i] + this.reflRd[i] * this.EPS_NORMAL_1;
                if (this.debug)
                    console.log('reflect: reflRo', this.reflRo, 'reflRd', this.reflRd);
                hit = this.rayMarch(this.sd, this.reflRo, this.reflRd, this.reflCol, this.outPos, this.outNormal);
                if (hit) {
                    if (this.debug)
                        console.log('reflect color: ', this.reflCol);
                    var KR = 0.1;
                    this.out[0] = (1 - KR) * this.out[0] + (KR * this.reflCol[0]);
                    this.out[1] = (1 - KR) * this.out[1] + (KR * this.reflCol[1]);
                    this.out[2] = (1 - KR) * this.out[2] + (KR * this.reflCol[2]);
                }
            }
            return this.out;
        };
        renderPixel.prototype.rayMarch = function (sd, ro, rd, outColor, outPos, outNormal) {
            /*
            #ifdef CHECK_BOUNDS
            if (intersectBounds(ro, rd)) {
            #endif
                
                #ifdef RENDER_STEPS
                int steps = intersectSteps(ro, rd);
                return vec3(float(MAX_STEPS-steps)/float(MAX_STEPS));
                #else
            */
            var t = this.intersectDist(sd, ro, rd, 0, 100);
            if (t > 0.0) {
                vec4.set(outColor, 0, 0, 0, 1);
                outPos[0] = ro[0] + rd[0] * t;
                outPos[1] = ro[1] + rd[1] * t;
                outPos[2] = ro[2] + rd[2] * t;
                this.pos2[0] = outPos[0] - rd[0] * this.EPS_NORMAL_1;
                this.pos2[1] = outPos[1] - rd[1] * this.EPS_NORMAL_1;
                this.pos2[2] = outPos[2] - rd[2] * this.EPS_NORMAL_1;
                this.getNormal(sd, this.pos2, outNormal);
                this.sd.getMaterial(outPos).getColor(this.sdColor);
                var KD = 0.7;
                var KS = 0.5;
                for (var i = 0; i < this.spotLights.length; ++i) {
                    this.getSpotLighting(i, outPos, outNormal, rd, this.outLighting);
                    for (var j = 0; j < 3; ++j)
                        outColor[j] += this.outLighting[2] * (KS * this.outLighting[1] + KD * this.outLighting[0] * this.sdColor[j]);
                }
                for (var i = 0; i < this.directionalLights.length; ++i) {
                    this.getDirectionalLighting(i, outPos, outNormal, rd, this.outLighting);
                    for (var j = 0; j < 3; ++j)
                        outColor[j] += this.outLighting[2] * (KS * this.outLighting[1] + KD * this.outLighting[0] * this.sdColor[j]);
                }
            }
            else {
                vec4.set(outColor, 0, 0, 0, 1);
            }
            return t > 0.0;
        };
        renderPixel.prototype.intersectDist = function (sd, ro, rd, tMin, tMax) {
            var t = tMin;
            var dist = -1.0;
            for (var i = 0; i < this.MAX_STEPS; ++i) {
                for (var j = 0; j < 3; ++j)
                    this.intersectPos[j] = ro[j] + rd[j] * t;
                var dt;
                if (this.rayToBounds)
                    dt = sd.getDist2(this.intersectPos, rd, this.showBoundingBox, this.debug); // * this.c_fSmooth;
                else
                    dt = sd.getDist(this.intersectPos, this.showBoundingBox, this.debug); // * this.c_fSmooth;
                if (dt < this.EPS_INTERSECT) {
                    dist = t;
                    break;
                }
                t += dt;
                if (t > tMax)
                    break;
            }
            return dist;
        };
        renderPixel.prototype.getNormal = function (sd, pos, out) {
            out[0] = this.getNormalAt(sd, pos, 0);
            out[1] = this.getNormalAt(sd, pos, 1);
            out[2] = this.getNormalAt(sd, pos, 2);
            vec3.normalize(out, out);
        };
        renderPixel.prototype.getNormalAt = function (sd, pos, index) {
            if (this.debug)
                console.log('Compute Normal');
            var eps = this.EPS_NORMAL_2;
            vec3.copy(this.distEpsPos, pos);
            this.distEpsPos[index] += eps;
            var a = sd.getDist(this.distEpsPos, this.showBoundingBox, this.debug);
            this.distEpsPos[index] -= 2 * eps;
            var b = sd.getDist(this.distEpsPos, this.showBoundingBox, this.debug);
            return a - b;
        };
        renderPixel.prototype.getSpotLighting = function (i, pos, normal, rd, out) {
            var intensity = this.spotLights[i].intensity;
            var lightPos = this.spotLights[i].position;
            vec3.subtract(this.diffToLight, lightPos, pos);
            vec3.normalize(this.diffToLight, this.diffToLight);
            var lightDist = vec3.distance(lightPos, pos);
            out[0] = intensity * this.getDiffuse(pos, normal, this.diffToLight);
            out[1] = intensity * this.getSpecular(pos, normal, this.diffToLight, rd);
            out[2] = this.shadows ? this.getShadow(pos, this.diffToLight, lightDist) : 1;
            if (this.debug)
                console.log('toLight:', this.diffToLight, 'normal', normal, 'diffuse', out[0], 'specular', out[1], 'shadow', out[2]);
        };
        renderPixel.prototype.getDirectionalLighting = function (i, pos, normal, rd, out) {
            var intensity = this.directionalLights[i].intensity;
            vec3.scale(this.diffToLight, this.directionalLights[i].direction, -1);
            var lightDist = 10;
            out[0] = intensity * this.getDiffuse(pos, normal, this.diffToLight);
            out[1] = intensity * this.getSpecular(pos, normal, this.diffToLight, rd);
            out[2] = this.shadows ? this.getShadow(pos, this.diffToLight, lightDist) : 1;
            if (this.debug)
                console.log('toLight:', this.diffToLight, 'normal', normal, 'diffuse', out[0], 'specular', out[1], 'shadow', out[2], this.shadows);
        };
        renderPixel.prototype.getDiffuse = function (pos, normal, toLight) {
            var diffuse = vec3.dot(toLight, normal);
            diffuse = Math.max(diffuse, 0);
            return diffuse;
        };
        renderPixel.prototype.getSpecular = function (pos, normal, toLight, rd) {
            vec3.scale(this.toLight2, toLight, -1);
            this.reflect(this.reflRd, this.toLight2, normal);
            vec3.scale(this.minusRd, rd, -1);
            var specAngle = Math.max(vec3.dot(this.reflRd, this.minusRd), 0.0);
            var specular = Math.pow(specAngle, 4.0);
            return specular;
        };
        renderPixel.prototype.getShadow = function (pos, toLight, lightDist) {
            var shadow = 1.0;
            var t = this.SS_EPS;
            var dt;
            for (var i = 0; i < this.SS_MAX_STEPS; ++i) {
                vec3.scaleAndAdd(this.ssTmp, pos, toLight, t);
                if (this.rayToBounds)
                    dt = this.sd.getDist2(this.ssTmp, toLight, this.showBoundingBox, this.debug); // * this.c_fSmooth;
                else
                    dt = this.sd.getDist(this.ssTmp, this.showBoundingBox, this.debug); // * c_fSmooth;
                if (dt < this.EPS_INTERSECT)
                    return 0.0;
                //shadow = Math.min(shadow, this.SS_K*(dt/t));
                t += dt;
                if (t > lightDist)
                    break;
            }
            return MathClamp(shadow, 0.0, 1.0);
        };
        renderPixel.prototype.reflect = function (out, d, n) {
            var dot = vec3.dot(d, n);
            for (var i = 0; i < 3; ++i)
                out[i] = d[i] - 2 * dot * n[i];
        };
        return renderPixel;
    }());
    qec.renderPixel = renderPixel;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var renderPixelStepCount = (function () {
        function renderPixelStepCount() {
            this.debug = false;
            this.out = vec4.create();
            this.MAX_STEPS = 100;
            this.c_fSmooth = 0.70;
            this.EPS_NORMAL_1 = 0.01;
            this.EPS_NORMAL_2 = 0.01;
            this.EPS_INTERSECT = 0.001;
            this.SS_K = 15.0;
            this.SS_MAX_STEPS = 64;
            this.SS_EPS = 0.005;
            this.pos = vec3.create();
            this.normal = vec3.create();
            this.pos2 = vec3.create();
            this.toLight = vec3.create();
            this.distEpsPos = vec3.create();
            this.showBoundingBox = false;
            this.rayToBounds = false;
            this.stepCount = [0];
            this.intersectPos = vec3.create();
        }
        renderPixelStepCount.prototype.init = function (settings) {
            this.sd = settings.sd;
        };
        renderPixelStepCount.prototype.render = function (ro, rd, debugInfo) {
            if (debugInfo === void 0) { debugInfo = false; }
            this.debug = debugInfo;
            return this.doRender(ro, rd);
        };
        renderPixelStepCount.prototype.doRender = function (ro, rd) {
            if (this.debug)
                console.log('ro', ro, 'rd', rd);
            this.rayMarch(this.sd, ro, rd, this.out);
            /*
            #ifdef FX_REFLECTION
            if (currHit) {
                vec3 reflRay = reflect(rd, currNor);
                col = col*(1.0-KR) + rayMarch(currPos+reflRay*EPS1, reflRay)*KR;
            }
            #endif
            */
            //return col;
            return this.out;
        };
        renderPixelStepCount.prototype.rayMarch = function (sd, ro, rd, out) {
            /*
            #ifdef CHECK_BOUNDS
            if (intersectBounds(ro, rd)) {
            #endif
                
                #ifdef RENDER_STEPS
                int steps = intersectSteps(ro, rd);
                return vec3(float(MAX_STEPS-steps)/float(MAX_STEPS));
                #else
            */
            var t = this.intersectDist(sd, ro, rd, 0, 100, this.stepCount);
            if (t > 0.0) {
                var r = this.stepCount[0] / this.MAX_STEPS;
                out[0] = r;
                out[1] = 0;
                out[2] = 0;
                out[3] = 1.0;
            }
            else {
                out[0] = 1.0;
                out[1] = 1.0;
                out[2] = 1.0;
                out[3] = 1.0;
            }
        };
        renderPixelStepCount.prototype.intersectDist = function (sd, ro, rd, tMin, tMax, stepCount) {
            var t = tMin;
            var dist = -1.0;
            var i = 0;
            for (i = 0; i < this.MAX_STEPS; ++i) {
                this.intersectPos[0] = ro[0] + rd[0] * t;
                this.intersectPos[1] = ro[1] + rd[1] * t;
                this.intersectPos[2] = ro[2] + rd[2] * t;
                var dt;
                if (this.rayToBounds)
                    dt = sd.getDist2(this.intersectPos, rd, this.showBoundingBox, this.debug); // * this.c_fSmooth;
                else
                    dt = sd.getDist(this.intersectPos, this.showBoundingBox, this.debug); // * this.c_fSmooth;
                if (this.debug)
                    console.log('march #' + i + ' : ' + dt + ' : ' + vec3.str(this.intersectPos));
                if (dt < this.EPS_INTERSECT) {
                    dist = t;
                    break;
                }
                t += dt;
                if (t > tMax)
                    break;
            }
            stepCount[0] = i;
            return dist;
        };
        renderPixelStepCount.prototype.getNormal = function (sd, pos, out) {
            out[0] = this.getNormalAt(sd, pos, 0);
            out[1] = this.getNormalAt(sd, pos, 1);
            out[2] = this.getNormalAt(sd, pos, 2);
            vec3.normalize(out, out);
        };
        renderPixelStepCount.prototype.getNormalAt = function (sd, pos, index) {
            if (this.debug)
                console.log('Compute Normal');
            var eps = this.EPS_NORMAL_2;
            vec3.copy(this.distEpsPos, pos);
            this.distEpsPos[index] += eps;
            var a = sd.getDist(this.distEpsPos, this.showBoundingBox, this.debug);
            this.distEpsPos[index] -= 2 * eps;
            var b = sd.getDist(this.distEpsPos, this.showBoundingBox, this.debug);
            return a - b;
        };
        return renderPixelStepCount;
    }());
    qec.renderPixelStepCount = renderPixelStepCount;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var renderSettings = (function () {
        function renderSettings() {
            this.directionalLights = [];
            this.spotLights = [];
            this.camera = new qec.camera();
        }
        return renderSettings;
    }());
    qec.renderSettings = renderSettings;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var renderUnit = (function () {
        function renderUnit() {
            this.ro = vec3.create();
            this.rd = vec3.create();
        }
        renderUnit.prototype.getImageData = function () {
            return this.imageData;
        };
        renderUnit.prototype.setCanvasSize = function (width, height) {
            this.width = width;
            this.height = height;
        };
        renderUnit.prototype.renderDebug = function (x, y, rp, camera) {
            camera.rendererInit(this.width, this.height);
            camera.getRay(x, y, this.ro, this.rd);
            rp.render(this.ro, this.rd, true);
        };
        renderUnit.prototype.render = function (rp, camera) {
            this.renderLines(rp, camera, 0, this.height);
        };
        renderUnit.prototype.renderLines = function (rp, camera, lineIndex, lineCount) {
            //var color = vec4.set(vec4.create(),0,0,1,1); 
            if (this.imageData == null || this.imageData.length != 4 * this.width * lineCount)
                this.imageData = new Uint8ClampedArray(4 * this.width * lineCount);
            camera.rendererInit(this.width, this.height);
            for (var j = 0; j < lineCount; ++j) {
                for (var i = 0; i < this.width; i++) {
                    camera.getRay(i, j + lineIndex, this.ro, this.rd);
                    var color = rp.render(this.ro, this.rd, false);
                    var q = 4 * (j * this.width + i);
                    this.imageData[q + 0] = 255 * color[0];
                    this.imageData[q + 1] = 255 * color[1];
                    this.imageData[q + 2] = 255 * color[2];
                    this.imageData[q + 3] = 255 * color[3];
                }
            }
        };
        return renderUnit;
    }());
    qec.renderUnit = renderUnit;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var renderWorkerInitMessage = (function () {
        function renderWorkerInitMessage() {
            this.type = 'init';
        }
        return renderWorkerInitMessage;
    }());
    qec.renderWorkerInitMessage = renderWorkerInitMessage;
    var renderWorkerInitDTOMessage = (function () {
        function renderWorkerInitDTOMessage() {
            this.type = 'initDTO';
        }
        return renderWorkerInitDTOMessage;
    }());
    qec.renderWorkerInitDTOMessage = renderWorkerInitDTOMessage;
    var renderWorkerInitDoneMessage = (function () {
        function renderWorkerInitDoneMessage() {
            this.type = 'initDone';
        }
        renderWorkerInitDoneMessage.staticType = 'initDone';
        return renderWorkerInitDoneMessage;
    }());
    qec.renderWorkerInitDoneMessage = renderWorkerInitDoneMessage;
    var renderWorkerPrepareRenderMessage = (function () {
        function renderWorkerPrepareRenderMessage() {
            this.type = 'prepareRender';
        }
        renderWorkerPrepareRenderMessage.staticType = 'prepareRender';
        return renderWorkerPrepareRenderMessage;
    }());
    qec.renderWorkerPrepareRenderMessage = renderWorkerPrepareRenderMessage;
    var renderWorkerPrepareRenderDoneMessage = (function () {
        function renderWorkerPrepareRenderDoneMessage() {
            this.type = 'prepareRenderDone';
        }
        renderWorkerPrepareRenderDoneMessage.staticType = 'prepareRenderDone';
        return renderWorkerPrepareRenderDoneMessage;
    }());
    qec.renderWorkerPrepareRenderDoneMessage = renderWorkerPrepareRenderDoneMessage;
    var renderWorkerRenderMessage = (function () {
        function renderWorkerRenderMessage() {
            this.type = 'render';
        }
        renderWorkerRenderMessage.staticType = 'render';
        return renderWorkerRenderMessage;
    }());
    qec.renderWorkerRenderMessage = renderWorkerRenderMessage;
    var renderWorkerRenderDoneMessage = (function () {
        function renderWorkerRenderDoneMessage() {
            this.type = 'renderDone';
        }
        renderWorkerRenderDoneMessage.staticType = 'renderDone';
        return renderWorkerRenderDoneMessage;
    }());
    qec.renderWorkerRenderDoneMessage = renderWorkerRenderDoneMessage;
    var renderWorker = (function () {
        function renderWorker() {
            this.camera = new qec.camera();
            this.renderUnit = new qec.renderUnit();
            this.renderPixel = new qec.renderPixel();
            this.sd = new qec.sdFields();
        }
        renderWorker.prototype.setPostMessageFunction = function (f) {
            this.postMessage = f;
        };
        renderWorker.prototype.onmessage = function (e) {
            if (e.data == null || e.data.type == null || !this[e.data.type]) {
                console.error('message non reconnu : ', e.data);
            }
            this[e.data.type](e.data);
        };
        renderWorker.prototype.init = function (message) {
            console.log('renderWorker init');
            this.populate(this.camera, message.camera);
            var _topTexture = this.populate(new qec.floatTexture(), message.topTexture);
            var _profileTexture = this.populate(new qec.floatTexture(), message.profileTexture);
            var _light = new qec.pointLight();
            vec3.copy(_light.position, message.lightPos);
            this.sd.init(_topTexture, message.topBounds, _profileTexture, message.profileBounds);
            //this.renderPixel.init(this.sd, _light, false);
            this.renderUnit.setCanvasSize(message.canvasWidth, message.canvasHeight);
            var msg = new renderWorkerInitDoneMessage();
            this.postMessage(msg);
        };
        renderWorker.prototype.initDTO = function (message) {
            var _this = this;
            console.log('renderWorker init DTO');
            this.renderUnit.setCanvasSize(message.canvasWidth, message.canvasHeight);
            this.sc = new qec.scene();
            this.sc.setDebug(false);
            this.sc.create(message.sceneDTO, function () {
                var scrend = _this.sc.get(function (o) { return o instanceof qec.scRenderer; }, 'render');
                _this.renderPixel = new qec.renderPixel();
                _this.renderPixel.init(scrend.settings);
                _this.camera = scrend.camera;
                console.log('renderWorker init DTO OK');
                var msg = new renderWorkerInitDoneMessage();
                _this.postMessage(msg);
            });
        };
        renderWorker.prototype.prepareRender = function (message) {
            this.camera.createFrom(message.cam);
            console.log('renderWorker prepare render OK');
            var msg = new renderWorkerPrepareRenderDoneMessage();
            this.postMessage(msg);
        };
        renderWorker.prototype.render = function (message) {
            console.log('Worker rendering ' + message.lineIndex);
            this.renderUnit.renderLines(this.renderPixel, this.camera, message.lineIndex, message.lineCount);
            var msgOut = new renderWorkerRenderDoneMessage();
            msgOut.lineIndex = message.lineIndex;
            msgOut.lineCount = message.lineCount;
            msgOut.imageData = this.renderUnit.getImageData();
            console.log('Worker rendering OK ' + message.lineIndex);
            this.postMessage(msgOut);
        };
        renderWorker.prototype.populate = function (object, json) {
            for (var k in json) {
                object[k] = json[k];
            }
            return object;
        };
        return renderWorker;
    }());
    qec.renderWorker = renderWorker;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var simpleRenderer = (function () {
        function simpleRenderer() {
            this.renderUnit = new qec.renderUnit();
            this.rp = new qec.renderPixel();
            this.shadows = false;
        }
        simpleRenderer.prototype.setContainerAndSize = function (element, rWidth, rHeight) {
            var canvas = document.createElement('canvas');
            this.canvas = canvas;
            canvas.width = rWidth;
            canvas.height = rHeight;
            canvas.style.border = "1px solid";
            element.appendChild(canvas);
            this.renderUnit.setCanvasSize(canvas.width, canvas.height);
        };
        simpleRenderer.prototype.getCanvas = function () {
            return this.canvas;
        };
        simpleRenderer.prototype.setRenderSteps = function (renderStep) {
            this.rp = renderStep ? new qec.renderPixelStepCount() : new qec.renderPixel();
        };
        simpleRenderer.prototype.showBoundingBox = function (b) {
            if (this.rp instanceof qec.renderPixel)
                this.rp.showBoundingBox = b;
        };
        simpleRenderer.prototype.renderDebug = function (x, y, settings) {
            this.rp.init(settings);
            this.renderUnit.renderDebug(x, y, this.rp, settings.camera);
        };
        simpleRenderer.prototype.render = function (settings) {
            this.rp.init(settings);
            this.renderUnit.render(this.rp, settings.camera);
            var w = this.canvas.width;
            var h = this.canvas.height;
            var ctx = this.canvas.getContext('2d');
            //ctx.fillRect(0, 0, w, h);
            var imageData = ctx.getImageData(0, 0, w, h);
            imageData.data.set(this.renderUnit.getImageData());
            ctx.putImageData(imageData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
        };
        simpleRenderer.prototype.updateShader = function (sd, lightCount) { };
        simpleRenderer.prototype.updateAllUniformsForAll = function () { };
        simpleRenderer.prototype.updateAllUniforms = function (sd) { };
        simpleRenderer.prototype.updateDiffuse = function (sd) { };
        simpleRenderer.prototype.updateTransform = function (sd) { };
        simpleRenderer.prototype.updateFloatTextures = function (sd) { };
        return simpleRenderer;
    }());
    qec.simpleRenderer = simpleRenderer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var spotLightDTO = (function () {
        function spotLightDTO() {
        }
        return spotLightDTO;
    }());
    qec.spotLightDTO = spotLightDTO;
    var spotLight = (function () {
        function spotLight() {
            this.position = vec3.create();
            this.direction = vec3.create();
            this.intensity = 1;
        }
        spotLight.prototype.createFrom = function (dto) {
            vec3FromArray(this.position, dto.position);
            vec3FromArray(this.direction, dto.direction);
            this.intensity = dto.intensity;
            vec3.normalize(this.direction, this.direction);
        };
        return spotLight;
    }());
    qec.spotLight = spotLight;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var allExamples = [];
    function pushExample(title, f) {
        allExamples.push({ title: title, create: f });
    }
    qec.pushExample = pushExample;
    function getExamples() {
        return allExamples;
    }
    qec.getExamples = getExamples;
    function createExample(title) {
        var found = allExamples.find(function (x) { return x.title === title; });
        return found.create();
    }
    qec.createExample = createExample;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Box", function () { return new exBox(); });
    var exBox = (function () {
        function exBox() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-2, -4, 2],
                direction: [2, 4, 2],
                intensity: 1
            };
            this.box = {
                type: 'sdBoxDTO',
                halfSize: [0.5, 0.5, 0.5],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                },
                transform: mat4Identity()
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.box,
                camera: this.camera,
            };
        }
        return exBox;
    }());
    qec.exBox = exBox;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("BoxAndShadow", function () { return new exBoxAndShadow(); });
    var exBoxAndShadow = (function () {
        function exBoxAndShadow() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -5, 2],
                target: [0, 1, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-1, -1, 2],
                direction: [1, 1, 2],
                intensity: 1
            };
            this.plane = {
                type: 'sdPlaneDTO',
                normal: [0, 0, 1],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                }
            };
            this.box = {
                type: 'sdBoxDTO',
                halfSize: [0.3, 0.3, 0.6],
                //transform: [0, 0, 0.4],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 0, 0]
                },
                transform: mat4Identity()
            };
            this.union = {
                type: 'sdUnionDTO',
                a: this.plane,
                b: this.box,
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.union,
                camera: this.camera,
            };
        }
        return exBoxAndShadow;
    }());
    qec.exBoxAndShadow = exBoxAndShadow;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("FieldsCube", function () { return new exFieldsCube(); });
    var exFieldsCube = (function () {
        function exFieldsCube() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-2, -4, 2],
                direction: [2, 4, 2],
                intensity: 1
            };
            this.topCube = {
                type: 'scImageDTO',
                src: 'data/cubeTop.png'
            };
            this.profileCube = {
                type: 'scImageDTO',
                src: 'data/cubeProfile.png'
            };
            this.fieldsCube = {
                type: 'sdFieldsDTO',
                topImage: this.topCube,
                topBounds: [-0.5, -0.5, 0.5, 0.5],
                profileImage: this.profileCube,
                profileBounds: [-0.5, -0.5, 0.5, 0.5],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                },
                transform: mat4.identity(mat4.create())
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.fieldsCube,
                camera: this.camera,
            };
        }
        return exFieldsCube;
    }());
    qec.exFieldsCube = exFieldsCube;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("FieldsCubeProfileBounds", function () { return new exFieldsCubeProfileBounds(); });
    var exFieldsCubeProfileBounds = (function () {
        function exFieldsCubeProfileBounds() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-2, -4, 2],
                direction: [2, 4, 2],
                intensity: 1
            };
            this.topCube = {
                type: 'scImageDTO',
                src: 'data/cubeTopWithBounds.png'
            };
            this.profileCube = {
                type: 'scImageDTO',
                src: 'data/cubeProfileWithBounds.png'
            };
            this.fieldsCube = {
                type: 'sdFieldsDTO',
                topImage: this.topCube,
                topBounds: [-0.5, -0.25, 0.5, 0.25],
                profileImage: this.profileCube,
                profileBounds: [-0.5, -0.5, 0, 0.5],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                },
                transform: mat4.identity(mat4.create())
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.fieldsCube,
                camera: this.camera,
            };
        }
        return exFieldsCubeProfileBounds;
    }());
    qec.exFieldsCubeProfileBounds = exFieldsCubeProfileBounds;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("FieldsFont", function () { return new exFieldsFont(); });
    var exFieldsFont = (function () {
        function exFieldsFont() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-2, -4, 2],
                direction: [2, 4, 2],
                intensity: 1
            };
            this.topFont = {
                type: 'scImageDTO',
                src: 'data/font.png'
            };
            this.profileFont = {
                type: 'scImageDTO',
                src: 'data/cubeProfile.png'
            };
            this.fontFields = {
                type: 'sdFieldsDTO',
                topImage: this.topFont,
                topBounds: [-0.5, -0.5, 0.5, 0.5],
                profileImage: this.profileFont,
                profileBounds: [-0.2, -0.2, 0.2, 0.2],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                },
                transform: mat4.identity(mat4.create())
            };
            this.plane = {
                type: 'sdPlaneDTO',
                normal: [0, 0, 1],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                }
            };
            this.union = {
                type: 'sdUnionDTO',
                a: this.plane,
                b: this.fontFields,
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.union,
                camera: this.camera,
            };
        }
        return exFieldsFont;
    }());
    qec.exFieldsFont = exFieldsFont;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("FieldsWithTransform", function () { return new exFieldsWithTransform(); });
    var exFieldsWithTransform = (function () {
        function exFieldsWithTransform() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-2, -4, 2],
                direction: [2, 4, 2],
                intensity: 1
            };
            this.topCube = {
                type: 'scImageDTO',
                src: 'data/cubeTop.png'
            };
            this.profileCube = {
                type: 'scImageDTO',
                src: 'data/cubeProfile.png'
            };
            this.fieldsCube = {
                type: 'sdFieldsDTO',
                topImage: this.topCube,
                topBounds: [-0.5, -0.5, 0.5, 0.5],
                profileImage: this.profileCube,
                profileBounds: [-0.5, -0.5, 0.5, 0.5],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                },
                transform: mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, -0.5))
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.fieldsCube,
                camera: this.camera,
            };
        }
        return exFieldsWithTransform;
    }());
    qec.exFieldsWithTransform = exFieldsWithTransform;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Intersection", function () { return new exIntersection(); });
    var exIntersection = (function () {
        function exIntersection() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [2, -4, 2],
                direction: [-2, 4, 2],
                intensity: 1
            };
            this.ground = {
                type: 'sdBoxDTO',
                halfSize: [0.5, 0.1, 0.25],
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Identity()
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.4,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 0, 1]
                }
            };
            this.intersection = {
                type: 'sdIntersectionDTO',
                a: this.ground,
                b: this.sphere
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.intersection,
                camera: this.camera,
            };
        }
        return exIntersection;
    }());
    qec.exIntersection = exIntersection;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Lighting1", function () { return new exLighting1(); });
    var exLighting1 = (function () {
        function exLighting1() {
            this.camera = {
                type: 'cameraDTO',
                position: [0, -6, 2],
                target: [0, 0, 0.5],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.keyLight = {
                type: 'directionalLightDTO',
                position: [-2, -2, 0],
                direction: [1, 1, -2],
                intensity: 0.8
            };
            this.fillLight = {
                type: 'directionalLightDTO',
                position: [2, -2, 0],
                direction: [-1, 1, -1],
                intensity: 0.2
            };
            this.rimLight = {
                type: 'spotLightDTO',
                position: [2, 2, 0.5],
                direction: [-1, -1, 0.1],
                intensity: 0.2
            };
            this.render = {
                type: 'scRendererDTO',
                directionalLights: [this.keyLight, this.fillLight],
                spotLights: [this.rimLight],
                distance: null,
                camera: this.camera,
            };
            this.plane = {
                type: 'sdPlaneDTO',
                normal: [0, 0, 1],
                material: {
                    type: 'materialDTO',
                    diffuse: [1.5, 1.5, 1.5]
                }
            };
            var colors = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            var n = 3;
            var sd = new qec.sdUnion();
            for (var i = 0; i < n; ++i) {
                var r = i / (n - 1);
                var box = {
                    type: 'sdBoxDTO',
                    halfSize: [0.25, 0.25, 0.5],
                    material: {
                        type: 'materialDTO',
                        diffuse: colors[i]
                    },
                    transform: mat4Translate(-(n - 1) / 2 + i * 1, 0, 0.5)
                };
                var sdb = new qec.sdBox();
                sdb.createFrom(box);
                sd.array.push(sdb);
            }
            /*
                        for (var i=0 ; i < n; ++i)
                        {
                            var r = i/(n-1);
                            var box: sdBoxDTO = {
                                type: 'sdBoxDTO',
                                halfSize : [0.25, 0.25, 0.5],
                                material : {
                                    type:'materialDTO',
                                    diffuse : [1, r, 1]
                                },
                                transform : mat4Translate(-(n-1)/2 + i*1, 1, 0.5)
                            };
                            var sdb =  new sdBox();
                            sdb.createFrom(box);
                            sd.array.push(sdb);
                        }
            */
            for (var i = 0; i < n; ++i) {
                var r = i / (n - 1);
                var sphere = {
                    type: 'sdBoxDTO',
                    radius: 0.35,
                    material: {
                        type: 'materialDTO',
                        diffuse: colors[i]
                    },
                    transform: mat4Translate(-(n - 1) / 2 + i * 1, 0, 0.5)
                };
                var sds = new qec.sdSphere();
                sds.createFrom(sphere);
                sd.array.push(sds);
            }
            var sdp = new qec.sdPlane();
            sdp.createFrom(this.plane);
            sd.array.push(sdp);
            this.render.distance = {};
            this.render.distance['__instance'] = sd;
        }
        return exLighting1;
    }());
    qec.exLighting1 = exLighting1;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Owl", function () { return new exOwl(); });
    var exOwl = (function () {
        function exOwl() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-2, -4, 2],
                direction: [2, 4, 2],
                intensity: 1
            };
            /*
                    svg : scSvgDTO = {
                        type: 'scSvgDTO'
                        src: 'data/tuto-owl/cartoon-owl.svg'
                    };
            */
            this.top1 = {
                type: 'scImageDTO',
                src: 'data/tuto-owl/top1.png'
            };
            this.profile1 = {
                type: 'scImageDTO',
                src: 'data/cubeProfile.png'
            };
            this.fields = {
                type: 'sdFieldsDTO',
                topImage: this.top1,
                topBounds: [-0.5, -0.5, 0.5, 0.5],
                profileImage: this.profile1,
                profileBounds: [-0.5, -0.5, 0.5, 0.5],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                },
                transform: mat4.identity(mat4.create())
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.fields,
                camera: this.camera,
            };
        }
        return exOwl;
    }());
    qec.exOwl = exOwl;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Plane", function () { return new exPlane(); });
    var exPlane = (function () {
        function exPlane() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 1],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [0, 0, 1],
                direction: [0, 0, -1],
                intensity: 1
            };
            this.plane = {
                type: 'sdPlaneDTO',
                normal: [0, 0, 1],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                }
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.plane,
                camera: this.camera,
            };
        }
        return exPlane;
    }());
    qec.exPlane = exPlane;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Sphere", function () { return new exSphere(); });
    var exSphere = (function () {
        function exSphere() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-2, -4, 2],
                direction: [2, 4, 2],
                intensity: 1
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.4,
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 1]
                }
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.sphere,
                camera: this.camera,
            };
        }
        return exSphere;
    }());
    qec.exSphere = exSphere;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("SphereAndShadow", function () { return new exSphereAndShadow(); });
    var exSphereAndShadow = (function () {
        function exSphereAndShadow() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -5, 2],
                target: [0, 1, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [-1, -1, 2],
                direction: [1, 1, 2],
                intensity: 1
            };
            this.plane = {
                type: 'sdPlaneDTO',
                normal: [0, 0, 1],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 1, 0]
                }
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.4,
                transform: mat4Translate(0, 0, 0.4),
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 0, 0]
                }
            };
            this.union = {
                type: 'sdUnionDTO',
                a: this.plane,
                b: this.sphere,
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.union,
                camera: this.camera,
            };
        }
        return exSphereAndShadow;
    }());
    qec.exSphereAndShadow = exSphereAndShadow;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Subtraction", function () { return new exSubtraction(); });
    var exSubtraction = (function () {
        function exSubtraction() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [2, -4, 2],
                direction: [-2, 4, 2],
                intensity: 1
            };
            this.ground = {
                type: 'sdBoxDTO',
                halfSize: [0.5, 0.1, 0.25],
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Identity()
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.4,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 0, 1]
                }
            };
            this.subtraction = {
                type: 'sdSubtractionDTO',
                a: this.ground,
                b: this.sphere
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.subtraction,
                camera: this.camera,
            };
        }
        return exSubtraction;
    }());
    qec.exSubtraction = exSubtraction;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Union", function () { return new exUnion(); });
    var exUnion = (function () {
        function exUnion() {
            this.camera = {
                type: 'cameraDTO',
                position: [1, -3, 3],
                target: [0, 0, 0],
                up: [0, 0, 1],
                fov: Math.PI / 6
            };
            this.light = {
                type: 'spotLightDTO',
                position: [2, -4, 2],
                direction: [-2, 4, 2],
                intensity: 1
            };
            this.ground = {
                type: 'sdBoxDTO',
                halfSize: [0.5, 0.1, 0.25],
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Identity()
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.4,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 0, 1]
                }
            };
            this.union = {
                type: 'sdUnionDTO',
                a: this.ground,
                b: this.sphere
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.union,
                camera: this.camera,
            };
        }
        return exUnion;
    }());
    qec.exUnion = exUnion;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var material = (function () {
        function material() {
            this.diffuse = vec3.create();
        }
        material.prototype.createFrom = function (dto) {
            vec3FromArray(this.diffuse, dto.diffuse);
        };
        material.prototype.getColor = function (out) {
            vec3.copy(out, this.diffuse);
        };
        material.prototype.setDiffuse = function (r, g, b) {
            vec3.set(this.diffuse, r, g, b);
        };
        return material;
    }());
    qec.material = material;
})(qec || (qec = {}));
var qec;
(function (qec) {
    //https://tavianator.com/fast-branchless-raybounding-box-intersections/
    var raybox = (function () {
        function raybox() {
        }
        raybox.intersection = function (b, ro, rd, debug) {
            var tmin = -10000; //-INFINITY;
            var tmax = 10000; //INFINITY;
            for (var i = 0; i < 3; ++i)
                if (rd[i] != 0.0) {
                    var t1 = (-b[i] - ro[i]) / rd[i]; /*-b[0] = b.min.x*/
                    var t2 = (b[i] - ro[i]) / rd[i]; /* b[0] = b.max.x*/
                    tmin = Math.max(tmin, Math.min(t1, t2));
                    tmax = Math.min(tmax, Math.max(t1, t2));
                }
            if (debug)
                console.log('rayboxintersection ' + 'tmin=' + tmin + 'tmax=' + tmax, 'box', b, 'ro', ro, 'rd', rd);
            if (tmax <= tmin)
                return 10000;
            return tmin;
        };
        raybox.inbox = function (b, ro, m) {
            return ro[0] > -(b[0] + m) && ro[0] < (b[0] + m)
                && ro[1] > -(b[1] + m) && ro[1] < (b[1] + m)
                && ro[2] > -(b[2] + m) && ro[2] < (b[2] + m);
        };
        return raybox;
    }());
    qec.raybox = raybox;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var scImageDTO = (function () {
        function scImageDTO() {
        }
        return scImageDTO;
    }());
    qec.scImageDTO = scImageDTO;
    var scImage = (function () {
        function scImage() {
        }
        scImage.prototype.createAsyncFrom = function (dto, done) {
            var _this = this;
            var img = new Image();
            img.onload = function () {
                _this.image = img;
                done();
            };
            img.src = dto.src;
        };
        ;
        return scImage;
    }());
    qec.scImage = scImage;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var scRendererDTO = (function () {
        function scRendererDTO() {
        }
        return scRendererDTO;
    }());
    qec.scRendererDTO = scRendererDTO;
    var scRenderer = (function () {
        function scRenderer() {
            this.settings = new qec.renderSettings();
        }
        scRenderer.prototype.createFrom = function (dto) {
            this.camera = dto.camera['__instance'];
            this.distance = dto.distance['__instance'];
            this.settings.boundingBoxes = false;
            this.settings.shadows = false;
            this.settings.sd = this.distance;
            this.settings.camera = this.camera;
            this.settings.spotLights = dto.spotLights.map(function (l) { return l['__instance']; });
            this.settings.directionalLights = dto.directionalLights.map(function (l) { return l['__instance']; });
        };
        return scRenderer;
    }());
    qec.scRenderer = scRenderer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var scene = (function () {
        function scene() {
            this.sceneBase = new qec.sceneBase();
            var s = this.sceneBase;
            s.register('cameraDTO', qec.camera);
            s.register('pointLightDTO', qec.pointLight);
            s.register('directionalLightDTO', qec.directionalLight);
            s.register('spotLightDTO', qec.spotLight);
            s.register('scRendererDTO', qec.scRenderer);
            s.register('sdBoxDTO', qec.sdBox);
            s.register('sdFieldsDTO', qec.sdFields);
            s.register('sdIntersectionDTO', qec.sdIntersection);
            s.register('sdPlaneDTO', qec.sdPlane);
            s.register('sdSphereDTO', qec.sdSphere);
            s.register('sdSubtractionDTO', qec.sdSubtraction);
            s.register('sdUnionDTO', qec.sdUnion);
        }
        scene.prototype.setDebug = function (b) {
            this.sceneBase.debugInfo = b;
        };
        scene.prototype.create = function (sceneDTO, done) {
            var _this = this;
            this.loadImages(sceneDTO, function () { return _this.createStep2(sceneDTO, done); });
            //this.loadDistanceFields(sceneDTO, ()=>this.createStep2(sceneDTO, done));
        };
        scene.prototype.createOne = function (sceneDTO, name) {
            return this.sceneBase.createOne(name, sceneDTO[name]);
        };
        scene.prototype.createStep2 = function (sceneDTO, done) {
            this.sceneBase.create(sceneDTO);
            done();
        };
        scene.prototype.get = function (predicate, name) {
            var found = this.sceneBase[name];
            if (predicate(found))
                return found;
            throw "object not found in scene: " + name;
        };
        scene.prototype.getCamera = function (name) {
            var found = this.sceneBase[name];
            if (found instanceof qec.camera)
                return found;
            throw "camera not found : " + name;
        };
        scene.prototype.getSignedDistance = function (name) {
            var found = this.sceneBase[name];
            if (found)
                return found;
            throw "signedDistance not found : " + name;
        };
        scene.prototype.loadImages = function (sceneDTO, done) {
            console.log('load images');
            var run = new qec.runAll();
            for (var key in sceneDTO) {
                var dto = sceneDTO[key];
                if (dto['type'] == 'scImageDTO') {
                    this.addLoadImage(run, dto);
                }
            }
            run.run(done);
        };
        scene.prototype.addLoadImage = function (run, dto) {
            run.push(function (_done) {
                var scImg = new qec.scImage();
                dto['__instance'] = scImg;
                console.log('Load image : ' + dto.src);
                scImg.createAsyncFrom(dto, _done);
            });
        };
        return scene;
    }());
    qec.scene = scene;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sceneBase = (function () {
        function sceneBase() {
            this.debugInfo = false;
            this.creators = [];
        }
        sceneBase.prototype.register = function (type, canCreate) {
            var c = {
                predicate: function (o) { return o.type == type; },
                instantiate: function (dto) { var n = new canCreate(); n.createFrom(dto); return n; } };
            this.creators.push(c);
        };
        sceneBase.prototype.register2 = function (predicate, canCreate) {
            this.registerInstantiate(predicate, function (dto) { var n = new canCreate(); n.createFrom(dto); return n; });
        };
        sceneBase.prototype.registerInstantiate = function (predicate, instantiate) {
            var c = { predicate: predicate, instantiate: instantiate };
            this.creators.push(c);
        };
        sceneBase.prototype.create = function (sceneDTO) {
            var i = 0;
            while (i++ < 1) {
                if (this.debugInfo)
                    console.log('scene pass : ' + i);
                this.createPass(sceneDTO);
            }
        };
        sceneBase.prototype.createPass = function (sceneDTO) {
            var instancesFound = false;
            for (var key in sceneDTO) {
                if (this.debugInfo)
                    console.log('scene instantiate : ' + key);
                var dto = sceneDTO[key];
                // already created
                if (dto.__instance != null) {
                    if (this.debugInfo)
                        console.log('already created');
                    continue;
                }
                // can't be created
                if (this.hasAnySceneNullReferenceInIt(dto, qec.scene)) {
                    continue;
                }
                // clone dto, and replace references
                //var dto2 = this.replaceBySceneReferences(dto);
                //var dto2 = dto;
                // create object
                var instance = this.createOne(key, dto);
                // register it as a field in 'this'
                this[key] = instance;
                // register it as created in the 'scene' object
                dto.__instance = instance;
            }
        };
        sceneBase.prototype.replaceBySceneReferences = function (dto) {
            var copy = {};
            for (var key in dto) {
                var field = dto[key];
                if (field.__instance != null) {
                    if (this.debugInfo)
                        console.log('replace ' + key + ' by its scene reference');
                    copy[key] = field.__instance;
                }
                else {
                    copy[key] = field;
                }
            }
            return copy;
        };
        sceneBase.prototype.hasAnySceneNullReferenceInIt = function (dto, sceneDTO) {
            for (var key in dto) {
                var field = dto[key];
                if (this.isSceneReference(field, sceneDTO)) {
                    if (field.__instance == null) {
                        if (this.debugInfo)
                            console.log('has null reference in it : ' + key);
                        return true;
                    }
                }
            }
            return false;
        };
        sceneBase.prototype.isSceneReference = function (object, sceneDTO) {
            for (var key in sceneDTO) {
                if (sceneDTO[key] == object)
                    return true;
            }
            return false;
        };
        sceneBase.prototype.createOne = function (key, dto) {
            for (var i = 0; i < this.creators.length; ++i) {
                var c = this.creators[i];
                if (c.predicate(dto)) {
                    return c.instantiate(dto);
                }
            }
            throw "Can't create scene object " + key;
        };
        return sceneBase;
    }());
    qec.sceneBase = sceneBase;
    var creator = (function () {
        function creator() {
        }
        return creator;
    }());
    qec.creator = creator;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdBoxDTO = (function () {
        function sdBoxDTO() {
            this.type = 'sdBoxDTO';
        }
        return sdBoxDTO;
    }());
    qec.sdBoxDTO = sdBoxDTO;
    var sdBox = (function () {
        function sdBox() {
            this.halfSize = vec3.create();
            this.tmp = vec3.create();
            this.tmpPos = vec3.create();
            this.material = new qec.material();
            this.inverseTransform = mat4.create();
            this.transformedRd = vec3.create();
            this.aabb = vec3.create();
        }
        sdBox.prototype.createFrom = function (dto) {
            vec3FromArray(this.halfSize, dto.halfSize);
            this.material.createFrom(dto.material);
            mat4.invert(this.inverseTransform, new Float32Array(dto.transform));
        };
        sdBox.prototype.setHalfSize = function (sx, sy, sz) {
            vec3.set(this.halfSize, sx, sy, sz);
        };
        sdBox.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            vec3.transformMat4(this.transformedRd, rd, this.inverseTransform);
            if (qec.raybox.inbox(this.aabb, this.tmp, 0))
                return this.getDist(pos, boundingBox, debug);
            var t = qec.raybox.intersection(this.aabb, this.tmp, rd, debug);
            if (debug)
                console.log('tttt ' + t);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            return t;
        };
        sdBox.prototype.getDist = function (pos, boundingBox, debug) {
            vec3.transformMat4(this.tmpPos, pos, this.inverseTransform);
            var d0 = Math.abs(this.tmpPos[0]) - this.halfSize[0];
            var d1 = Math.abs(this.tmpPos[1]) - this.halfSize[1];
            var d2 = Math.abs(this.tmpPos[2]) - this.halfSize[2];
            var mc = Math.max(d0, d1, d2);
            var t = this.tmp;
            t[0] = Math.max(d0, 0);
            t[1] = Math.max(d1, 1);
            t[2] = Math.max(d2, 2);
            return Math.min(mc, vec3.length(t));
        };
        sdBox.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdBox.prototype.getInverseTransform = function (out) {
            mat4.copy(out, this.inverseTransform);
        };
        sdBox.prototype.getBoundingBox = function (out) {
            vec3.copy(out, this.halfSize);
        };
        return sdBox;
    }());
    qec.sdBox = sdBox;
})(qec || (qec = {}));
/*module qec {
    
    export class sdCylinderDTO {
        type : string = 'sdCylinderDTO';
        material: materialDTO;
        h:number[];
    }

    export class sdCylinder implements signedDistance, canCreate<sdBoxDTO>
    {
        h = vec2.create();
        private tmpPos = vec3.create();
        material = new material();
        inverseTransform = mat4.create();

        createFrom(dto:sdCylinder)
        {
            vec3FromArray(this.h, dto.h);
            this.material.createFrom(dto.material)
            mat4.invert(this.inverseTransform, new Float32Array(dto.transform));
        }

        setHalfSize(sx:number, sy:number, sz:number)
        {
            vec3.set(this.halfSize, sx, sy, sz);
        }

        getDist(pos: Float32Array, boundingBox:boolean, debug:boolean):number
        {
            vec3.transformMat4(this.tmpPos, pos, this.inverseTransform);
            
            
            vec2 d = abs(vec2(length(p.xz),p.y)) - h;
            return min(max(d.x,d.y),0.0) + length(max(d,0.0));
            
            return 1;
        }

        getMaterial(pos: Float32Array):material
        {
            return this.material
        }

        getInverseTransform(out:Float32Array)
        {
            mat4.identity(out);
        }

        getBoundingBox(out: Float32Array)
        {
            vec3.copy(out, this.halfSize);
        }
    }
}*/ 
var qec;
(function (qec) {
    var sdFieldsDTO = (function () {
        function sdFieldsDTO() {
        }
        return sdFieldsDTO;
    }());
    qec.sdFieldsDTO = sdFieldsDTO;
    var sdFields = (function () {
        function sdFields() {
            this.topDfCanvas = new qec.distanceFieldCanvas();
            this.profileDfCanvas = new qec.distanceFieldCanvas();
            this.material = new qec.material();
            this.inverseTransform = mat4.identity(mat4.create());
            this.tmp = vec3.create();
            this.transformedRd = vec3.create();
            this.aabb = vec3.create();
            this.dist2Pos = vec3.create();
            this.color = vec4.create();
        }
        sdFields.prototype.createFrom = function (dto) {
            this.topBounds = new Float32Array(dto.topBounds);
            this.profileBounds = new Float32Array(dto.profileBounds);
            // crée la float texture            
            var topImage = dto.topImage['__instance'].image;
            var profileImage = dto.profileImage['__instance'].image;
            /*
                        console.log(JSON.stringify(dto.topImage));
                        console.log(profileImage);
            */
            var margin = 0.05;
            this.topDfCanvas.drawUserCanvasForTop(topImage, this.topBounds, margin);
            this.profileDfCanvas.drawUserCanvasForProfile(profileImage, this.profileBounds, margin);
            this.topDfCanvas.update();
            this.profileDfCanvas.update();
            /*
                        this.topDfCanvas.debugInfoInCanvas();
                        this.profileDfCanvas.debugInfoInCanvas();
            
                        $('.debug').append(this.topDfCanvas.canvas);
                        $('.debug').append(this.profileDfCanvas.canvas);
            */
            this.init(this.topDfCanvas.floatTexture, new Float32Array(this.topDfCanvas.totalBounds), this.profileDfCanvas.floatTexture, new Float32Array(this.profileDfCanvas.totalBounds));
            this.material.createFrom(dto.material);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);
        };
        sdFields.prototype.init = function (topTexture, topBounds, profileTexture, profileBounds) {
            this.topTexture = topTexture;
            this.topBounds = new Float32Array(topBounds);
            this.profileTexture = profileTexture;
            this.profileBounds = new Float32Array(profileBounds);
            this.boundingCenterAndHalfSize = new Float32Array(6);
            this.boundingCenterAndHalfSize[0] = 0;
            this.boundingCenterAndHalfSize[1] = 0;
            this.boundingCenterAndHalfSize[2] = 0.5 * (this.profileBounds[3] + this.profileBounds[1]);
            this.boundingCenterAndHalfSize[3] = 0.5 * (this.topBounds[2] - this.topBounds[0]);
            this.boundingCenterAndHalfSize[4] = 0.5 * (this.topBounds[3] - this.topBounds[1]);
            this.boundingCenterAndHalfSize[5] = 0.5 * (this.profileBounds[3] - this.profileBounds[1]);
            this.sdBox = new qec.sdBox();
            this.sdBox.setHalfSize(this.boundingCenterAndHalfSize[3] - 0.1, this.boundingCenterAndHalfSize[4] - 0.1, this.boundingCenterAndHalfSize[5] - 0.1);
            /*
            if (boundingHalfSize == null)
                boundingHalfSize = vec3.fromValues(100,100,100);
            this.sdBox = new sdBox();

            console.log(vec3.str(boundingHalfSize));
            this.sdBox.setHalfSize(boundingHalfSize[0], boundingHalfSize[1], boundingHalfSize[2]);
            */
            //this.getDist(vec3.fromValues(0, 0, 0.05), true);
        };
        sdFields.prototype.getBoundingBox = function (out) {
            var sx = 0.5 * (this.topBounds[2] - this.topBounds[0]);
            var sy = 0.5 * (this.topBounds[3] - this.topBounds[1]);
            var sz = 0.5 * (this.profileBounds[3] - this.profileBounds[1]);
            vec3.set(out, sx, sy, sz);
        };
        sdFields.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.dist2Pos, pos, this.inverseTransform);
            vec3.transformMat4(this.transformedRd, rd, this.inverseTransform);
            this.dist2Pos[2] -= 0.5 * (this.profileBounds[3] + this.profileBounds[1]);
            if (qec.raybox.inbox(this.aabb, this.dist2Pos, 0))
                return this.getDist(pos, boundingBox, debug);
            var t = qec.raybox.intersection(this.aabb, this.dist2Pos, rd, debug);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            return t;
        };
        sdFields.prototype.getDist = function (pos, boundingBox, debug) {
            this.debug = debug;
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            var p = this.tmp;
            if (this.debug)
                console.log('boundingCenterAndHalfSize : ' + float32ArrayToString(this.boundingCenterAndHalfSize));
            if (boundingBox) {
                var pz = 0.5 * (this.profileBounds[3] + this.profileBounds[1]);
                var sx = -0.1 + 0.5 * (this.topBounds[2] - this.topBounds[0]);
                var sy = -0.1 + 0.5 * (this.topBounds[3] - this.topBounds[1]);
                var sz = -0.1 + 0.5 * (this.profileBounds[3] - this.profileBounds[1]);
                this.sdBox.halfSize[0] = sx;
                this.sdBox.halfSize[1] = sy;
                this.sdBox.halfSize[2] = sz;
                p[2] -= pz;
                var distToBbox = this.sdBox.getDist(p, false, debug);
                //if (distToBbox > 0.2)
                //    return distToBbox;
                p[2] += pz;
                return distToBbox;
            }
            var u = (p[0] - this.topBounds[0]) / (this.topBounds[2] - this.topBounds[0]);
            var v = (p[1] - this.topBounds[1]) / (this.topBounds[3] - this.topBounds[1]);
            var d = this.getFieldDistance(this.topTexture, u, v);
            var u2 = (d - this.profileBounds[0]) / (this.profileBounds[2] - this.profileBounds[0]);
            var v2 = (p[2] - this.profileBounds[1]) / (this.profileBounds[3] - this.profileBounds[1]);
            var d2 = this.getFieldDistance(this.profileTexture, u2, v2);
            if (this.debug) {
                //console.log('profileBounds ' + vec4.str(this.profileBounds));
                console.log(' uv : [' + u.toFixed(3) + ' , ' + v.toFixed(3) + ']');
                console.log(d.toFixed(2));
                console.log(' uv2 : [' + u2.toFixed(3) + ' , ' + v2.toFixed(3) + ']');
                console.log(d2.toFixed(2));
            }
            return d2;
        };
        sdFields.prototype.getFieldDistance = function (field, u, v) {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);
            qec.texture2D(field, u, v, this.color);
            if (this.debug) {
            }
            return this.color[0];
        };
        sdFields.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdFields.prototype.getInverseTransform = function (out) {
            mat4.copy(out, this.inverseTransform);
        };
        return sdFields;
    }());
    qec.sdFields = sdFields;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdIntersectionDTO = (function () {
        function sdIntersectionDTO() {
        }
        return sdIntersectionDTO;
    }());
    qec.sdIntersectionDTO = sdIntersectionDTO;
    var sdIntersection = (function () {
        function sdIntersection() {
            this.array = [];
        }
        sdIntersection.prototype.createFrom = function (dto) {
            this.array[0] = dto.a;
            this.array[1] = dto.b;
        };
        sdIntersection.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            var d = 66666;
            var l = this.array.length;
            for (var i = 0; i < l; ++i)
                d = Math.max(d, this.array[i].getDist2(pos, rd, boundingBox, debug));
            return d;
        };
        sdIntersection.prototype.getDist = function (pos, boundingBox, debug) {
            var d = 0;
            var l = this.array.length;
            for (var i = 0; i < l; ++i)
                d = Math.max(d, this.array[i].getDist(pos, boundingBox, debug));
            return d;
        };
        sdIntersection.prototype.getMaterial = function (pos) {
            var min = 666;
            var minMat;
            var l = this.array.length;
            for (var i = 0; i < l; ++i) {
                if (this.array[i].getDist(pos, false, false) < min) {
                    minMat = this.array[i].getMaterial(pos);
                }
            }
            return minMat;
        };
        sdIntersection.prototype.getInverseTransform = function (out) {
            mat4.identity(out);
        };
        sdIntersection.prototype.getBoundingBox = function (out) {
            vec3.set(out, 100, 100, 100);
        };
        return sdIntersection;
    }());
    qec.sdIntersection = sdIntersection;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdPlaneDTO = (function () {
        function sdPlaneDTO() {
            this.type = 'sdPlaneDTO';
        }
        return sdPlaneDTO;
    }());
    qec.sdPlaneDTO = sdPlaneDTO;
    var sdPlane = (function () {
        function sdPlane() {
            this.material = new qec.material();
            this.normal = vec3.set(vec3.create(), 0, 0, 1);
            this.tmp = vec3.create();
            this.transformedRd = vec3.create();
            this.aabb = vec3.create();
        }
        sdPlane.prototype.createFrom = function (dto) {
            vec3FromArray(this.normal, dto.normal);
            vec3.normalize(this.normal, this.normal);
            this.material.createFrom(dto.material);
        };
        sdPlane.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            this.getBoundingBox(this.aabb);
            if (qec.raybox.inbox(this.aabb, pos, 0))
                return this.getDist(pos, boundingBox, debug);
            var t = qec.raybox.intersection(this.aabb, pos, rd, debug);
            if (debug)
                console.log('tttt ' + t);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            return t;
        };
        sdPlane.prototype.getDist = function (pos, boundingBox, debug) {
            return vec3.dot(pos, this.normal);
        };
        sdPlane.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdPlane.prototype.getInverseTransform = function (out) {
            mat4.identity(out);
        };
        sdPlane.prototype.getBoundingBox = function (out) {
            vec3.set(out, 1000, 1000, 0.001);
        };
        return sdPlane;
    }());
    qec.sdPlane = sdPlane;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdSphere = (function () {
        function sdSphere() {
            this.material = new qec.material();
            this.radius = 1;
            this.inverseTransform = mat4.create();
            this.tmp = vec3.create();
            this.transformedRd = vec3.create();
            this.aabb = vec3.create();
        }
        sdSphere.prototype.createFrom = function (dto) {
            this.material.createFrom(dto.material);
            this.radius = dto.radius;
            var transform = dto.transform;
            if (!transform)
                mat4.identity(this.inverseTransform);
            else
                mat4.invert(this.inverseTransform, new Float32Array(transform));
        };
        sdSphere.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            vec3.transformMat4(this.transformedRd, rd, this.inverseTransform);
            if (qec.raybox.inbox(this.aabb, this.tmp, 0))
                return this.getDist(pos, boundingBox, debug);
            var t = qec.raybox.intersection(this.aabb, this.tmp, rd, debug);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            return t;
        };
        sdSphere.prototype.getDist = function (pos, boundingBox, debug) {
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            return vec3.length(this.tmp) - this.radius;
        };
        sdSphere.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdSphere.prototype.getInverseTransform = function (out) {
            mat4.copy(out, this.inverseTransform);
        };
        sdSphere.prototype.getBoundingBox = function (out) {
            vec3.set(out, this.radius, this.radius, this.radius);
        };
        return sdSphere;
    }());
    qec.sdSphere = sdSphere;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdSubtractionDTO = (function () {
        function sdSubtractionDTO() {
        }
        return sdSubtractionDTO;
    }());
    qec.sdSubtractionDTO = sdSubtractionDTO;
    var sdSubtraction = (function () {
        function sdSubtraction() {
            this.array = [];
        }
        sdSubtraction.prototype.createFrom = function (dto) {
            this.array[0] = dto.a;
            this.array[1] = dto.b;
        };
        sdSubtraction.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            var d = this.array[0].getDist(pos, boundingBox, debug);
            var l = this.array.length;
            for (var i = 1; i < l; ++i) {
                d = Math.max(d, -this.array[i].getDist2(pos, rd, boundingBox, debug));
            }
            //var d = Math.max(-this.array[0].getDist(pos, debug), this.array[1].getDist(pos, debug));
            return d;
        };
        sdSubtraction.prototype.getDist = function (pos, boundingBox, debug) {
            var d = this.array[0].getDist(pos, boundingBox, debug);
            var l = this.array.length;
            for (var i = 1; i < l; ++i) {
                d = Math.max(d, -this.array[i].getDist(pos, boundingBox, debug));
            }
            //var d = Math.max(-this.array[0].getDist(pos, debug), this.array[1].getDist(pos, debug));
            return d;
        };
        sdSubtraction.prototype.getMaterial = function (pos) {
            var min = 666;
            var minMat;
            var l = this.array.length;
            for (var i = 0; i < l; ++i) {
                if (this.array[i].getDist(pos, false, false) < min) {
                    minMat = this.array[i].getMaterial(pos);
                }
            }
            return minMat;
        };
        sdSubtraction.prototype.getInverseTransform = function (out) {
            mat4.identity(out);
        };
        sdSubtraction.prototype.getBoundingBox = function (out) {
            vec3.set(out, 100, 100, 100);
        };
        return sdSubtraction;
    }());
    qec.sdSubtraction = sdSubtraction;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdUnionDTO = (function () {
        function sdUnionDTO() {
        }
        return sdUnionDTO;
    }());
    qec.sdUnionDTO = sdUnionDTO;
    var sdUnion = (function () {
        function sdUnion() {
            this.array = [];
            this.inverseTransform = mat4.identity(mat4.create());
        }
        sdUnion.prototype.createFrom = function (dto) {
            this.array[0] = (dto.a['__instance']);
            this.array[1] = (dto.b['__instance']);
        };
        sdUnion.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            var d = 66666;
            var l = this.array.length;
            for (var i = 0; i < l; ++i)
                d = Math.min(d, this.array[i].getDist2(pos, rd, boundingBox, debug));
            return d;
        };
        sdUnion.prototype.getDist = function (pos, boundingBox, debug) {
            var d = 66666;
            var l = this.array.length;
            for (var i = 0; i < l; ++i)
                d = Math.min(d, this.array[i].getDist(pos, boundingBox, debug));
            return d;
        };
        sdUnion.prototype.getMaterial = function (pos) {
            var min = 666;
            var minMat;
            var l = this.array.length;
            for (var i = 0; i < l; ++i) {
                var distI = this.array[i].getDist(pos, false, false);
                if (distI < min) {
                    min = distI;
                    minMat = this.array[i].getMaterial(pos);
                }
            }
            return minMat;
        };
        sdUnion.prototype.getInverseTransform = function (out) {
            mat4.copy(out, this.inverseTransform);
        };
        sdUnion.prototype.getBoundingBox = function (out) {
            vec3.set(out, 100, 100, 100);
        };
        return sdUnion;
    }());
    qec.sdUnion = sdUnion;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdFieldsTest = (function () {
        function sdFieldsTest() {
            this.testName = "";
        }
        sdFieldsTest.prototype.test = function () {
            this.distanceFieldSameSizeAsCanvas();
            this.distanceFieldSmallerThanCanvas();
            this.distanceFieldSameSizeAsCanvas_WithMargin();
            console.log('done');
        };
        sdFieldsTest.prototype.distanceFieldSameSizeAsCanvas = function () {
            this.testName = 'DistanceFieldSameSizeAsCanvas';
            var canvas = this.getRectInCanvas();
            var dfCanvas = new qec.distanceFieldCanvas();
            dfCanvas.setDistanceFieldMaxSize(1000, 1000);
            var bounds = vec4.fromValues(5, 5, 1005, 405);
            dfCanvas.drawUserCanvasForTop(canvas, bounds, 0);
            this.assertEqual(dfCanvas.distanceField.M, 1000, "df width");
            this.assertEqual(dfCanvas.distanceField.N, 400, "df height");
            this.assertDist(dfCanvas, 199, 200, 1);
            this.assertDist(dfCanvas, 200, 200, 0);
            this.assertDist(dfCanvas, 201, 200, -1);
            this.assertDist(dfCanvas, 500, 99, 1);
            this.assertDist(dfCanvas, 500, 100, 0);
            this.assertDist(dfCanvas, 500, 101, -1);
        };
        sdFieldsTest.prototype.distanceFieldSmallerThanCanvas = function () {
            this.testName = 'DistanceFieldSmallerThanCanvas';
            var canvas = this.getRectInCanvas();
            var dfCanvas = new qec.distanceFieldCanvas();
            dfCanvas.setDistanceFieldMaxSize(100, 100);
            var bounds = vec4.fromValues(5, 5, 1005, 405);
            dfCanvas.drawUserCanvasForTop(canvas, bounds, 0);
            this.assertEqual(dfCanvas.distanceField.M, 100, "df width");
            this.assertEqual(dfCanvas.distanceField.N, 40, "df height");
            this.assertDist(dfCanvas, 19, 20, 10);
            this.assertDist(dfCanvas, 20, 20, 0);
            this.assertDist(dfCanvas, 21, 20, -10);
            this.assertDist(dfCanvas, 50, 9, 10);
            this.assertDist(dfCanvas, 50, 10, 0);
            this.assertDist(dfCanvas, 50, 11, -10);
        };
        sdFieldsTest.prototype.distanceFieldSameSizeAsCanvas_WithMargin = function () {
            this.testName = 'DistanceFieldSameSizeAsCanvas_WithMargin';
            var canvas = this.getRectInCanvas();
            var dfCanvas = new qec.distanceFieldCanvas();
            dfCanvas.setDistanceFieldMaxSize(1200, 1200);
            var bounds = vec4.fromValues(5, 5, 1005, 405);
            dfCanvas.drawUserCanvasForTop(canvas, bounds, 100);
            this.assertEqual(dfCanvas.distanceField.M, 1200, "df width");
            this.assertEqual(dfCanvas.distanceField.N, 600, "df height");
            this.assertArrayEqual(dfCanvas.totalBounds, [-95, -95, 1105, 505], "total bounds");
            this.assertDist(dfCanvas, 299, 300, 1);
            this.assertDist(dfCanvas, 300, 300, 0);
            this.assertDist(dfCanvas, 301, 300, -1);
            this.assertDist(dfCanvas, 600, 199, 1);
            this.assertDist(dfCanvas, 600, 200, 0);
            this.assertDist(dfCanvas, 600, 201, -1);
        };
        sdFieldsTest.prototype.getRectInCanvas = function () {
            var topCanvas = document.createElement('canvas');
            topCanvas.width = 1000;
            topCanvas.height = 400;
            var ctx = topCanvas.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.fillRect(200, 100, 600, 200);
            return topCanvas;
        };
        sdFieldsTest.prototype.assertDist = function (dfCanvas, i, j, expected) {
            var v = dfCanvas.distanceField.getD(i, j);
            if (v != expected)
                console.log(this.testName, '[' + i + ',' + j + ']' + ' v: ', v, ' expected : ', expected);
        };
        sdFieldsTest.prototype.assertEqual = function (v, expected, comment) {
            if (v != expected)
                console.log(this.testName, 'v: ', v, ' expected : ', expected, comment);
        };
        sdFieldsTest.prototype.assertArrayEqual = function (v, expected, comment) {
            var ok = true;
            for (var i = 0; i < v.length; ++i)
                ok = ok && (v[i] == expected[i]);
            if (!ok)
                console.log(this.testName, 'v: ', float32ArrayToString(v), ' expected : ', expected, comment);
        };
        return sdFieldsTest;
    }());
    qec.sdFieldsTest = sdFieldsTest;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var bspline = (function () {
        function bspline() {
        }
        bspline.prototype.setPoints = function (points, degree, copy) {
            var _this = this;
            if (copy) {
                this.points = [];
                for (var i = 0; i < points.length; i++) {
                    this.points.push(points[i]);
                }
            }
            else {
                this.points = points;
            }
            this.degree = degree;
            this.dimension = points[0].length;
            if (degree == 2) {
                this.baseFunc = function (x) { return _this.basisDeg2(x); };
                this.baseFuncRangeInt = 2;
            }
            else if (degree == 3) {
                this.baseFunc = function (x) { return _this.basisDeg3(x); };
                this.baseFuncRangeInt = 2;
            }
            else if (degree == 4) {
                this.baseFunc = function (x) { return _this.basisDeg4(x); };
                this.baseFuncRangeInt = 3;
            }
            else if (degree == 5) {
                this.baseFunc = function (x) { return _this.basisDeg5(x); };
                this.baseFuncRangeInt = 3;
            }
        };
        bspline.prototype.seqAt = function (dim) {
            var points = this.points;
            var margin = this.degree + 1;
            return function (n) {
                if (n < margin) {
                    return points[0][dim];
                }
                else if (points.length + margin <= n) {
                    return points[points.length - 1][dim];
                }
                else {
                    return points[n - margin][dim];
                }
            };
        };
        bspline.prototype.basisDeg2 = function (x) {
            if (-0.5 <= x && x < 0.5) {
                return 0.75 - x * x;
            }
            else if (0.5 <= x && x <= 1.5) {
                return 1.125 + (-1.5 + x / 2.0) * x;
            }
            else if (-1.5 <= x && x < -0.5) {
                return 1.125 + (1.5 + x / 2.0) * x;
            }
            else {
                return 0;
            }
        };
        bspline.prototype.basisDeg3 = function (x) {
            if (-1 <= x && x < 0) {
                return 2.0 / 3.0 + (-1.0 - x / 2.0) * x * x;
            }
            else if (1 <= x && x <= 2) {
                return 4.0 / 3.0 + x * (-2.0 + (1.0 - x / 6.0) * x);
            }
            else if (-2 <= x && x < -1) {
                return 4.0 / 3.0 + x * (2.0 + (1.0 + x / 6.0) * x);
            }
            else if (0 <= x && x < 1) {
                return 2.0 / 3.0 + (-1.0 + x / 2.0) * x * x;
            }
            else {
                return 0;
            }
        };
        ;
        bspline.prototype.basisDeg4 = function (x) {
            if (-1.5 <= x && x < -0.5) {
                return 55.0 / 96.0 + x * (-(5.0 / 24.0) + x * (-(5.0 / 4.0) + (-(5.0 / 6.0) - x / 6.0) * x));
            }
            else if (0.5 <= x && x < 1.5) {
                return 55.0 / 96.0 + x * (5.0 / 24.0 + x * (-(5.0 / 4.0) + (5.0 / 6.0 - x / 6.0) * x));
            }
            else if (1.5 <= x && x <= 2.5) {
                return 625.0 / 384.0 + x * (-(125.0 / 48.0) + x * (25.0 / 16.0 + (-(5.0 / 12.0) + x / 24.0) * x));
            }
            else if (-2.5 <= x && x <= -1.5) {
                return 625.0 / 384.0 + x * (125.0 / 48.0 + x * (25.0 / 16.0 + (5.0 / 12.0 + x / 24.0) * x));
            }
            else if (-1.5 <= x && x < 1.5) {
                return 115.0 / 192.0 + x * x * (-(5.0 / 8.0) + x * x / 4.0);
            }
            else {
                return 0;
            }
        };
        bspline.prototype.basisDeg5 = function (x) {
            if (-2 <= x && x < -1) {
                return 17.0 / 40.0 + x * (-(5.0 / 8.0) + x * (-(7.0 / 4.0) + x * (-(5.0 / 4.0) + (-(3.0 / 8.0) - x / 24.0) * x)));
            }
            else if (0 <= x && x < 1) {
                return 11.0 / 20.0 + x * x * (-(1.0 / 2.0) + (1.0 / 4.0 - x / 12.0) * x * x);
            }
            else if (2 <= x && x <= 3) {
                return 81.0 / 40.0 + x * (-(27.0 / 8.0) + x * (9.0 / 4.0 + x * (-(3.0 / 4.0) + (1.0 / 8.0 - x / 120.0) * x)));
            }
            else if (-3 <= x && x < -2) {
                return 81.0 / 40.0 + x * (27.0 / 8.0 + x * (9.0 / 4.0 + x * (3.0 / 4.0 + (1.0 / 8.0 + x / 120.0) * x)));
            }
            else if (1 <= x && x < 2) {
                return 17.0 / 40.0 + x * (5.0 / 8.0 + x * (-(7.0 / 4.0) + x * (5.0 / 4.0 + (-(3.0 / 8.0) + x / 24.0) * x)));
            }
            else if (-1 <= x && x < 0) {
                return 11.0 / 20.0 + x * x * (-(1.0 / 2.0) + (1.0 / 4.0 + x / 12.0) * x * x);
            }
            else {
                return 0;
            }
        };
        bspline.prototype.getInterpol = function (seq, t) {
            var f = this.baseFunc;
            var rangeInt = this.baseFuncRangeInt;
            var tInt = Math.floor(t);
            var result = 0;
            for (var i = tInt - rangeInt; i <= tInt + rangeInt; i++) {
                result += seq(i) * f(t - i);
            }
            return result;
        };
        bspline.prototype.calcAt = function (t) {
            t = t * ((this.degree + 1) * 2 + this.points.length); //t must be in [0,1]
            if (this.dimension == 2) {
                return [this.getInterpol(this.seqAt(0), t), this.getInterpol(this.seqAt(1), t)];
            }
            else if (this.dimension == 3) {
                return [this.getInterpol(this.seqAt(0), t), this.getInterpol(this.seqAt(1), t), this.getInterpol(this.seqAt(2), t)];
            }
            else {
                var res = [];
                for (var i = 0; i < this.dimension; i++) {
                    res.push(this.getInterpol(this.seqAt(i), t));
                }
                return res;
            }
        };
        return bspline;
    }());
    qec.bspline = bspline;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var createdDTO = (function () {
        function createdDTO() {
        }
        return createdDTO;
    }());
    qec.createdDTO = createdDTO;
})(qec || (qec = {}));
function vec3FromArray(out, a) {
    for (var i = 0; i < a.length; ++i)
        out[i] = a[i];
}
function mat4FromArray(out, a) {
    for (var i = 0; i < a.length; ++i)
        out[i] = a[i];
}
var qec;
(function (qec) {
    function inject(f) {
        var i = {};
        i.__inject = f;
        return i;
    }
    qec.inject = inject;
    function injectFunc(f) {
        var i = {};
        i.__injectFunc = f;
        return i;
    }
    qec.injectFunc = injectFunc;
    function injectNew(f) {
        var i = {};
        i.__injectNew = f;
        return i;
    }
    qec.injectNew = injectNew;
    var injector = (function () {
        function injector() {
            this.doLog = false;
            this.singleInstances2 = [];
        }
        injector.prototype.typeFunctionToString = function (typeFunction) {
            var s = "" + typeFunction;
            return s.slice(0, s.indexOf('('));
        };
        injector.prototype.findSingleInstance = function (typeFunction) {
            var found = undefined;
            this.singleInstances2.forEach(function (s) {
                if (s[0] === typeFunction) {
                    //console.log("single instance found : " + this.typeFunctionToString(typeFunction));
                    found = s[1];
                }
            });
            return found;
        };
        injector.prototype.insertSingleInstance = function (typeFunction, instance) {
            //console.log("single instance push : " + this.typeFunctionToString(typeFunction));
            this.singleInstances2.push([typeFunction, instance]);
        };
        injector.prototype.injectFunc = function (owner, propertyName, injPlaceHolder) {
            var _this = this;
            var typeFunction = injPlaceHolder.__injectFunc;
            owner[propertyName] = function () {
                return _this.create(typeFunction, true);
            };
        };
        injector.prototype.inject = function (owner, propertyName, injPlaceHolder) {
            var propertyTypeFunction = injPlaceHolder.__inject;
            owner[propertyName] = this.create(propertyTypeFunction);
        };
        injector.prototype.injectNew = function (owner, propertyName, injPlaceHolder) {
            var propertyTypeFunction = injPlaceHolder.__injectNew;
            owner[propertyName] = this.create(propertyTypeFunction, true);
        };
        injector.prototype.create = function (typeFunction, forceNew) {
            var s = "" + typeFunction;
            if (this.doLog) {
                console.log("inject " + s.slice(0, s.indexOf('(')));
            }
            if (typeFunction == undefined) {
                console.log("Error inject");
            }
            var o;
            if (forceNew == true) {
                o = new typeFunction();
            }
            else {
                var o = this.findSingleInstance(typeFunction);
                if (o == undefined) {
                    o = new typeFunction();
                    this.insertSingleInstance(typeFunction, o);
                }
                else {
                    return o;
                }
            }
            for (var propertyName in o) {
                if (o.hasOwnProperty(propertyName)) {
                    var propertyValue = o[propertyName];
                    if (propertyValue != undefined) {
                        if (propertyValue.__inject != undefined) {
                            this.inject(o, propertyName, propertyValue);
                        }
                        if (propertyValue != undefined
                            && propertyValue.__injectFunc != undefined) {
                            this.injectFunc(o, propertyName, propertyValue);
                        }
                        if (propertyValue != undefined
                            && propertyValue.__injectNew != undefined) {
                            this.injectNew(o, propertyName, propertyValue);
                        }
                    }
                }
            }
            if (o.afterInject != undefined) {
                o.afterInject();
            }
            return o;
        };
        return injector;
    }());
    qec.injector = injector;
    var testA = (function () {
        function testA() {
            this.id = testA.idCount++;
        }
        testA.idCount = 0;
        return testA;
    }());
    var testB1 = (function () {
        function testB1() {
            this.singleInstanceA = inject(testA);
            this.createa = injectFunc(testA);
        }
        testB1.prototype.afterInject = function () {
            this.newA = this.createa();
        };
        testB1.prototype.log = function () {
            return "singleInstanceA:" + this.singleInstanceA.id + "   newA:" + this.newA.id;
        };
        return testB1;
    }());
    var testB2 = (function () {
        function testB2() {
        }
        testB2.prototype.log = function () {
            return "testB2";
        };
        return testB2;
    }());
    var injector2Test = (function () {
        function injector2Test() {
        }
        injector2Test.prototype.doTestSingleInstanceAndInjectFunc = function () {
            var injector = new injector();
            var x = injector.create(testB1);
            var y = injector.create(testB1);
            console.log("x: " + x.log());
            console.log("y: " + y.log());
            /*
                        injector.injectProperties(b1);
            
                        var b2 = new testB();
                        injector.injectProperties(b2);
            
                        console.log("1: " + b1.a.id);
                        console.log("2: " + b2.a.id);
                        */
        };
        injector2Test.prototype.doTestScope = function () {
            /*
            var injector = new injector2();
            injector.setScope(testB1, "ScopeB");
            injector.singleInstanceByScope(testA, "ScopeB");

            var x = injector.create(testB1);
            var y = injector.create(testB1);

            console.log("x: " + x.log());
            console.log("y: " + y.log());
            */
        };
        return injector2Test;
    }());
    qec.injector2Test = injector2Test;
})(qec || (qec = {}));
function MathClamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}
;
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;
        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
function getParameterByName(name, url) {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function vec3ToArray(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
}
function mat4Array(a) {
    var b = new Array(a.length);
    for (var i = 0; i < a.length; ++i)
        b[i] = a[i];
    return b;
}
function mat4Identity() {
    return mat4Array(mat4.identity(mat4.create()));
}
function mat4Translate(x, y, z) {
    return mat4Array(mat4.fromTranslation(mat4.create(), vec3.fromValues(x, y, z)));
}
function float32ArrayToString(a) {
    var s = '' + a[0];
    for (var i = 1; i < a.length; ++i) {
        s += ',' + a[i];
    }
    return s;
}
var qec;
(function (qec) {
    var resources = (function () {
        function resources() {
        }
        resources.loadAll = function (done) {
            var run = new qec.runAll();
            run.push(function (_done) { return resources.doReq('app/sd.glsl', _done); });
            run.push(function (_done) { return resources.doReq('app/light.glsl', _done); });
            run.push(function (_done) { return resources.doReq('app/renderPixel.glsl', _done); });
            run.run(function () { resources.loaded = true; done(); });
        };
        resources.doReq = function (url, done) {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.onreadystatechange = function (aEvt) {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        resources.all[url] = req.responseText;
                        done();
                    }
                    else {
                        console.error("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            req.send(null);
        };
        resources.all = [];
        resources.loaded = false;
        return resources;
    }());
    qec.resources = resources;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var runAll = (function () {
        function runAll() {
            this.all = [];
        }
        runAll.prototype.push = function (f) {
            this.all.push(f);
        };
        runAll.prototype.run = function (done) {
            var _this = this;
            if (this.all.length == 0)
                done();
            this.doneCount = 0;
            for (var i = 0; i < this.all.length; ++i)
                this.all[i](function () { return _this.onDone(done); });
        };
        runAll.prototype.onDone = function (done) {
            this.doneCount++;
            console.log('runAll.onDone : ' + this.doneCount);
            if (this.doneCount == this.all.length)
                done();
        };
        return runAll;
    }());
    qec.runAll = runAll;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var strDownloadMime = "image/octet-stream";
    function saveAsImage(elt) {
        var imgData, imgNode;
        try {
            var strMime = "image/jpeg";
            imgData = elt.toDataURL(strMime);
            saveFile(imgData.replace(strMime, strDownloadMime), "photo.jpg");
        }
        catch (e) {
            console.log(e);
            return;
        }
    }
    qec.saveAsImage = saveAsImage;
    function saveFile(strData, filename) {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
            document.body.appendChild(link); //Firefox requires the link to be in the body
            link.download = filename;
            link.href = strData;
            link.click();
            document.body.removeChild(link); //remove the link when done
        }
        /*else {
            location.replace(uri);
        }*/
    }
})(qec || (qec = {}));
var qec;
(function (qec) {
    var styleAttribute = (function () {
        function styleAttribute() {
        }
        styleAttribute.setField = function (styleStr, key, value) {
            var parts = styleStr.split(";");
            var parts2 = [];
            var index = -1;
            for (var i = 0; i < parts.length; i++) {
                var subParts = parts[i].split(':');
                parts2[i] = [subParts[0], subParts[1]];
                if (subParts[0] == key) {
                    //console.log('style : key at ' + i);
                    index = i;
                }
            }
            if (index != -1) {
                parts2[index][0] = key;
                parts2[index][1] = value;
            }
            else
                parts2.push([key, value]);
            var result = '';
            for (var i = 0; i < parts2.length; i++) {
                result += parts2[i][0] + ':' + parts2[i][1] + ';';
            }
            //console.log(result);
            return result;
        };
        return styleAttribute;
    }());
    qec.styleAttribute = styleAttribute;
})(qec || (qec = {}));
// Adapted from:
// -------------
// Geometric Tools, LLC
// Copyright (c) 1998-2013
// Distributed under the Boost Software License, Version 1.0.
// http://www.boost.org/LICENSE_1_0.txt
// http://www.geometrictools.com/License/Boost/LICENSE_1_0.txt
//
// File Version: 5.0.1 (2010/10/01)
var qec;
(function (qec) {
    var wm5DistLine3Line3 = (function () {
        function wm5DistLine3Line3() {
            this.mLine0Origin = vec3.create();
            this.mLine0Direction = vec3.create();
            this.mLine1Origin = vec3.create();
            this.mLine1Direction = vec3.create();
            this.mClosestPoint0 = vec3.create();
            this.mClosestPoint1 = vec3.create();
            this.mLine0Parameter = 0;
            this.mLine1Parameter = 0;
            this.ZERO_TOLERANCE = 1e-20;
            this.getDistance = function () {
                return Math.sqrt(this.getSquared());
            };
            this.diff = vec3.create();
        }
        wm5DistLine3Line3.prototype.setLines = function (line0, line1) {
            vec3.copy(this.mLine0Origin, line0.origin);
            vec3.copy(this.mLine0Direction, line0.direction);
            vec3.copy(this.mLine1Origin, line1.origin);
            vec3.copy(this.mLine1Direction, line1.direction);
        };
        wm5DistLine3Line3.prototype.getSquared = function () {
            var mLine0Origin = this.mLine0Origin;
            var mLine0Direction = this.mLine0Direction;
            var mLine1Origin = this.mLine1Origin;
            var mLine1Direction = this.mLine1Direction;
            var diff = this.diff;
            //Vector3<Real> diff = mLine0->Origin - mLine1->Origin;
            vec3.subtract(diff, mLine0Origin, mLine1Origin);
            //Real a01 = -mLine0->Direction.Dot(mLine1->Direction);
            var a01 = -vec3.dot(mLine0Direction, mLine1Direction);
            //Real b0 = diff.Dot(mLine0->Direction);
            var b0 = vec3.dot(diff, mLine0Direction);
            //Real c = diff.SquaredLength();
            var c = vec3.dot(diff, diff);
            //Real det = Math<Real>::FAbs((Real)1 - a01*a01);
            var det = Math.abs(1 - a01 * a01);
            var b1, s0, s1, sqrDist;
            if (det >= this.ZERO_TOLERANCE) {
                // Lines are not parallel.
                b1 = -vec3.dot(diff, mLine1Direction);
                var invDet = 1 / det;
                s0 = (a01 * b1 - b0) * invDet;
                s1 = (a01 * b0 - b1) * invDet;
                sqrDist = s0 * (s0 + a01 * s1 + 2 * b0) +
                    s1 * (a01 * s0 + s1 + 2 * b1) + c;
            }
            else {
                // Lines are parallel, select any closest pair of points.
                s0 = -b0;
                s1 = 0;
                sqrDist = b0 * s0 + c;
            }
            for (var i = 0; i < 3; ++i) {
                this.mClosestPoint0[i] = mLine0Origin[i] + s0 * mLine0Direction[i];
                this.mClosestPoint1[i] = mLine1Origin[i] + s1 * mLine1Direction[i];
            }
            this.mLine0Parameter = s0;
            this.mLine1Parameter = s1;
            // Account for numerical round-off errors.
            if (sqrDist < 0) {
                sqrDist = 0;
            }
            return sqrDist;
        };
        wm5DistLine3Line3.prototype.getClosestPoint0 = function (dest) {
            vec3.copy(dest, this.mClosestPoint0);
        };
        wm5DistLine3Line3.prototype.getClosestPoint1 = function (dest) {
            vec3.copy(dest, this.mClosestPoint1);
        };
        wm5DistLine3Line3.prototype.getLine0Parameter = function () {
            return this.mLine0Parameter;
        };
        wm5DistLine3Line3.prototype.getLine1Parameter = function () {
            return this.mLine1Parameter;
        };
        return wm5DistLine3Line3;
    }());
    qec.wm5DistLine3Line3 = wm5DistLine3Line3;
})(qec || (qec = {}));
// Adapted From:
// Geometric Tools, LLC
// Copyright (c) 1998-2014
// Distributed under the Boost Software License, Version 1.0.
// http://www.boost.org/LICENSE_1_0.txt
// http://www.geometrictools.com/License/Boost/LICENSE_1_0.txt
//
// File Version: 5.0.0 (2010/01/01)
var qec;
(function (qec) {
    var wm5Line3 = (function () {
        function wm5Line3() {
            this.origin = vec3.create();
            this.direction = vec3.create();
        }
        wm5Line3.prototype.setOriginAndDirection = function (origin, direction) {
            vec3.copy(this.origin, origin);
            vec3.copy(this.direction, direction);
        };
        wm5Line3.prototype.setTwoPoints = function (a, b) {
            vec3.copy(this.origin, a);
            vec3.subtract(this.direction, b, a);
            var l = vec3.length(this.direction);
            if (l == 0) {
                this.direction[0] = 1;
            }
            else {
                vec3.scale(this.direction, this.direction, 1 / l);
            }
        };
        return wm5Line3;
    }());
    qec.wm5Line3 = wm5Line3;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var cameraController = (function () {
        function cameraController() {
            this.editor = qec.inject(qec.editor);
            this.minZoom = 0;
            this.maxZoom = 100;
            // left right
            this.minTheta = -Math.PI; // radians
            this.maxTheta = Math.PI; // radians
            // top - bottom
            this.minPhi = -Math.PI; // radians
            this.maxPhi = Math.PI; // radians
            // current position in spherical coordinates
            this.spherical = new THREE.Spherical();
            this.sphericalDelta = new THREE.Spherical();
            this.rotateStart = vec2.create();
            this.rotateEnd = vec2.create();
            this.isMouseDown = false;
            this.updateFlag = false;
            this.button = 1;
            this.spherical.radius = 2;
            this.spherical.theta = -Math.PI / 2;
            this.spherical.phi = Math.PI * 2 / 5;
        }
        cameraController.prototype.setButton = function (button) {
            this.button = button;
        };
        cameraController.prototype.set = function () {
        };
        cameraController.prototype.unset = function () {
        };
        cameraController.prototype.rotateLeft = function (angle) {
            this.sphericalDelta.theta = -angle;
            // restrict theta to be between desired limits
            //this.sphericalDelta.theta = Math.max( this.minTheta, Math.min( this.maxTheta, this.sphericalDelta.theta ) );
        };
        cameraController.prototype.rotateUp = function (angle) {
            this.sphericalDelta.phi = angle;
            // restrict phi to be between desired limits
            //this.sphericalDelta.phi = Math.max( this.minPhi, Math.min( this.maxPhi, this.sphericalDelta.phi ) );
        };
        cameraController.prototype.updateLoop = function () {
            if (this.updateFlag) {
                this.updateFlag = false;
                this.updateCamera();
            }
        };
        cameraController.prototype.updateCamera = function () {
            var theta = this.spherical.theta + this.sphericalDelta.theta;
            var phi = this.spherical.phi + this.sphericalDelta.phi;
            var radius = this.spherical.radius;
            //console.log('angles ' + s.theta + ', ' + s.phi)
            var sinTheta = Math.sin(theta);
            var x = radius * Math.cos(phi) * Math.cos(theta);
            var y = radius * Math.cos(phi) * Math.sin(theta);
            var z = radius * Math.sin(phi);
            //console.log(x, y, z);
            this.editor.getCamera().setPosition(vec3.fromValues(x, y, z));
            this.editor.setRenderFlag();
        };
        cameraController.prototype.setFromVector3 = function (p) {
            /*
            this.radius = vec3.length();

            if ( this.radius === 0 ) {

                this.theta = 0;
                this.phi = 0;

            } else
            */
            {
                var radius = 2;
                this.spherical.theta = Math.atan2(vec3[0], vec3[1]); // equator angle around y-up axis
                this.spherical.phi = Math.asin(THREE.Math.clamp(p[2] / radius, -1, 1)); // polar angle
            }
        };
        ;
        cameraController.prototype.onMouseMove = function (e) {
            if (this.isMouseDown) {
                this.updateFlag = true;
                vec2.set(this.rotateEnd, e.offsetX, e.offsetY);
                var dx = this.rotateEnd[0] - this.rotateStart[0];
                var dy = this.rotateEnd[1] - this.rotateStart[1];
                // rotating across whole screen goes 360 degrees around
                this.rotateLeft(2 * Math.PI * dx / 1000); /*rotateDelta.x / element.clientWidth * scope.rotateSpeed );*/
                // rotating up and down along whole screen attempts to go 360, but limited to 180
                this.rotateUp(2 * Math.PI * dy / 1000); // / element.clientHeight * scope.rotateSpeed );
            }
        };
        cameraController.prototype.onMouseDown = function (e) {
            if (e.button == this.button) {
                this.spherical.theta += this.sphericalDelta.theta;
                this.spherical.phi += this.sphericalDelta.phi;
                vec2.set(this.rotateStart, e.offsetX, e.offsetY);
                vec2.set(this.rotateEnd, e.offsetX, e.offsetY);
                this.sphericalDelta.theta = 0;
                this.sphericalDelta.phi = 0;
                this.isMouseDown = true;
            }
            // wheel
            if (e.button == this.button) {
            }
        };
        cameraController.prototype.onMouseUp = function (e) {
            this.isMouseDown = false;
        };
        cameraController.prototype.onMouseWheel = function (e) {
            var orig = e.originalEvent;
            var d = Math.max(-1, Math.min(1, (orig.deltaY)));
            //console.log('mousewheel', orig.deltaY);
            this.spherical.radius *= 1 - d * 0.1;
            this.updateFlag = true;
        };
        return cameraController;
    }());
    qec.cameraController = cameraController;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var controllerManager = (function () {
        function controllerManager() {
            this.camActive = true;
            this.cameraController = qec.inject(qec.cameraController);
        }
        controllerManager.prototype.afterInject = function () {
            this.cameraController.setButton(2);
            //this.cameraController.updateCamera();
        };
        /*
        setElement(elt:Element)
        {
            // register on mouse move
            // register on mouse click
            //var elt = document.getElementsByClassName('.renderContainer')[0];
            //elt = elt.firstElementChild;
            elt.addEventListener('mousemove', (e) => this.onMouseMove(e));
            elt.addEventListener('mousedown', (e) => this.onMouseDown(e));
            elt.addEventListener('mouseup', (e) => this.onMouseUp(e));
            elt.addEventListener('mousewheel', (e) => this.onMouseWheel(e));
            elt.addEventListener('DOMMouseScroll', (e) => this.onMouseWheel(e));
        }*/
        controllerManager.prototype.setController = function (c) {
            if (this.currentController != null)
                this.currentController.unset();
            this.currentController = c;
            c.set();
        };
        controllerManager.prototype.onMouseMove = function (e) {
            if (this.camActive)
                this.cameraController.onMouseMove(e);
            if (this.currentController != null)
                this.currentController.onMouseMove(e);
        };
        controllerManager.prototype.onMouseDown = function (e) {
            if (this.camActive)
                this.cameraController.onMouseDown(e);
            if (this.currentController != null)
                this.currentController.onMouseDown(e);
        };
        controllerManager.prototype.onMouseUp = function (e) {
            if (this.camActive)
                this.cameraController.onMouseUp(e);
            if (this.currentController != null)
                this.currentController.onMouseUp(e);
        };
        controllerManager.prototype.onMouseWheel = function (e) {
            if (this.camActive)
                this.cameraController.onMouseWheel(e);
            if (this.currentController != null)
                this.currentController.onMouseWheel(e);
        };
        controllerManager.prototype.updateLoop = function () {
            if (this.camActive)
                this.cameraController.updateLoop();
            if (this.currentController != null)
                this.currentController.updateLoop();
        };
        return controllerManager;
    }());
    qec.controllerManager = controllerManager;
})(qec || (qec = {}));
var qec;
(function (qec) {
    // http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app
    var drawInCanvas = (function () {
        function drawInCanvas() {
            this.paint = false;
            this.clickX = new Array();
            this.clickY = new Array();
            this.clickDrag = new Array();
            this.color = 'black';
        }
        drawInCanvas.prototype.setColor = function (color) {
            this.color = color;
            this.context.strokeStyle = this.color;
            this.context.fillStyle = this.color;
        };
        drawInCanvas.prototype.setElement = function (canvas) {
            var _this = this;
            this.canvas = canvas;
            this.context = this.canvas.getContext('2d');
            this.context.strokeStyle = this.color;
            this.context.fillStyle = this.color;
            this.context.lineJoin = "round";
            this.context.lineWidth = 20;
            canvas.addEventListener('mousedown', function (e) {
                var rect = canvas.getBoundingClientRect();
                var mouseX = e.clientX - rect.left - 0.5;
                var mouseY = e.clientY - rect.top;
                //console.log(mouseX, mouseY);
                _this.paint = true;
                _this.addClick(mouseX, mouseY, false);
                _this.redraw();
            });
            canvas.addEventListener('mousemove', function (e) {
                var rect = canvas.getBoundingClientRect();
                var mouseX = e.clientX - rect.left;
                var mouseY = e.clientY - rect.top;
                if (_this.paint) {
                    _this.addClick(mouseX, mouseY, true);
                    _this.redraw();
                }
            });
            canvas.addEventListener('mouseup', function (e) {
                _this.paint = false;
            });
            canvas.addEventListener('mouseleave', function (e) {
                _this.paint = false;
            });
        };
        drawInCanvas.prototype.addClick = function (x, y, dragging) {
            this.clickX.push(x);
            this.clickY.push(y);
            this.clickDrag.push(dragging);
        };
        drawInCanvas.prototype.redraw = function () {
            //this.context = this.canvas.getContext("2d");
            //console.log(this.clickX); 
            var context = this.context;
            //context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
            for (var i = 0; i < this.clickX.length; i++) {
                context.beginPath();
                if (this.clickDrag[i] && i) {
                    context.moveTo(this.clickX[i - 1], this.clickY[i - 1]);
                }
                else {
                    context.moveTo(this.clickX[i] - 1, this.clickY[i]);
                }
                context.lineTo(this.clickX[i], this.clickY[i]);
                context.closePath();
                context.stroke();
            }
            this.clickX = [];
            this.clickY = [];
            this.clickDrag = [];
            if (this.afterRedraw != null)
                this.afterRedraw();
        };
        return drawInCanvas;
    }());
    qec.drawInCanvas = drawInCanvas;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var editorView = (function () {
        function editorView() {
            this.editor = qec.inject(qec.editor);
            //updateLoop:updateLoop = inject(updateLoop);
            this.controllerManager = qec.inject(qec.controllerManager);
            this.selectController = qec.inject(qec.selectController);
            this.heightController = qec.inject(qec.heightController);
            this.importView = qec.inject(qec.importView);
            this.profileView = qec.inject(qec.profileView);
            this.materialView = qec.inject(qec.materialView);
            // toolbars
            this.importToolbarVisible = ko.observable(true);
            this.modifyToolbarVisible = ko.observable(false);
            this.environmentToolbarVisible = ko.observable(false);
            this.photoToolbarVisible = ko.observable(false);
            this.toolbarsVisible = [
                this.importToolbarVisible,
                this.modifyToolbarVisible,
                this.environmentToolbarVisible,
                this.photoToolbarVisible];
        }
        editorView.prototype.afterInject = function () {
            this.editor.setRenderFlag();
            this.updateLoop();
        };
        editorView.prototype.onMouseMove = function (data, e) { this.controllerManager.onMouseMove(e); };
        editorView.prototype.onMouseDown = function (data, e) { this.controllerManager.onMouseDown(e); };
        editorView.prototype.onMouseUp = function (data, e) { this.controllerManager.onMouseUp(e); };
        editorView.prototype.onMouseWheel = function (data, e) { this.controllerManager.onMouseWheel(e); };
        editorView.prototype.setMoveController = function () {
            this.heightController.isScaleMode = false;
            this.controllerManager.setController(this.heightController);
        };
        editorView.prototype.setScaleController = function () {
            this.heightController.isScaleMode = true;
            this.controllerManager.setController(this.heightController);
        };
        editorView.prototype.setSelectController = function () {
            this.controllerManager.setController(this.selectController);
        };
        editorView.prototype.setSelectedIndex = function (i) {
            this.editor.setSelectedIndex(i);
            this.profileView.setSelectedIndex(i);
            this.materialView.setSelectedIndex(i);
        };
        editorView.prototype.updateLoop = function () {
            var _this = this;
            this.controllerManager.updateLoop();
            this.editor.updateLoop();
            this.profileView.updateLoop();
            requestAnimationFrame(function () { return _this.updateLoop(); });
        };
        editorView.prototype.exportSTL = function () {
            var stl = this.editor.computeSTL();
            var blob = new Blob([stl], { type: 'text/plain' });
            saveAs(blob, 'download.stl');
        };
        editorView.prototype.showImportToolbar = function () { this.setToolbar(this.importToolbarVisible); };
        editorView.prototype.showModifyToolbar = function () { this.setToolbar(this.modifyToolbarVisible); };
        editorView.prototype.showEnvironmentToolbar = function () { this.setToolbar(this.environmentToolbarVisible); };
        editorView.prototype.showPhotoToolbar = function () { this.setToolbar(this.photoToolbarVisible); };
        editorView.prototype.setToolbar = function (selected) {
            this.toolbarsVisible.forEach(function (t) { return t(false); });
            selected(true);
        };
        return editorView;
    }());
    qec.editorView = editorView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var heightController = (function () {
        function heightController() {
            this.editor = qec.inject(qec.editor);
            this.editorView = qec.inject(qec.editorView);
            this.profileView = qec.inject(qec.profileView);
            this.isMouseDown = false;
            this.updateFlag = false;
            this.startX = 0;
            this.startY = 0;
            this.startPos = vec3.create();
            this.mousePos = vec3.create();
            this.deltaPos = vec3.create();
            this.startTransform = mat4.create();
            this.startHalfSizeProfile = vec2.create();
            this.startBounds = vec4.create();
            this.newBounds = vec4.create();
            this.ro = vec3.create();
            this.rd = vec3.create();
            this.dirUp = vec3.fromValues(0, 0, 1);
            this.lineUp = new qec.wm5Line3();
            this.lineCam = new qec.wm5Line3();
            this.distLines = new qec.wm5DistLine3Line3();
            this.collide = new qec.renderCollide();
            this.isScaleMode = false;
        }
        heightController.prototype.set = function () {
            //console.log('heightController');
            this.updateFlag = false;
            this.isMouseDown = false;
        };
        heightController.prototype.unset = function () {
        };
        heightController.prototype.updateLoop = function () {
            if (this.isMouseDown && this.updateFlag) {
                this.updateFlag = false;
                this.editor.getCamera().getRay(this.mouseX, this.mouseY, this.ro, this.rd);
                // project mouse on up ray from startPos
                this.lineUp.setOriginAndDirection(this.startPos, this.dirUp);
                this.lineCam.setOriginAndDirection(this.ro, this.rd);
                this.distLines.setLines(this.lineUp, this.lineCam);
                this.distLines.getDistance();
                this.distLines.getClosestPoint0(this.mousePos);
                vec3.subtract(this.deltaPos, this.mousePos, this.startPos);
                if (!this.isScaleMode) {
                    mat4.translate(this.selected.sd.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(this.selected.sd.inverseTransform, this.selected.sd.inverseTransform);
                    this.editor.renderer.updateTransform(this.selected.sd);
                    this.editor.setRenderFlag();
                }
                else {
                    vec4.copy(this.newBounds, this.startBounds);
                    this.newBounds[3] += this.deltaPos[2];
                    this.selected.scaleProfilePoints(this.newBounds);
                    this.selected.updateSignedDistance();
                    this.editor.renderer.updateFloatTextures(this.selected.sd);
                    this.editor.setRenderFlag();
                }
                if (this.isScaleMode) {
                    this.profileView.refresh();
                }
            }
        };
        heightController.prototype.onMouseMove = function (e) {
            if (this.isMouseDown) {
                this.mouseX = e.offsetX;
                this.mouseY = e.offsetY;
                this.updateFlag = true;
            }
        };
        heightController.prototype.onMouseDown = function (e) {
            this.isMouseDown = false;
            if (e.button != 0)
                return;
            this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
            this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);
            if (!this.collide.hasCollided) {
                this.editorView.setSelectedIndex(-1);
            }
            else {
                this.isMouseDown = true;
                // Initial state
                this.startX = e.offsetX;
                this.startY = e.offsetY;
                vec3.copy(this.startPos, this.collide.pos);
                this.selected = this.editor.editorObjects[this.collide.sdIndex];
                mat4.invert(this.startTransform, this.selected.sd.inverseTransform);
                vec4.copy(this.startBounds, this.selected.profileBounds);
                this.editorView.setSelectedIndex(this.collide.sdIndex);
            }
        };
        heightController.prototype.onMouseUp = function (e) {
            this.isMouseDown = false;
        };
        heightController.prototype.onMouseWheel = function (e) {
        };
        return heightController;
    }());
    qec.heightController = heightController;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var importView = (function () {
        function importView() {
            this.editor = qec.inject(qec.editor);
        }
        importView.prototype.set = function () {
        };
        importView.prototype.setElement = function (elt) {
            var _this = this;
            var btnImport = document.getElementsByClassName('btnImport')[0];
            btnImport.addEventListener('change', function (e) {
                var files = btnImport.files;
                _this.readImage(files[0]);
            });
            var dropZone = document.getElementsByClassName('dropZone')[0];
            dropZone.addEventListener('dragover', function (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }, false);
            dropZone.addEventListener('drop', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var files = e.dataTransfer.files;
                var i = 0;
                var file = files[i];
                _this.readImage(files[0]);
            }, false);
        };
        importView.prototype.readImage = function (file) {
            var _this = this;
            console.log('readImage');
            var reader = new FileReader();
            reader.onload = function (event) {
                _this.importedContent = reader.result;
                _this.editor.importSvg(_this.importedContent, function () { } //this.editor.setSelectedIndex(0)
                );
                // show in UI
                $('.imgImportedImage').attr("src", "data:image/svg+xml;base64," + btoa(reader.result));
            };
            // when the file is read it triggers the onload event above.
            if (file) {
                reader.readAsText(file);
            }
        };
        return importView;
    }());
    qec.importView = importView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var index2 = (function () {
        function index2() {
            /*
            sd:signedDistance;
            light:spotLight;
            cam: camera;
            */
            this.isParallel = false;
            this.isHardware = false;
            this.renderSteps = false;
            this.renderSettings = new qec.renderSettings();
            this.t = 5;
            this.camDist = 0;
        }
        index2.prototype.start = function (element) {
            var _this = this;
            var select = document.createElement('select');
            var option0 = document.createElement('option');
            option0.value = "";
            option0.text = "<select>";
            select.appendChild(option0);
            var examples = qec.getExamples();
            for (var i in examples) {
                var option = document.createElement('option');
                option.value = examples[i].title;
                option.text = option.value;
                select.appendChild(option);
            }
            document.body.appendChild(select);
            select.addEventListener('change', function (e) {
                return window.location.href =
                    '?scene=' + select.value +
                        '&isParallel=' + (_this.isParallel ? '1' : '0') +
                        '&isHardware=' + (_this.isHardware ? '1' : '0') +
                        '&renderSteps=' + (_this.renderSteps ? '1' : '0');
            });
            this.element = element;
            var sceneName = getParameterByName('scene', undefined);
            if (!sceneName)
                sceneName = 'Sphere';
            this.createScene(sceneName);
        };
        index2.prototype.createScene = function (title) {
            var _this = this;
            this.sceneDTO = qec.createExample(title);
            if (!this.isParallel) {
                this.sc = new qec.scene();
                this.sc.setDebug(true);
                this.sc.create(this.sceneDTO, function () {
                    if (_this.isHardware)
                        _this.renderer = new qec.hardwareRenderer();
                    else {
                        var sr = new qec.simpleRenderer();
                        sr.setRenderSteps(_this.renderSteps);
                        _this.renderer = sr;
                    }
                    _this.renderer.setContainerAndSize(_this.element, 600, 600);
                    var scrend = _this.sc.get(function (o) { return o instanceof qec.scRenderer; }, 'render');
                    _this.renderSettings = scrend.settings;
                    _this.renderSettings.shadows = true;
                    _this.render(function () { });
                });
            }
            else {
                this.rendererParallel = new qec.parallelRenderer();
                this.rendererParallel.setContainerAndSize(this.element, 400, 400);
                this.rendererParallel.initDTO(this.sceneDTO, function () {
                    var sc = new qec.scene();
                    //this.cam = <camera> sc.createOne(this.sceneDTO, 'camera');
                    _this.render(function () { });
                });
            }
        };
        index2.prototype.render = function (done) {
            if (!this.isParallel) {
                this.renderer.updateShader(this.renderSettings.sd, this.renderSettings.spotLights.length);
                this.renderer.render(this.renderSettings);
                done();
            }
            else
                this.rendererParallel.render(this.renderSettings.camera, done);
        };
        index2.prototype.debug = function (x, y) {
            if (!this.isParallel)
                this.renderer.renderDebug(x, y, this.renderSettings);
        };
        index2.prototype.startRenderLoop = function () {
            var cam = this.renderSettings.camera;
            this.t = 5;
            this.camDist = vec2.distance(cam.target, cam.position);
            this.renderLoop();
        };
        index2.prototype.renderLoop = function () {
            var _this = this;
            if (this.t > 10)
                return;
            var cam = this.renderSettings.camera;
            cam.position[0] = cam.target[0] + this.camDist * Math.cos(Math.PI * 2 * this.t / 10);
            cam.position[1] = cam.target[1] + this.camDist * Math.sin(Math.PI * 2 * this.t / 10);
            cam.setPosition(cam.position);
            this.render(function () {
                _this.t += 0.5;
                setTimeout(function () { return _this.renderLoop(); }, 0);
            });
        };
        return index2;
    }());
    qec.index2 = index2;
})(qec || (qec = {}));
ko.bindingHandlers['element'] =
    {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            valueAccessor()(element);
        }
    };
ko.bindingHandlers['setElement'] =
    {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var fct = valueAccessor();
            fct.call(viewModel, element);
        }
    };
var qec;
(function (qec) {
    var materialView = (function () {
        function materialView() {
            this.editor = qec.inject(qec.editor);
            this.selectedIndex = -1;
        }
        materialView.prototype.setElement = function (elt) {
            var _this = this;
            this.spectrumElt = $(elt); //.find('.flatColorPicker');
            this.spectrumElt.spectrum({
                flat: true,
                showInput: true,
                showButtons: false,
                move: function (color) { return _this.onColorChange(color); }
            });
        };
        materialView.prototype.setSelectedIndex = function (i) {
            var fakePos = vec3.create();
            this.selectedIndex = i;
            if (i >= 0) {
                var m = this.editor.editorObjects[this.selectedIndex].diffuseColor;
                this.spectrumElt.spectrum("set", "rgb(" +
                    m[0] * 255 + "," +
                    m[1] * 255 + "," +
                    m[2] * 255 + ")");
            }
        };
        materialView.prototype.onColorChange = function (color) {
            var fakePos = vec3.create();
            if (this.selectedIndex >= 0) {
                var o = this.editor.editorObjects[this.selectedIndex];
                o.setDiffuseColor([color._r / 255, color._g / 255, color._b / 255]);
                this.editor.renderer.updateDiffuse(o.sd);
                this.editor.setRenderFlag();
            }
        };
        return materialView;
    }());
    qec.materialView = materialView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var profileExample = (function () {
        function profileExample() {
            this.profileView = qec.inject(qec.profileView);
            this.editor = qec.inject(qec.editor);
            this.points = [];
            this.canvas = document.createElement('canvas');
            this.bsplineDrawer = qec.inject(qec.bsplineDrawer);
        }
        profileExample.prototype.setContainer = function (elt) {
            elt.appendChild(this.canvas);
        };
        profileExample.prototype.setPoints = function (points) {
            this.points = points;
            this.canvas.width = 50;
            this.canvas.height = 100;
            var canvasPoints = [];
            for (var i = 0; i < points.length; ++i) {
                var px = this.points[i][0];
                var py = this.points[i][1];
                canvasPoints.push([px * this.canvas.width, (1 - py) * this.canvas.height]);
            }
            var ctx = this.canvas.getContext('2d');
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.fillStyle = "rgba(0,0,0,1)";
            //if (l.profileSmooth)
            this.bsplineDrawer.drawSpline(canvasPoints, this.canvas);
            //else
            //    this.lineDrawer.drawLine(this.points, this.canvas);
        };
        profileExample.prototype.click = function () {
            var o = this.editor.editorObjects[this.editor.selectedIndex];
            var bounds = o.profileBounds;
            var w = bounds[2] - bounds[0];
            var h = bounds[3] - bounds[1];
            var newPoints = [];
            for (var j = 0; j < this.points.length; ++j) {
                var rx = this.points[j][0];
                var ry = this.points[j][1];
                var x = (1 - rx) * bounds[0] + rx * bounds[2];
                var y = (1 - ry) * bounds[1] + ry * bounds[3];
                newPoints.push([x, y]);
            }
            o.setProfilePoints(newPoints);
            this.profileView.refresh();
            this.editor.renderer.updateFloatTextures(o.sd);
            this.editor.setRenderFlag();
        };
        return profileExample;
    }());
    qec.profileExample = profileExample;
    var profileExamples = (function () {
        function profileExamples() {
            this.examples = [];
            this.createExample = qec.injectFunc(profileExample);
            this.visible = ko.observable(true);
        }
        profileExamples.prototype.afterInject = function () {
            this.push([[0, 0], [1, 0], [1, 1], [0, 1]]);
            this.push([[0, 0], [1, 0], [1, 0.4], [0.5, 0.4], [0.5, 0.6], [1, 0.6], [1, 1], [0, 1]]);
            this.push([[0, 0], [1, 0], [1, 0.5], [0.5, 0.5], [0.5, 1], [0, 1]]);
            this.push([[0, 0], [1, 0], [1, 1], [0.5, 1], [0.5, 0.5], [0, 0.5]]);
            this.push([[0.5, 0], [1, 0], [1, 1], [0.5, 1]]);
        };
        profileExamples.prototype.push = function (p) {
            var ex = this.createExample();
            ex.setPoints(p);
            this.examples.push(ex);
        };
        profileExamples.prototype.toggleVisible = function () {
            this.visible(!this.visible());
        };
        return profileExamples;
    }());
    qec.profileExamples = profileExamples;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var profileView = (function () {
        function profileView() {
            var _this = this;
            this.editor = qec.inject(qec.editor);
            this.bsplineDrawer = new qec.bsplineDrawer();
            this.lineDrawer = new qec.lineDrawer();
            this.points = [];
            this.pointIndex = -1;
            this.doUpdate = false;
            this.selectedIndex = -1;
            this.maxCanvasWidth = 390;
            this.maxCanvasHeight = 390;
            this.offsetX = 20;
            this.offsetY = 20;
            this.profileExamples = qec.inject(qec.profileExamples);
            this.container = ko.observable();
            this.container.subscribe(function () { return _this.init(_this.container()); });
        }
        profileView.prototype.init = function (elt) {
            var _this = this;
            this.canvas = document.createElement('canvas');
            this.canvas.style.border = 'solid 1px red';
            elt.appendChild(this.canvas);
            this.canvas.width = this.maxCanvasWidth;
            this.canvas.height = this.maxCanvasHeight;
            this.canvas.addEventListener('mousemove', function (e) { return _this.onMouseMove(e); });
            this.canvas.addEventListener('mousedown', function (e) { return _this.onMouseDown(e); });
            this.canvas.addEventListener('mouseup', function (e) { return _this.onMouseUp(e); });
            this.points = [[0, 0], [295, 0], [295, 295], [0, 295]];
            this.draw();
        };
        profileView.prototype.setAsLines = function () {
            if (this.selectedIndex >= 0) {
                var l = this.editor.editorObjects[this.selectedIndex];
                l.profileSmooth = false;
                this.draw();
                this.updateEditor();
            }
        };
        ;
        profileView.prototype.setAsSmooth = function () {
            if (this.selectedIndex >= 0) {
                var l = this.editor.editorObjects[this.selectedIndex];
                l.profileSmooth = true;
                this.draw();
                this.updateEditor();
            }
        };
        profileView.prototype.refresh = function () {
            this.setSelectedIndex(this.selectedIndex);
        };
        profileView.prototype.setSelectedIndex = function (i) {
            this.selectedIndex = i;
            if (i < 0)
                return;
            //console.log('profileView.setSelectedIndex');
            var l = this.editor.editorObjects[i];
            var profileBounds = l.profileBounds;
            var boundW = profileBounds[2] - profileBounds[0];
            var boundH = profileBounds[3] - profileBounds[1];
            var canvasWidth = this.maxCanvasWidth;
            var canvasHeight = this.maxCanvasHeight;
            if (boundH > boundW)
                canvasWidth = canvasHeight * boundW / boundH;
            else
                canvasHeight = canvasWidth * boundH / boundW;
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            // convert points in pixels
            this.points = [];
            for (var j = 0; j < l.profilePoints.length; ++j) {
                var x = l.profilePoints[j][0];
                var y = l.profilePoints[j][1];
                /*
                var px = (x - profileBounds[0]) /  (profileBounds[2] - profileBounds[0]) * this.canvas.width;
                var py = this.canvas.height - (y - profileBounds[1]) /  (profileBounds[3] - profileBounds[1]) * this.canvas.height;
                */
                var drawWidth = this.canvas.width - 2 * this.offsetX;
                var drawHeight = this.canvas.height - 2 * this.offsetY;
                var px = this.offsetX + (x - profileBounds[0]) / (profileBounds[2] - profileBounds[0]) * drawWidth;
                var py = drawHeight + this.offsetY - (y - profileBounds[1]) / (profileBounds[3] - profileBounds[1]) * drawHeight;
                this.points.push([px, py]);
            }
            this.draw();
        };
        profileView.prototype.updateEditor = function () {
            if (this.selectedIndex < 0)
                return;
            var l = this.editor.editorObjects[this.selectedIndex];
            var profileBounds = l.profileBounds;
            // convert points to real coordinates
            var profilePoints = [];
            for (var j = 0; j < this.points.length; ++j) {
                var px = this.points[j][0];
                var py = this.points[j][1];
                px -= this.offsetX;
                py -= this.offsetY;
                var drawWidth = this.canvas.width - 2 * this.offsetX;
                var drawHeight = this.canvas.height - 2 * this.offsetY;
                var x = (px / drawWidth) * (profileBounds[2] - profileBounds[0]) + profileBounds[0];
                var y = (py - drawHeight) / drawHeight * (profileBounds[3] - profileBounds[1]) + profileBounds[1];
                y *= -1;
                profilePoints.push([x, y]);
            }
            l.setProfilePoints(profilePoints);
            this.editor.renderer.updateFloatTextures(l.sd);
            this.editor.setRenderFlag();
        };
        profileView.prototype.draw = function () {
            if (this.selectedIndex < 0)
                return;
            var l = this.editor.editorObjects[this.selectedIndex];
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.fillStyle = "rgba(0,0,0,1)";
            if (l.profileSmooth)
                this.bsplineDrawer.drawSpline(this.points, this.canvas);
            else
                this.lineDrawer.drawLine(this.points, this.canvas);
            ctx.strokeStyle = "rgba(128,128,128,1)";
            ctx.beginPath();
            ctx.moveTo(this.points[0][0], this.points[0][1]);
            for (var i = 0; i < this.points.length; i++) {
                ctx.lineTo(this.points[i][0], this.points[i][1]);
            }
            ctx.stroke();
            ctx.closePath();
            // draw points        
            for (var i = 0; i < this.points.length; i++) {
                ctx.fillStyle = "rgba(0,255,0,1)";
                if (this.pointIndex == i)
                    ctx.fillStyle = "rgba(255,0,0,1)";
                ctx.beginPath();
                ctx.arc(this.points[i][0], this.points[i][1], 5, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.closePath();
            }
        };
        profileView.prototype.onMouseDown = function (e) {
            this.pointIndex = -1;
            for (var i = 0; i < this.points.length; i++) {
                var dx = e.offsetX - this.points[i][0];
                var dy = e.offsetY - this.points[i][1];
                if (dx * dx + dy * dy < 5 * 5) {
                    this.pointIndex = i;
                }
            }
            this.draw();
            if (this.pointIndex >= 0) {
                this.isDown = true;
                this.doUpdate = true;
            }
        };
        profileView.prototype.onMouseUp = function (e) {
            this.isDown = false;
        };
        profileView.prototype.onMouseMove = function (e) {
            if (this.isDown) {
                this.points[this.pointIndex][0] = e.offsetX;
                this.points[this.pointIndex][1] = e.offsetY;
                this.doUpdate = true;
            }
        };
        profileView.prototype.updateLoop = function () {
            if (this.doUpdate) {
                this.doUpdate = false;
                this.draw();
                this.updateEditor();
            }
        };
        return profileView;
    }());
    qec.profileView = profileView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var selectController = (function () {
        function selectController() {
            this.collide = new qec.renderCollide();
            this.editor = qec.inject(qec.editor);
            this.editorView = qec.inject(qec.editorView);
            this.isMouseDown = false;
            this.ro = vec3.create();
            this.rd = vec3.create();
        }
        selectController.prototype.set = function () {
        };
        selectController.prototype.unset = function () {
        };
        selectController.prototype.onMouseMove = function (e) {
            if (this.isMouseDown) {
            }
            // update layerDataProfileDistanceField
            // or move camera
        };
        selectController.prototype.onMouseDown = function (e) {
            if (e.button != 0)
                return;
            this.pick(e);
            this.isMouseDown = true;
        };
        selectController.prototype.onMouseUp = function (e) {
        };
        selectController.prototype.updateLoop = function () {
        };
        selectController.prototype.pick = function (e) {
            var minDist = 666;
            var iMin = -1;
            this.isMouseDown = false;
            this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
            for (var i = 0; i < this.editor.editorObjects.length; ++i) {
                this.collide.collide(this.editor.editorObjects[i].sd, this.ro, this.rd);
                //console.log(this.collide.pos);
                //console.log(this.collide.minDist);
                //this.vm.layers[i].sd.material.setDiffuse(0,1,0);
                if (this.collide.hasCollided && this.collide.dist < minDist) {
                    minDist = this.collide.dist;
                    iMin = i;
                }
            }
            if (iMin > -1) {
                this.editorView.setSelectedIndex(iMin);
            }
            //this.vm.setUpdateFlag();;
        };
        selectController.prototype.onMouseWheel = function (e) {
        };
        return selectController;
    }());
    qec.selectController = selectController;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var topView = (function () {
        function topView() {
        }
        topView.prototype.setElement = function (elt) {
            var _this = this;
            // register on mouse move
            // register on mouse click
            //var elt = document.getElementsByClassName('.renderContainer')[0];
            //elt = elt.firstElementChild;
            elt.addEventListener('mousemove', function (e) { return _this.onMouseMove(e); });
            elt.addEventListener('mousedown', function (e) { return _this.onMouseDown(e); });
            elt.addEventListener('mouseup', function (e) { return _this.onMouseUp(e); });
        };
        topView.prototype.setLayer = function (layerData) {
        };
        topView.prototype.onMouseMove = function (e) {
            // update layerDataProfileDistanceField
            // or move camera
        };
        topView.prototype.onMouseDown = function (e) {
            console.log('onMouseDown');
        };
        topView.prototype.onMouseUp = function (e) {
            console.log('onMouseUp');
        };
        return topView;
    }());
    qec.topView = topView;
})(qec || (qec = {}));
//# sourceMappingURL=built.js.map