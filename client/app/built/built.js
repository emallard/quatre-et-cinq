var qec;
(function (qec) {
    var bsplineDrawer = /** @class */ (function () {
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
            ctx.stroke();
            ctx.closePath();
        };
        return bsplineDrawer;
    }());
    qec.bsplineDrawer = bsplineDrawer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var editor = /** @class */ (function () {
        function editor() {
            this.simpleRenderer = qec.injectNew(qec.simpleRenderer);
            this.hardwareRenderer = qec.injectNew(qec.hardwareRenderer);
            this.svgImporter = qec.inject(qec.svgImporter);
            this.texturePacker = qec.inject(qec.texturePacker);
            this.exportSTL = qec.inject(qec.exportSTL);
            this.exportOBJ = qec.inject(qec.exportOBJ);
            this.signedDistanceToTriangles = qec.inject(qec.signedDistanceToTriangles);
            this.renderSettings = new qec.renderSettings();
            this.workspace = qec.inject(qec.workspace);
            this.sdUnion = new qec.sdUnion();
            this.sdHoleUnion = new qec.sdUnion();
            this.sdSubtraction = new qec.sdSubtraction();
            this.sdUnionWithHoleSd = new qec.sdUnion();
            this.renderFlag = false;
            this.updateFlag = false;
            this.showBoundingBox = false;
            this.sdGround = new qec.sdBox();
            this.groundVisible = false;
            this.firstImport = true;
        }
        editor.prototype.init = function (containerElt) {
            var isSimple = false;
            this.simpleRenderer = new qec.simpleRenderer();
            this.simpleRenderer.setContainerAndSize(containerElt, 300, 300);
            this.simpleRenderer.canvas.style.display = 'none';
            this.hardwareRenderer = new qec.hardwareRenderer();
            this.hardwareRenderer.setContainerAndSize(containerElt, window.innerWidth, window.innerHeight - 102);
            console.log("this.hardwareRenderer.height : " + this.hardwareRenderer.height);
            this.setSimpleRenderer(isSimple);
            this.renderSettings.camera.setCam(vec3.fromValues(0, -1, 3), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 1));
            this.workspace.rimLight.createFrom({
                type: 'spotLightDTO',
                position: [2, 2, 0.5],
                direction: [-1, -1, 0.1],
                intensity: 0.2
            });
            this.workspace.keyLight.createFrom({
                type: 'spotLightDTO',
                position: [-1, -1, 5],
                direction: [0, 0, 0],
                intensity: 0.8
            });
            this.workspace.fillLight.createFrom({
                type: 'spotLightDTO',
                position: [2, -2, 0.5],
                direction: [-1, 1, -1],
                intensity: 0.2
            });
            this.renderSettings.spotLights.push(this.workspace.keyLight, this.workspace.fillLight, this.workspace.rimLight);
            this.sdGround = new qec.sdBox();
            this.sdGround.getMaterial(null).setDiffuse(0.8, 0.8, 0.8);
            this.sdGround.setHalfSize(2, 2, 0.01);
        };
        editor.prototype.getViewportWidth = function () {
            return this.renderer.getViewportWidth();
        };
        editor.prototype.getViewportHeight = function () {
            return this.renderer.getViewportHeight();
        };
        editor.prototype.setSelectedIndex = function (index) {
            var _this = this;
            this.workspace.selectedIndex = index;
            this.workspace.editorObjects.forEach(function (o, i) {
                o.setSelected(i == index);
                _this.renderer.updateDiffuse(o.sd);
            });
            this.setRenderFlag();
        };
        editor.prototype.getCamera = function () {
            return this.renderSettings.camera;
        };
        editor.prototype.addSvg = function (svgContent) {
            this.workspace.importedSvgs.push(svgContent);
        };
        editor.prototype.setSelectedSvgIndex = function (index, done) {
            this.workspace.selectedSvgIndex = index;
            var svgContent = this.workspace.importedSvgs[this.workspace.selectedSvgIndex];
            this.importSvg(svgContent, done);
        };
        editor.prototype.importSvg = function (svgContent, done) {
            var _this = this;
            console.log('importSvg');
            if (this.firstImport) {
                this.firstImport = false;
                this.svgImporter.importSvgInWorkspace(this.workspace, svgContent, function () {
                    _this.setUpdateFlag();
                    done();
                });
            }
            else {
                this.svgImporter.reimport(this.workspace, svgContent, function () {
                    _this.setUpdateFlag();
                    done();
                });
            }
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
        editor.prototype.updateScene = function () {
            // update scene
            this.sdUnion.array = [];
            this.sdHoleUnion.array = [];
            this.sdSubtraction.array = [this.sdUnion, this.sdHoleUnion];
            this.sdUnionWithHoleSd.array = [this.sdSubtraction];
            if (this.groundVisible)
                this.sdUnion.array.push(this.sdGround);
            var objs = this.workspace.editorObjects;
            for (var i = 0; i < objs.length; ++i) {
                if (!objs[i].isHole)
                    this.sdUnion.array.push(objs[i].sd);
                else {
                    this.sdHoleUnion.array.push(objs[i].sd);
                    var sdEffect = new qec.sdIntersection();
                    var sdG = new qec.sdGrid();
                    vec3.set(sdG.size, 0.063, 0.063, 0.063);
                    sdG.thickness = 0.0001;
                    var sdB = new qec.sdBorder();
                    sdB.borderIn = 0.0001;
                    sdB.borderOut = 0;
                    sdB.sd = objs[i].sd;
                    sdEffect.array = [sdB, sdG];
                    this.sdUnionWithHoleSd.array.push(sdEffect);
                }
            }
            if (this.sdHoleUnion.array.length == 0)
                this.renderSettings.sd = this.sdUnion;
            else
                this.renderSettings.sd = this.sdUnionWithHoleSd; //this.sdSubtraction;
            this.renderer.updateShader(this.renderSettings.sd, this.renderSettings.spotLights.length, this.texturePacker);
        };
        editor.prototype.updateSprites = function () {
            var _this = this;
            var textures = [];
            this.workspace.editorObjects.forEach(function (o) {
                textures.push(o.top.floatTexture, o.profile.floatTexture);
            });
            this.texturePacker.repackMode = 3;
            this.texturePacker.repack(textures);
            //this.texturePacker.debugInfoInBody(10000);
            this.workspace.editorObjects.forEach(function (o) {
                _this.updateSignedDistance(o);
            });
            this.renderer.updateAllPackedTextures(this.texturePacker);
        };
        editor.prototype.updateSignedDistance = function (obj) {
            obj.updateSignedDistanceWithSprites(this.texturePacker.getSprite(obj.top.floatTexture), this.texturePacker.getSprite(obj.profile.floatTexture));
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
                this.updateSprites();
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
            return this.workspace.editorObjects.map(function (l) { return l.sd; });
        };
        editor.prototype.toggleShadows = function () {
            this.renderSettings.shadows = !this.renderSettings.shadows;
            this.setRenderFlag();
        };
        editor.prototype.computeOBJ = function () {
            this.signedDistanceToTriangles.compute(this.getAllSd(), 50, 50, 50, 1);
            return this.exportOBJ.getText(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals, this.signedDistanceToTriangles.colors);
        };
        editor.prototype.computeOBJAsZip = function (icount, jcount, kcount, multiplier, done) {
            this.signedDistanceToTriangles.compute(this.getAllSd(), icount, jcount, kcount, multiplier);
            return this.exportOBJ.getZip(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals, this.signedDistanceToTriangles.colors, done);
        };
        editor.prototype.computeTextSTL = function () {
            this.signedDistanceToTriangles.compute(this.getAllSd(), 50, 50, 50, 1);
            return this.exportSTL.getText(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals);
        };
        editor.prototype.computeBinarySTL = function (icount, jcount, kcount, multiplier) {
            this.signedDistanceToTriangles.compute(this.getAllSd(), icount, jcount, kcount, multiplier);
            console.log("check tris, normals", this.signedDistanceToTriangles.triangles.length, 3 * this.signedDistanceToTriangles.normals.length);
            return this.exportSTL.getBinary(this.signedDistanceToTriangles.triangles, this.signedDistanceToTriangles.normals);
        };
        editor.prototype.computeBinarySTLAsZip = function (icount, jcount, kcount, multiplier, done) {
            console.log('computeBinarySTLAsZip');
            var stl = this.computeBinarySTL(icount, jcount, kcount, multiplier);
            var blob = new Blob([stl], { type: 'application/octet-stream' });
            zip.createWriter(new zip.BlobWriter("application/zip"), function (zipWriter) {
                zipWriter.add("a.stl", new zip.BlobReader(blob), function () {
                    console.log('zipwriter close');
                    zipWriter.close(done);
                });
            }, function (msg) { return console.error(msg); });
        };
        return editor;
    }());
    qec.editor = editor;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var editorObject = /** @class */ (function () {
        function editorObject() {
            this.sd = new qec.sdFields();
            this.isHole = false;
            this.top = new qec.distanceFieldCanvas();
            this.profile = new qec.distanceFieldCanvas();
            this.diffuseColor = vec3.create();
            this.inverseTransform = mat4.create();
            this.tmpTransform = mat4.create();
            this.bsplineDrawer = new qec.bsplineDrawer();
            this.lineDrawer = new qec.lineDrawer();
            this.profilePoints = [];
            this.profileBounds = vec4.create();
            this.tmpProfileCanvas = document.createElement('canvas');
            this.profileSmooth = true;
            this.needsTextureUpdate = true;
            this.needsTransformUpdate = true;
            this.needsMaterialUpdate = true;
            // default profile
            vec4.set(this.profileBounds, -0.2, 0, 0, 0.5);
            this.profilePoints = [[-0.2, 0], [-0.1, 0], [0, 0], [0, 0.1], [0, 0.2], [0, 0.3], [0, 0.4], [0, 0.5], [-0.1, 0.5], [-0.2, 0.5]];
            //this.profile.canvas.style.border = 'solid 1px red';
            //$('.debug').append(this.profile.canvas);    
        }
        editorObject.prototype.toDto = function () {
            var dto = new qec.editorObjectDto();
            dto.zTranslate = this.inverseTransform[14];
            dto.profilePoints = this.profilePoints;
            dto.profileBounds = float32ArrayToArray(this.profileBounds);
            dto.profileSmooth = this.profileSmooth;
            dto.topSvgId = this.topSvgId;
            return dto;
        };
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
        editorObject.prototype.updateInverseTransform = function () {
            mat4.copy(this.sd.inverseTransform, this.inverseTransform);
        };
        /*
        updateSignedDistance()
        {
            this.sd.init(
                this.top.floatTexture, vec4.fromValues(0,0,1,1), this.top.totalBounds,
                this.profile.floatTexture, vec4.fromValues(0,0,1,1), this.profile.totalBounds);
            mat4.copy(this.sd.inverseTransform, this.inverseTransform);
        }
        */
        editorObject.prototype.updateSignedDistanceWithSprites = function (topSprite, profileSprite) {
            this.sd.init(topSprite.bigTexture, topSprite.bounds, this.top.totalBounds, profileSprite.bigTexture, profileSprite.bounds, this.profile.totalBounds);
            mat4.copy(this.sd.inverseTransform, this.inverseTransform);
        };
        editorObject.prototype.setIsHole = function (isHole) {
            this.isHole = isHole;
        };
        editorObject.prototype.getAbsoluteCenter = function (out) {
            var bounds = this.top.totalBounds;
            mat4.invert(this.tmpTransform, this.inverseTransform);
            vec3.set(out, 0.5 * (bounds[2] + bounds[0]), 0.5 * (bounds[3] + bounds[1]), 0.5 * (this.profileBounds[3] + this.profileBounds[1]));
            vec3.transformMat4(out, out, this.tmpTransform);
        };
        editorObject.prototype.getAbsoluteTopCenter = function (out) {
            var bounds = this.top.totalBounds;
            mat4.invert(this.tmpTransform, this.inverseTransform);
            vec3.set(out, 0.5 * (bounds[2] + bounds[0]), 0.5 * (bounds[3] + bounds[1]), this.profileBounds[3]);
            vec3.transformMat4(out, out, this.tmpTransform);
        };
        editorObject.prototype.getAbsoluteBottomCenter = function (out) {
            var bounds = this.top.totalBounds;
            mat4.invert(this.tmpTransform, this.inverseTransform);
            vec3.set(out, 0.5 * (bounds[2] + bounds[0]), 0.5 * (bounds[3] + bounds[1]), this.profileBounds[1]);
            vec3.transformMat4(out, out, this.tmpTransform);
        };
        editorObject.prototype.getAbsoluteBounds = function (outMin, outMax) {
            var bounds = this.top.totalBounds;
            mat4.invert(this.tmpTransform, this.inverseTransform);
            vec3.set(outMin, bounds[0], bounds[1], this.profileBounds[1]);
            vec3.transformMat4(outMin, outMin, this.tmpTransform);
            vec3.set(outMax, bounds[2], bounds[3], this.profileBounds[3]);
            vec3.transformMat4(outMax, outMax, this.tmpTransform);
        };
        return editorObject;
    }());
    qec.editorObject = editorObject;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var lineDrawer = /** @class */ (function () {
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
    var updateLoop = /** @class */ (function () {
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
    var workspace = /** @class */ (function () {
        function workspace() {
            this.svgRealSize = vec2.fromValues(1, 1);
            this.editorObjects = [];
            this.selectedIndex = -1;
            this.rimLight = new qec.spotLight();
            this.keyLight = new qec.spotLight();
            this.fillLight = new qec.spotLight();
            this.importedSvgs = [];
            this.selectedSvgIndex = -1;
            this.sculpteoUuids = [];
        }
        workspace.prototype.toDto = function () {
            var dto = new qec.workspaceDto();
            dto.editorObjects = this.editorObjects.map(function (o) { return o.toDto(); });
            dto.importedSvgs = this.importedSvgs;
            dto.selectedSvgIndex = this.selectedSvgIndex;
            dto.sculpteoUuids = this.sculpteoUuids;
            return dto;
        };
        workspace.prototype.pushObject = function (o) {
            this.editorObjects.push(o);
            o.needsTextureUpdate = true;
            o.needsTransformUpdate = true;
            o.needsMaterialUpdate = true;
        };
        workspace.prototype.getSelectedObject = function () {
            if (this.selectedIndex == -1)
                return null;
            return this.editorObjects[this.selectedIndex];
        };
        return workspace;
    }());
    qec.workspace = workspace;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var exportOBJ = /** @class */ (function () {
        function exportOBJ() {
        }
        exportOBJ.prototype.getText = function (triangles, normals, colors) {
            var d = 5;
            var obj = '';
            var materials = {};
            var numMaterials = 0;
            for (var i = 0; i < triangles.length / 9; ++i) {
                var color = colors[3 * i + 0] + ' ' + colors[3 * i + 1] + ' ' + colors[3 * i + 2];
                if (materials[color] == undefined) {
                    materials[color] = {
                        name: "mat" + numMaterials,
                        diffuse: color,
                        faces: ""
                    };
                    numMaterials++;
                }
                obj += "v " + triangles[9 * i + 0].toFixed(d) + ' ' + triangles[9 * i + 1].toFixed(d) + ' ' + triangles[9 * i + 2].toFixed(d) + '\n';
                obj += "v " + triangles[9 * i + 3].toFixed(d) + ' ' + triangles[9 * i + 4].toFixed(d) + ' ' + triangles[9 * i + 5].toFixed(d) + '\n';
                obj += "v " + triangles[9 * i + 6].toFixed(d) + ' ' + triangles[9 * i + 7].toFixed(d) + ' ' + triangles[9 * i + 8].toFixed(d) + '\n';
                materials[color].faces += 'f ' + (3 * i + 1) + ' ' + (3 * i + 2) + ' ' + (3 * i + 3) + '\n';
            }
            var mtl = '';
            var faces = '';
            for (var key in materials) {
                var mat = materials[key];
                mtl += 'newmtl ' + mat.name + '\n    Ka ' + mat.diffuse + '\n    Kd ' + mat.diffuse + '\n';
                faces += 'g g' + mat.name + '\nusemtl ' + mat.name + '\n';
                faces += mat.faces + '\n';
            }
            this.mtlFile = mtl;
            this.objFile = 'mtllib a.mtl\n' + obj + faces;
            return this.objFile;
        };
        exportOBJ.prototype.getZip = function (triangles, normals, colors, done) {
            var _this = this;
            this.getText(triangles, normals, colors);
            // http://gildas-lormeau.github.io/zip.js/core-api.html
            // use a zip.BlobWriter object to write zipped data into a Blob object
            zip.createWriter(new zip.BlobWriter("application/zip"), function (zipWriter) {
                // use a BlobReader object to read the data stored into blob variable
                zipWriter.add("a.obj", new zip.TextReader(_this.objFile), function () {
                    zipWriter.add("a.mtl", new zip.TextReader(_this.mtlFile), function () {
                        console.log('a.mtl');
                        zipWriter.close(done);
                    });
                });
            }, function (msg) { return console.error(msg); });
        };
        exportOBJ.prototype.getText_colorPerVertex = function (triangles, normals, colors) {
            var obj = '';
            var faces = '';
            for (var i = 0; i < triangles.length / 9; ++i) {
                obj += "v " + triangles[9 * i + 0] + ' ' + triangles[9 * i + 1] + ' ' + triangles[9 * i + 2]
                    + ' ' + colors[3 * i + 0] + ' ' + colors[3 * i + 1] + ' ' + colors[3 * i + 2] + '\n';
                obj += "v " + triangles[9 * i + 3] + ' ' + triangles[9 * i + 4] + ' ' + triangles[9 * i + 5]
                    + ' ' + colors[3 * i + 0] + ' ' + colors[3 * i + 1] + ' ' + colors[3 * i + 2] + '\n';
                obj += "v " + triangles[9 * i + 6] + ' ' + triangles[9 * i + 7] + ' ' + triangles[9 * i + 8]
                    + ' ' + colors[3 * i + 0] + ' ' + colors[3 * i + 1] + ' ' + colors[3 * i + 2] + '\n';
                faces += 'f ' + (3 * i + 1) + ' ' + (3 * i + 2) + ' ' + (3 * i + 3) + '\n';
            }
            return obj + faces;
        };
        return exportOBJ;
    }());
    qec.exportOBJ = exportOBJ;
})(qec || (qec = {}));
var qec;
(function (qec) {
    // https://gist.githubusercontent.com/paulkaplan/6d5f0ab2c7e8fdc68a61/raw/6bde174e27ae21905d871af3ef9fa3143919079f/binary_stl_writer.js
    var exportSTL = /** @class */ (function () {
        function exportSTL() {
        }
        exportSTL.prototype.getText = function (triangles, normals) {
            var stl = "solid blablabla\n";
            for (var i = 0; i < triangles.length / 9; ++i) {
                stl += 'facet normal 0 0 0\n'; // + normals[3*i+0] + ' ' + normals[3*i+1] + ' ' + normals[3*i+2] + '\n';
                stl += 'outer loop \n';
                stl += "vertex " + triangles[9 * i + 0] + ' ' + triangles[9 * i + 1] + ' ' + triangles[9 * i + 2] + '\n';
                stl += "vertex " + triangles[9 * i + 3] + ' ' + triangles[9 * i + 4] + ' ' + triangles[9 * i + 5] + '\n';
                stl += "vertex " + triangles[9 * i + 6] + ' ' + triangles[9 * i + 7] + ' ' + triangles[9 * i + 8] + '\n';
                stl += 'endloop \n';
                stl += 'endfacet \n';
            }
            stl += "endsolid blablabla\n";
            return stl;
        };
        exportSTL.prototype.getBinary = function (triangles, normals) {
            // http://buildaweso.me/project/2014/10/26/writing-binary-stl-files-from-threejs-objects
            var isLittleEndian = true; // STL files assume little endian, see wikipedia page
            var bufferSize = 84 + (50 * (triangles.length / 9));
            console.log('buffer size : ' + bufferSize);
            var buffer = new ArrayBuffer(bufferSize);
            var dv = new DataView(buffer);
            var offset = 0;
            offset += 80; // Header is empty
            dv.setUint32(offset, triangles.length / 9, isLittleEndian);
            offset += 4;
            for (var n = 0; n < triangles.length / 9; n++) {
                for (var ni = 0; ni < 3; ++ni)
                    offset = this.writeFloat(dv, offset, normals[3 * n + ni], isLittleEndian);
                for (var nj = 0; nj < 9; ++nj)
                    offset = this.writeFloat(dv, offset, triangles[9 * n + nj], isLittleEndian);
                var r = 31;
                var g = 0;
                var b = 0;
                if (n < 1000) {
                    r = 0;
                    g = 31;
                }
                var packedColor = 1 + r * 2 + g * Math.pow(2, 6) + b * Math.pow(2, 11);
                if (n < 1000)
                    dv.setUint16(offset, 64512, isLittleEndian);
                else
                    dv.setUint16(offset, 64512, false);
                offset += 2; // unused 'attribute byte count' is a Uint16
            }
            return dv;
        };
        exportSTL.prototype.writeVector = function (dataview, offset, vector, isLittleEndian) {
            offset = this.writeFloat(dataview, offset, vector.x, isLittleEndian);
            offset = this.writeFloat(dataview, offset, vector.y, isLittleEndian);
            return this.writeFloat(dataview, offset, vector.z, isLittleEndian);
        };
        ;
        exportSTL.prototype.writeFloat = function (dataview, offset, float, isLittleEndian) {
            dataview.setFloat32(offset, float, isLittleEndian);
            return offset + 4;
        };
        ;
        return exportSTL;
    }());
    qec.exportSTL = exportSTL;
    /*
    
        export class exportSTL_old
        {
            densities:Float32Array;
            icount = 70;
            jcount = 70;
            kcount = 70;
    
            tmpVec1 = vec3.create();
            tmpVec2 = vec3.create();
            tmpVec3 = vec3.create();
            tmpVecBary = vec3.create();
            tmpVecCross = vec3.create();
    
            compute(sds:sdFields[]):string
            {
                this.densities = new Float32Array(this.icount*this.jcount*this.kcount);
                //var diffuses = new Float32Array(3*100*100*50);
    
                var sdUni:sdUnion = new sdUnion();
                sds.forEach(x=>sdUni.array.push(x));
    
                var pos = vec3.create();
                var bounds = new Float32Array(6);
                var diffuse = vec3.create();
    
                var tmpMat = mat4.create();
                var min = vec3.create();
                var max = vec3.create();
    
                for (var s=0; s < sds.length; ++s)
                {
                    var sd = sds[s];
                    var bchs = sd.boundingCenterAndHalfSize;
    
                    sd.getInverseTransform(tmpMat);
                    mat4.invert(tmpMat, tmpMat);
                    
                    vec3.set(min, bchs[0] - bchs[4], bchs[1]-bchs[4],  bchs[2]-bchs[5]);
                    vec3.set(max, bchs[0] + bchs[4], bchs[1]+bchs[4],  bchs[2]+bchs[5]);
                    
                    vec3.transformMat4(min, min, tmpMat);
                    vec3.transformMat4(max, max, tmpMat);
    
                    for (var b=0; b < 3; ++b)
                    {
                        bounds[b] = Math.min(min[b], bounds[b]);
                        bounds[3+b] = Math.max(max[b], bounds[3+b]);
                    }
                }
    
                console.log('export bounding box : ' + float32ArrayToString(bounds));
                //return "";
                
                for (var i=0; i < this.icount; ++i)
                {
                    console.log(''+i+'/'+(this.icount-1));
                    var ri = i/(this.icount-1);
                    for (var j=0; j < this.jcount; ++j)
                    {
                        var rj = j/(this.jcount-1);
                        for (var k=0; k < this.kcount; ++k)
                        {
                            var rk = k/(this.kcount-1);
    
                            pos[0] = (1-ri) * bounds[0] + ri * bounds[3];
                            pos[1] = (1-rj) * bounds[1] + rj * bounds[4];
                            pos[2] = (1-rk) * bounds[2] + rk * bounds[5];
    
                            var d = sdUni.getDist(pos, false, false);
                            //sd.getMaterial(pos).getColor(diffuse);
    
                            var q = this.getq(i,j,k);
                            this.densities[q] = d;
                        }
                    }
                }
    
                //console.log(densities[this.getq(5,5,5)] + '=' + d.toFixed(3));
    
                var stl = "solid blablabla\n";
                var mc = new marchingCubes();
                var nn = vec3.fromValues(1,0,0);
    
                var bsx = (bounds[3]-bounds[0]) / (this.icount-1);
                var bsy = (bounds[4]-bounds[1]) / (this.jcount-1);
                var bsz = (bounds[5]-bounds[2]) / (this.kcount-1);
                
                for (var i=0; i < this.icount-1; ++i)
                {
                    console.log(''+i+'/'+(this.icount-1));
                    for (var j=0; j < this.jcount-1; ++j)
                    {
                        for (var k=0; k < this.kcount-1; ++k)
                        {
                            var q1 = this.getq(i,  j,  k);
                            var q2 = this.getq(i+1,j,  k);
                            var q3 = this.getq(i,  j+1,k);
                            var q4 = this.getq(i+1,j+1,k);
                            var q5 = this.getq(i,  j,  k+1);
                            var q6 = this.getq(i+1,j,  k+1);
                            var q7 = this.getq(i,  j+1,k+1);
                            var q8 = this.getq(i+1,j+1,k+1);
                            
                            mc.polygonize(
                                this.densities[q1], this.densities[q2], this.densities[q3], this.densities[q4],
                                this.densities[q5], this.densities[q6], this.densities[q7], this.densities[q8],
                                nn,nn,nn,nn,nn,nn,nn,nn,0);
    
                            for (var pi=0 ; pi < mc.posArrayLength ; )
                            {
                                vec3.set(this.tmpVec1, bsx*(i+mc.posArray[pi++]), bsy*(j+mc.posArray[pi++]), bsz*(k+mc.posArray[pi++]));
                                vec3.set(this.tmpVec2, bsx*(i+mc.posArray[pi++]), bsy*(j+mc.posArray[pi++]), bsz*(k+mc.posArray[pi++]));
                                vec3.set(this.tmpVec3, bsx*(i+mc.posArray[pi++]), bsy*(j+mc.posArray[pi++]), bsz*(k+mc.posArray[pi++]));
    
                                // http://buildaweso.me/project/2014/10/26/writing-binary-stl-files-from-threejs-objects
                                // https://en.wikipedia.org/wiki/STL_(file_format)
    
                                // get material at barycentre
                                //vec3.add(this.tmpVecBary, this.tmpVec2, this.tmpVec3);
                                //vec3.add(this.tmpVecBary, this.tmpVecBary, this.tmpVec1);
                                //vec3.scale(this.tmpVecBary, this.tmpVecBary, 1/3);
                                //var diffuse = sd.getMaterial(this.tmpVecBary).diffuse;
    
                                var vertices = '';
                                vertices += "vertex " + this.tmpVec1[0] + ' ' + this.tmpVec1[1] + ' ' + this.tmpVec1[2] + '\n';
                                vertices += "vertex " + this.tmpVec2[0] + ' ' + this.tmpVec2[1] + ' ' + this.tmpVec2[2] + '\n';
                                vertices += "vertex " + this.tmpVec3[0] + ' ' + this.tmpVec3[1] + ' ' + this.tmpVec3[2] + '\n';
    
                                vec3.subtract(this.tmpVec3, this.tmpVec3, this.tmpVec1);
                                vec3.subtract(this.tmpVec2, this.tmpVec2, this.tmpVec1);
                                vec3.cross(this.tmpVecCross, this.tmpVec2, this.tmpVec3);
                                vec3.normalize(this.tmpVecCross, this.tmpVecCross);
                                stl += 'facet normal ' + this.tmpVecCross[0] + ' ' + this.tmpVecCross[1] + ' ' +this.tmpVecCross[2] + '\n';
                                stl += 'outer loop \n';
                                stl += vertices;
    
                                stl += 'endloop \n';
                                stl += 'endfacet \n';
                            }
                        }
                    }
                }
                stl += "endsolid blablabla";
                return stl;
            }
    
    
            getq(i:number, j:number, k:number)
            {
                return i + j*this.icount + k*this.icount*this.jcount;
            }
        }
    */
})(qec || (qec = {}));
var qec;
(function (qec) {
    var indexedMesh = /** @class */ (function () {
        function indexedMesh() {
        }
        return indexedMesh;
    }());
    qec.indexedMesh = indexedMesh;
})(qec || (qec = {}));
var qec;
(function (qec) {
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
    var marchingCubes = /** @class */ (function () {
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
    var signedDistanceToTriangles = /** @class */ (function () {
        function signedDistanceToTriangles() {
            this.icount = 100;
            this.jcount = 100;
            this.kcount = 100;
            this.tmpVec1 = vec3.create();
            this.tmpVec2 = vec3.create();
            this.tmpVec3 = vec3.create();
            this.tmpVecBary = vec3.create();
            this.tmpVecCross = vec3.create();
        }
        signedDistanceToTriangles.prototype.compute = function (sds, icount, jcount, kcount, multiplier) {
            this.icount = icount;
            this.jcount = jcount;
            this.kcount = kcount;
            this.triangles = [];
            this.colors = [];
            this.normals = [];
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
                        var q = this.getq(i, j, k);
                        this.densities[q] = d;
                    }
                }
            }
            //console.log(densities[this.getq(5,5,5)] + '=' + d.toFixed(3));
            var mc = new qec.marchingCubes();
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
                            vec3.set(this.tmpVec1, bsx * (i + mc.posArray[pi++]), bsy * (j + mc.posArray[pi++]), bsz * (k + mc.posArray[pi++]));
                            vec3.set(this.tmpVec2, bsx * (i + mc.posArray[pi++]), bsy * (j + mc.posArray[pi++]), bsz * (k + mc.posArray[pi++]));
                            vec3.set(this.tmpVec3, bsx * (i + mc.posArray[pi++]), bsy * (j + mc.posArray[pi++]), bsz * (k + mc.posArray[pi++]));
                            // get material at barycentre
                            vec3.add(this.tmpVecBary, this.tmpVec2, this.tmpVec3);
                            vec3.add(this.tmpVecBary, this.tmpVecBary, this.tmpVec1);
                            vec3.scale(this.tmpVecBary, this.tmpVecBary, 1 / 3);
                            this.tmpVecBary[0] += bounds[0];
                            this.tmpVecBary[1] += bounds[1];
                            this.tmpVecBary[2] += bounds[2];
                            var diffuse = sdUni.getMaterial(this.tmpVecBary).diffuse;
                            this.colors.push(diffuse[0], diffuse[1], diffuse[2]);
                            this.triangles.push(multiplier * this.tmpVec1[0], multiplier * this.tmpVec1[1], multiplier * this.tmpVec1[2]);
                            this.triangles.push(multiplier * this.tmpVec3[0], multiplier * this.tmpVec3[1], multiplier * this.tmpVec3[2]);
                            this.triangles.push(multiplier * this.tmpVec2[0], multiplier * this.tmpVec2[1], multiplier * this.tmpVec2[2]);
                            vec3.subtract(this.tmpVec3, this.tmpVec3, this.tmpVec1);
                            vec3.subtract(this.tmpVec2, this.tmpVec2, this.tmpVec1);
                            vec3.normalize(this.tmpVec3, this.tmpVec3);
                            vec3.normalize(this.tmpVec2, this.tmpVec2);
                            vec3.cross(this.tmpVecCross, this.tmpVec3, this.tmpVec2);
                            //vec3.normalize(this.tmpVecCross, this.tmpVecCross);
                            this.normals.push(this.tmpVecCross[0], this.tmpVecCross[1], this.tmpVecCross[2]);
                        }
                    }
                }
            }
        };
        signedDistanceToTriangles.prototype.getq = function (i, j, k) {
            return i + j * this.icount + k * this.icount * this.jcount;
        };
        return signedDistanceToTriangles;
    }());
    qec.signedDistanceToTriangles = signedDistanceToTriangles;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var editorObjectDto = /** @class */ (function () {
        function editorObjectDto() {
            this.profilePoints = [];
        }
        return editorObjectDto;
    }());
    qec.editorObjectDto = editorObjectDto;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var loadWorkspace = /** @class */ (function () {
        function loadWorkspace() {
            this.svgHelper = qec.injectNew(qec.svgHelper);
        }
        loadWorkspace.prototype.loadFromLocalStorage = function (editor) {
            var dto = JSON.parse(localStorage.getItem('workspace.json'));
            this.load(editor, dto, function () {
                editor.setSelectedSvgIndex(dto.selectedSvgIndex, function () { });
            });
        };
        loadWorkspace.prototype.load = function (editor, dto, done) {
            var _this = this;
            var workspace = editor.workspace;
            vec2FromArray(workspace.svgRealSize, dto.svgRealSize);
            this.svgHelper.setRealSizeToFit(workspace.svgRealSize);
            dto.importedSvgs.forEach(function (x) { return workspace.importedSvgs.push(x); });
            //editor.setSelectedSvgIndex(dto.selectedSvgIndex)
            workspace.selectedSvgIndex = dto.selectedSvgIndex;
            var svgContent = workspace.importedSvgs[workspace.selectedSvgIndex];
            var run = new qec.runAll();
            this.svgHelper.setSvg(svgContent, function () {
                dto.editorObjects.forEach(function (oDto) {
                    var o = new qec.editorObject();
                    o.topSvgId = oDto.topSvgId;
                    run.push(_this.getDrawOnly(o, oDto));
                });
            });
            run.run(done);
        };
        loadWorkspace.prototype.getDrawOnly = function (o, oDto) {
            var _this = this;
            return function (done) {
                return _this.svgHelper.drawOnly(o.topSvgId, function () {
                    //var size = this.svgHelper.getBoundingRealSize();
                    //var center = this.svgHelper.getRealCenter();
                    //o.setTopImg2(this.svgHelper.canvas2, vec4.fromValues(-0.5*size[0], -0.5*size[1], 0.5*size[0], 0.5*size[1]));
                    mat4.identity(o.inverseTransform);
                    mat4.translate(o.inverseTransform, o.inverseTransform, vec3.fromValues(/*center[0], center[1]*/ 0, 0, oDto.zTranslate));
                    mat4.invert(o.inverseTransform, o.inverseTransform);
                    o.setProfilePoints(oDto.profilePoints);
                    vec4FromArray(o.profileBounds, oDto.profileBounds);
                    o.profileSmooth = oDto.profileSmooth;
                    o.setDiffuseColor(_this.svgHelper.getColor());
                    done();
                });
            };
        };
        return loadWorkspace;
    }());
    qec.loadWorkspace = loadWorkspace;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var saveWorkspace = /** @class */ (function () {
        function saveWorkspace() {
        }
        saveWorkspace.prototype.saveJson = function (editor) {
            saveAs(JSON.stringify(editor.workspace.toDto()), "workspace.json");
        };
        saveWorkspace.prototype.saveJsonInLocalStorage = function (editor) {
            var content = JSON.stringify(editor.workspace.toDto());
            console.log(content);
            localStorage.setItem("workspace.json", content);
        };
        saveWorkspace.prototype.saveZip = function (editor) {
            var zip = new JSZip();
            zip.file("workspace.json", JSON.stringify(editor.workspace.toDto()));
            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                // see FileSaver.js
                saveAs(content, "example.zip");
            });
        };
        return saveWorkspace;
    }());
    qec.saveWorkspace = saveWorkspace;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var workspaceDto = /** @class */ (function () {
        function workspaceDto() {
            this.editorObjects = [];
            //camera:cameraDTO[] = [];
        }
        return workspaceDto;
    }());
    qec.workspaceDto = workspaceDto;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var svgAutoHeightHelper = /** @class */ (function () {
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
    var svgHelper = /** @class */ (function () {
        function svgHelper() {
            this.canvas = document.createElement('canvas');
            this.canvas2 = document.createElement('canvas');
            this.realSize = vec2.create();
        }
        svgHelper.prototype.setSvg = function (content, done) {
            var _this = this;
            //document.body.appendChild(this.canvas);
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
                console.log("img dimension : " + _this.imgWidth + "," + _this.imgHeight);
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
                    //console.log('layer: ' + child.getAttribute('id'));
                }
            }
            return foundList;
        };
        svgHelper.prototype.getAllElementsInLayer = function (elt, foundList) {
            for (var i = 0; i < elt.childNodes.length; ++i) {
                var child = elt.childNodes[i];
                if (child instanceof SVGElement) {
                    foundList.push(child);
                    //console.log('drawable: ' + child.getAttribute('id'));
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
    var svgImporter = /** @class */ (function () {
        function svgImporter() {
            this.svgAutoHeightHelper = qec.injectNew(qec.svgAutoHeightHelper);
            this.helper = qec.injectNew(qec.svgHelper);
            this.indexObject = 0;
            this.indexReimport = 0;
            this.tmpTranslation = vec3.create();
        }
        svgImporter.prototype.importSvgInWorkspace = function (workspace, content, done) {
            var _this = this;
            this.workspace = workspace;
            this.svgAutoHeightHelper.setSvg(content, function () {
                _this.helper.setSvg(content, function () { return _this.nextImport(done); });
            });
        };
        svgImporter.prototype.nextImport = function (done) {
            var _this = this;
            //var eltCount = 1; 
            var eltCount = this.helper.getElementsId().length;
            if (this.indexObject < eltCount) {
                var id = this.helper.getElementsId()[this.indexObject];
                console.log(id);
                this.helper.drawOnly(id, function () {
                    var autoHeight = _this.svgAutoHeightHelper.valueForIds[id];
                    _this.afterDraw(id, autoHeight * 0.05);
                    _this.nextImport(done);
                });
                this.indexObject++;
            }
            else {
                done();
            }
        };
        svgImporter.prototype.afterDraw = function (id, autoHeight) {
            //$('.debug').append(this.helper.canvas);
            //$('.debug').append(this.helper.canvas2);
            this.helper.setRealSizeToFit(vec2.fromValues(1, 1));
            var size = this.helper.getBoundingRealSize();
            var center = this.helper.getRealCenter();
            //console.log('size :' , size, 'center', center, 'autoHeight', autoHeight);
            var l = new qec.editorObject();
            this.workspace.pushObject(l);
            l.topSvgId = id;
            l.setTopImg2(this.helper.canvas2, vec4.fromValues(-0.5 * size[0], -0.5 * size[1], 0.5 * size[0], 0.5 * size[1]));
            l.setProfileHeight(autoHeight);
            l.setDiffuseColor(this.helper.getColor());
            mat4.identity(l.inverseTransform);
            mat4.translate(l.inverseTransform, l.inverseTransform, vec3.fromValues(center[0], center[1], 0));
            mat4.invert(l.inverseTransform, l.inverseTransform);
            // TODO Etienne
            //l.updateSignedDistance();
            //l.top.debugInfoInCanvas();
            //$('.debug').append(l.profile.canvas);              
        };
        svgImporter.prototype.reimport = function (workspace, content, done) {
            var _this = this;
            this.helper.setSvg(content, function () {
                _this.indexReimport = 0;
                _this.helper.setSvg(content, function () { return _this.nextReimport(done); });
            });
        };
        svgImporter.prototype.nextReimport = function (done) {
            var _this = this;
            //var eltCount = 1; 
            var eltCount = this.helper.getElementsId().length;
            if (this.indexReimport < eltCount) {
                var id = this.helper.getElementsId()[this.indexReimport];
                console.log('reimport ' + id);
                this.helper.drawOnly(id, function () {
                    var size = _this.helper.getBoundingRealSize();
                    var center = _this.helper.getRealCenter();
                    var l = _this.workspace.editorObjects[_this.indexReimport];
                    l.setTopImg2(_this.helper.canvas2, vec4.fromValues(-0.5 * size[0], -0.5 * size[1], 0.5 * size[0], 0.5 * size[1]));
                    l.setDiffuseColor(_this.helper.getColor());
                    // reset only xy-translate (careful we modify inverse transform)
                    mat4.getTranslation(_this.tmpTranslation, l.inverseTransform);
                    _this.tmpTranslation[2] = 0;
                    _this.tmpTranslation[0] = -_this.tmpTranslation[0] - center[0];
                    _this.tmpTranslation[1] = -_this.tmpTranslation[1] - center[1];
                    mat4.translate(l.inverseTransform, l.inverseTransform, _this.tmpTranslation);
                    _this.indexReimport++;
                    _this.nextReimport(done);
                });
            }
            else {
                done();
            }
        };
        return svgImporter;
    }());
    qec.svgImporter = svgImporter;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var cameraDTO = /** @class */ (function () {
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
    var camera = /** @class */ (function () {
        function camera() {
            this.projMatrix = mat4.create();
            this.transformMatrix = mat4.create();
            this.inversePMatrix = mat4.create();
            this.inverseTransformMatrix = mat4.create();
            this.position = vec3.create();
            this.target = vec3.create();
            this.up = vec3.create();
            this.fov = Math.PI / 6;
            this.tmpMatrix = mat4.create();
            this.tmpVec3 = vec3.create();
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
        camera.prototype.getScreenPositionPreTransform = function (out, pos, transform) {
            vec3.transformMat4(this.tmpVec3, pos, transform);
            this.getScreenPosition(out, this.tmpVec3);
        };
        camera.prototype.getScreenPosition = function (out, pos) {
            mat4.multiply(this.tmpMatrix, this.projMatrix, this.transformMatrix);
            vec3.transformMat4(out, pos, this.tmpMatrix);
            out[0] = (1 + out[0]) / 2 * this.canvasWidth;
            out[1] = (-1 + out[1]) / -2 * this.canvasHeight;
        };
        return camera;
    }());
    qec.camera = camera;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var directionalLightDTO = /** @class */ (function () {
        function directionalLightDTO() {
        }
        return directionalLightDTO;
    }());
    qec.directionalLightDTO = directionalLightDTO;
    var directionalLight = /** @class */ (function () {
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
    var distanceField = /** @class */ (function () {
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
    var distanceFieldCanvas = /** @class */ (function () {
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
            console.log('img.width : ' + img.width);
            console.log('img.height : ' + img.height);
            */
            this.canvas.width = dfWidth;
            this.canvas.height = dfHeight;
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, dfWidth, dfHeight);
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
        /*
                private loadImgs(src1:string, src2:string, callback:(img1:HTMLImageElement, img2:HTMLImageElement)=>void)
                {
                    var img = new Image();
                    img.onload = function()
                    {
                        var img2 = new Image();
                        img2.onload = function()
                        {
                            callback(img, img2);
                        }
                        img2.src = src2;
                    }
                    img.src = src1;
                }
        */
        distanceFieldCanvas.prototype.debugInfoInExistingCanvas = function (canvas) {
            canvas.width = this.canvas.width;
            canvas.height = this.canvas.height;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.distanceField.fillImageData(imageData.data, 2550);
            ctx.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
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
    var floatTexture = /** @class */ (function () {
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
    function textureDebugInCanvas(texture, textureComponent, scale, canvas) {
        canvas.width = texture.width;
        canvas.height = texture.height;
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        var w = texture.width;
        var h = texture.height;
        for (var i = 0; i < w; ++i) {
            for (var j = 0; j < h; ++j) {
                var d = texture.data[4 * (j * w + i) + textureComponent] * scale;
                var q = (h - 1 - j) * w + i;
                data[4 * q] = 0;
                data[4 * q + 1] = 0;
                data[4 * q + 2] = 0;
                data[4 * q + 3] = 255;
                if (d > 0) {
                    data[4 * q] = d;
                }
                else {
                    data[4 * q + 1] = -d;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
    }
    qec.textureDebugInCanvas = textureDebugInCanvas;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var pointLightDTO = /** @class */ (function () {
        function pointLightDTO() {
        }
        return pointLightDTO;
    }());
    qec.pointLightDTO = pointLightDTO;
    var pointLight = /** @class */ (function () {
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
    var renderSettings = /** @class */ (function () {
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
    var spotLightDTO = /** @class */ (function () {
        function spotLightDTO() {
        }
        return spotLightDTO;
    }());
    qec.spotLightDTO = spotLightDTO;
    var spotLight = /** @class */ (function () {
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
    var textureSprite = /** @class */ (function () {
        function textureSprite() {
            this.bounds = vec4.create(); // bounds between 0 and 1
        }
        return textureSprite;
    }());
    qec.textureSprite = textureSprite;
    var texturePacker = /** @class */ (function () {
        function texturePacker() {
            this.allBigTextures = [];
            this.allSprites = [];
            this.repackMode = 3;
        }
        texturePacker.prototype.getSprite = function (texture) {
            var found = this.allSprites.find(function (t) { return t.originalTexture == texture; });
            return found;
        };
        texturePacker.prototype.getTextureIndex = function (texture) {
            var found = this.allBigTextures.indexOf(texture);
            return found;
        };
        texturePacker.prototype.repackSdRec = function (rootSignedDistance) {
            var floatTextures = [];
            var expl = new qec.hardwareSignedDistanceExplorer();
            expl.explore(rootSignedDistance);
            expl.array.forEach(function (hsd) {
                var sd = hsd.sd;
                if (sd instanceof qec.sdFields) {
                    floatTextures.push(sd.topTexture, sd.profileTexture);
                }
            });
            this.repack(floatTextures);
        };
        texturePacker.prototype.repack = function (floatTextures) {
            if (this.repackMode == 0)
                this.repack0(floatTextures);
            else if (this.repackMode == 1)
                this.repack1(floatTextures);
            else if (this.repackMode == 2)
                this.repack2(floatTextures);
            else if (this.repackMode == 3)
                this.repack3(floatTextures);
        };
        texturePacker.prototype.repack0 = function (floatTextures) {
            this.allBigTextures = [];
            this.allSprites = [];
            for (var i = 0; i < floatTextures.length; ++i) {
                var texture = floatTextures[i];
                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = texture;
                vec4.set(sprite.bounds, 0, 0, 1, 1);
                this.allSprites.push(sprite);
                this.allBigTextures.push(texture);
                console.log('sprite pushed #' + i + ' ' + vec4.str(sprite.bounds));
            }
        };
        texturePacker.prototype.repack1 = function (floatTextures) {
            console.log('repack mode 1 ' + floatTextures.length + ' textures');
            this.allBigTextures = [];
            this.allSprites = [];
            for (var i = 0; i < floatTextures.length; ++i) {
                var texture = floatTextures[i];
                var bigTexture = new qec.floatTexture();
                bigTexture.width = 400;
                bigTexture.height = 400;
                bigTexture.data = new Float32Array(bigTexture.width * bigTexture.height * 4);
                for (var x = 0; x < texture.width; x++) {
                    for (var y = 0; y < texture.height; y++) {
                        var q = y * texture.width + x;
                        var qb = y * (bigTexture.width) + x;
                        bigTexture.data[4 * qb + 0] = texture.data[4 * q + 0];
                        bigTexture.data[4 * qb + 1] = texture.data[4 * q + 1];
                        bigTexture.data[4 * qb + 2] = texture.data[4 * q + 2];
                        bigTexture.data[4 * qb + 3] = texture.data[4 * q + 3];
                    }
                }
                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = bigTexture;
                var xMax = texture.width / bigTexture.width;
                var yMax = texture.height / bigTexture.height;
                var offsetX = 1 / bigTexture.width;
                var offsetY = 1 / bigTexture.height;
                vec4.set(sprite.bounds, 0, 0, xMax - offsetX, yMax - offsetY);
                this.allSprites.push(sprite);
                this.allBigTextures.push(bigTexture);
                console.log('sprite pushed #' + i + ' ' + vec4.str(sprite.bounds));
            }
        };
        texturePacker.prototype.repack2 = function (floatTextures) {
            console.log('repack mode 2 ' + floatTextures.length + ' textures');
            this.allBigTextures = [];
            this.allSprites = [];
            var w = 400; //floatTextures[0].width;
            var h = 400; //floatTextures[0].height;
            var bigTexture = new qec.floatTexture();
            bigTexture.width = w * floatTextures.length;
            bigTexture.height = h;
            bigTexture.data = new Float32Array(bigTexture.width * bigTexture.height * 4);
            for (var i = 0; i < floatTextures.length; ++i) {
                var texture = floatTextures[i];
                for (var x = 0; x < texture.width; x++) {
                    for (var y = 0; y < texture.height; y++) {
                        var q = y * texture.width + x;
                        var qb = y * (bigTexture.width) + (i * w + x);
                        bigTexture.data[4 * qb + 0] = texture.data[4 * q + 0];
                        bigTexture.data[4 * qb + 1] = texture.data[4 * q + 1];
                        bigTexture.data[4 * qb + 2] = texture.data[4 * q + 2];
                        bigTexture.data[4 * qb + 3] = texture.data[4 * q + 3];
                    }
                }
                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = bigTexture;
                // sprite bounds
                var xMin = i / (floatTextures.length);
                var yMin = 0;
                var xMax = (i + (texture.width / 400)) / floatTextures.length;
                var yMax = (texture.height / 400);
                var offsetX = 1 / bigTexture.width;
                var offsetY = 1 / bigTexture.height;
                vec4.set(sprite.bounds, xMin + offsetX, yMin + offsetY, xMax - offsetX, yMax - offsetY);
                this.allSprites.push(sprite);
                //console.log('sprite pushed #' + i + ' ' + vec4.str(sprite.bounds));
            }
            this.allBigTextures.push(bigTexture);
        };
        texturePacker.prototype.repack3 = function (floatTextures) {
            console.log('repack mode 3 ' + floatTextures.length + ' textures');
            this.allBigTextures = [];
            this.allSprites = [];
            var w = 400; //floatTextures[0].width;
            var h = 400; //floatTextures[0].height;
            var indexInFloatTextures = 0;
            var maxSpriteInBigTexture = 10;
            while (indexInFloatTextures < floatTextures.length) {
                var spriteCountInBigTexture = Math.min(maxSpriteInBigTexture, floatTextures.length - indexInFloatTextures);
                var bigTexture = new qec.floatTexture();
                bigTexture.width = w * spriteCountInBigTexture;
                bigTexture.height = h;
                bigTexture.data = new Float32Array(bigTexture.width * bigTexture.height * 4);
                this.allBigTextures.push(bigTexture);
                indexInFloatTextures += spriteCountInBigTexture;
                console.log('bigTexture created for ' + spriteCountInBigTexture + ' sprites');
            }
            var bigTextureIndex = 0;
            var spriteIndex = 0;
            for (var i = 0; i < floatTextures.length; ++i) {
                var texture = floatTextures[i];
                var bigTexture = this.allBigTextures[bigTextureIndex];
                for (var x = 0; x < texture.width; x++) {
                    for (var y = 0; y < texture.height; y++) {
                        var q = y * texture.width + x;
                        var qb = y * (bigTexture.width) + (spriteIndex * w + x);
                        bigTexture.data[4 * qb + 0] = texture.data[4 * q + 0];
                        bigTexture.data[4 * qb + 1] = texture.data[4 * q + 1];
                        bigTexture.data[4 * qb + 2] = texture.data[4 * q + 2];
                        bigTexture.data[4 * qb + 3] = texture.data[4 * q + 3];
                    }
                }
                var sprite = new textureSprite();
                sprite.originalTexture = texture;
                sprite.bigTexture = bigTexture;
                // sprite bounds
                var xMin = (spriteIndex * 400) / (bigTexture.width);
                var yMin = 0;
                var xMax = (spriteIndex * 400 + texture.width) / bigTexture.width;
                var yMax = (texture.height / bigTexture.height);
                var offsetX = 1 / bigTexture.width;
                var offsetY = 1 / bigTexture.height;
                vec4.set(sprite.bounds, xMin + offsetX, yMin + offsetY, xMax - offsetX, yMax - offsetY);
                this.allSprites.push(sprite);
                //console.log('sprite pushed #' + bigTextureIndex + '/' + spriteIndex + ' ' + vec4.str(sprite.bounds));
                spriteIndex++;
                if (spriteIndex >= maxSpriteInBigTexture) {
                    spriteIndex = 0;
                    bigTextureIndex++;
                }
            }
        };
        texturePacker.prototype.debugInfoInBody = function (scale) {
            this.allBigTextures.forEach(function (t) {
                var canvas = document.createElement('canvas');
                qec.textureDebugInCanvas(t, 0, scale, canvas);
                document.body.appendChild(canvas);
            });
        };
        return texturePacker;
    }());
    qec.texturePacker = texturePacker;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var hardwareRenderer = /** @class */ (function () {
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
            console.log("set hardwareRenderer " + rWidth + "," + rHeight);
            this.initTHREE();
            this.expl = new qec.hardwareSignedDistanceExplorer();
            this.text = new qec.hardwareShaderText();
            this.gShaderMaterial.uniforms.u_inverseTransforms = { type: "m4v", value: [] };
            this.gShaderMaterial.uniforms.u_diffuses = { type: "3fv", value: [] };
            this.gShaderMaterial.uniforms.u_floatTextures = { type: "tv", value: [] };
            //this.gShaderMaterial.uniforms.u_topTextureIndex = { type: "fv", value: []};
            //this.gShaderMaterial.uniforms.u_profileTextureIndex = { type: "fv", value: []};
            this.gShaderMaterial.uniforms.u_topTextureSpriteBounds = { type: "4fv", value: [] };
            this.gShaderMaterial.uniforms.u_profileTextureSpriteBounds = { type: "4fv", value: [] };
            this.gShaderMaterial.uniforms.u_topBounds = { type: "4fv", value: [] };
            this.gShaderMaterial.uniforms.u_profileBounds = { type: "4fv", value: [] };
        };
        hardwareRenderer.prototype.getViewportWidth = function () {
            return this.width;
        };
        hardwareRenderer.prototype.getViewportHeight = function () {
            return this.height;
        };
        hardwareRenderer.prototype.getCanvas = function () {
            return this.gRenderer.domElement;
        };
        hardwareRenderer.prototype.showBoundingBox = function (b) {
        };
        hardwareRenderer.prototype.updateShader = function (sd, lightCount, packer) {
            console.log('hardwareRenderer.updateShader');
            this.expl.explore(sd);
            var generatedPart = this.text.generateDistance(this.expl, packer)
                + this.text.generateColor(this.expl);
            var generatedLight = this.text.generateLight(lightCount);
            this.fragmentShader = ''
                + qec.resources.all['app/ts/render/hardware/10_sd.glsl']
                + qec.resources.all['app/ts/render/hardware/11_sdFields.glsl']
                + generatedPart
                + qec.resources.all['app/ts/render/hardware/20_light.glsl']
                + generatedLight
                + qec.resources.all['app/ts/render/hardware/30_renderPixel.glsl'];
            //console.log(generatedPart);
            //console.log(generatedLight);
            this.gViewQuad.material.fragmentShader = this.fragmentShader;
            this.gViewQuad.material.needsUpdate = true;
            this.updateAllUniformsForAll();
            this.updateAllPackedTextures(packer);
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
        };
        hardwareRenderer.prototype.updateAllPackedTextures = function (packer) {
            var _this = this;
            packer.allBigTextures.forEach(function (t, i) {
                var texture = new THREE.DataTexture(t.data, t.width, t.height, THREE.RGBAFormat, THREE.FloatType);
                texture.needsUpdate = true;
                _this.gShaderMaterial.uniforms.u_floatTextures.value[i] = texture;
            });
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
            //            this.gRenderer = new THREE.WebGLRenderer(
            //                {/*preserveDrawingBuffer: true*/}
            //            );
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('webgl2');
            this.gRenderer = new THREE.WebGLRenderer({ canvas: canvas, context: context });
            this.gRenderer.setSize(this.width, this.height);
            //gRenderer.setClearColorHex(0x000000, 1);
            this.gRenderer.setClearColor(0xffffff, 1);
            this.gRenderer.setPixelRatio(window.devicePixelRatio);
            //gRenderer.autoClear = false;
            //this.container.appendChild(this.gRenderer.domElement);
            this.container.appendChild(canvas);
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
        };
        return hardwareRenderer;
    }());
    qec.hardwareRenderer = hardwareRenderer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var hardwareShaderText = /** @class */ (function () {
        function hardwareShaderText() {
        }
        hardwareShaderText.prototype.generateDistance = function (expl, packer) {
            console.log('generateDistance');
            var shader = '';
            var hsdArray = expl.array;
            shader += 'uniform mat4 u_inverseTransforms[' + hsdArray.length + '];\n\n';
            var count = expl.getSdFieldsCount();
            /*
            shader +=  count == 0 ? '' :
                'uniform sampler2D u_topTextures[' + count +'];\n' +
                'uniform sampler2D u_profileTextures[' + count + '];\n' +
                'uniform vec4 u_topBounds[' + count +'];\n' +
                'uniform vec4 u_profileBounds[' + count + '];\n'+
                '\n';
            */
            shader += count == 0 ? '' :
                'uniform sampler2D u_floatTextures[' + packer.allBigTextures.length + '];\n' +
                    'uniform int  u_topTextureIndex[' + count + '];\n' +
                    'uniform int  u_profileTextureIndex[' + count + '];\n' +
                    'uniform vec4 u_topTextureSpriteBounds[' + count + '];\n' +
                    'uniform vec4 u_profileTextureSpriteBounds[' + count + '];\n' +
                    'uniform vec4 u_topBounds[' + count + '];\n' +
                    'uniform vec4 u_profileBounds[' + count + '];\n' +
                    '\n';
            // declare functions
            for (var i = hsdArray.length - 1; i >= 0; --i) {
                shader += 'float getDist_' + i + '(vec3 pos);\n';
                shader += 'float getDist2_' + i + '(vec3 pos, vec3 rd);\n';
            }
            shader += '\n';
            // implementations
            for (var i = hsdArray.length - 1; i >= 0; --i) {
                shader += this.generateOneDistance(expl, packer, hsdArray[i], false);
                shader += '\n\n';
                shader += this.generateOneDistance(expl, packer, hsdArray[i], true);
                shader += '\n\n';
            }
            shader += 'float getDist(vec3 pos) { return getDist_0(pos); }\n';
            shader += 'float getDist2(vec3 pos, vec3 rd) { return getDist2_0(pos, rd); }\n';
            return shader;
        };
        hardwareShaderText.prototype.generateOneDistance = function (expl, packer, hsd, isDist2) {
            var sd = hsd.sd;
            console.log('generateOneDistance ' + hsd.index);
            if (sd instanceof qec.sdFields) {
                var m = mat4.create();
                sd.getInverseTransform(m);
                var topTextureIndex = packer.getTextureIndex(sd.topTexture);
                var profileTextureIndex = packer.getTextureIndex(sd.profileTexture);
                var text = this.getDistSignature(hsd.index, isDist2) + ' { ';
                if (!isDist2)
                    text += '\n  return sdFieldsWithSprites1_(pos,';
                else
                    text += '\n  return sdFieldsWithSprites2_(pos, rd,';
                text += ''
                    + '\n    u_floatTextures[' + topTextureIndex + '],'
                    + '\n    u_floatTextures[' + profileTextureIndex + '],'
                    + '\n    u_topTextureSpriteBounds[' + hsd.sdFieldIndex + '],'
                    + '\n    u_profileTextureSpriteBounds[' + hsd.sdFieldIndex + '],'
                    + '\n    u_topBounds[' + hsd.sdFieldIndex + '],'
                    + '\n    u_profileBounds[' + hsd.sdFieldIndex + '],'
                    + '\n    u_inverseTransforms[' + hsd.index + ']'
                    + '\n  );}';
                return text;
            }
            if (sd instanceof qec.sdBox) {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + '\n  return sdBox(pos, ' + vec3.str(sd.halfSize) + ');'
                    + '\n}';
            }
            if (sd instanceof qec.sdSphere) {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + '\n  return sdSphere(pos, ' + sd.radius + ', u_inverseTransforms[' + hsd.index + ']);'
                    + '\n}';
            }
            if (sd instanceof qec.sdPlane) {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + '\n  return sdPlane(pos, ' + vec3.str(sd.normal) + ');'
                    + '\n}';
            }
            if (sd instanceof qec.sdGrid) {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + '\n  return sdGrid(pos, ' + vec3.str(sd.size) + ', ' + sd.thickness + ');'
                    + '\n}';
            }
            if (sd instanceof qec.sdBorder) {
                var childHsd = expl.getHsd(sd.sd);
                var concat = '\n  float d = ' + this.getDistCall(childHsd.index, isDist2) + ';';
                concat += '\n  return opBorder(d, ' + sd.borderIn + ');';
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + concat
                    + '\n}';
            }
            if (sd instanceof qec.sdUnion) {
                var array = sd.array;
                var concat = '  float d=666.0;\n';
                for (var j = 0; j < array.length; ++j) {
                    var childHsd = expl.getHsd(array[j]);
                    concat += '  d = opU(d, ' + this.getDistCall(childHsd.index, isDist2) + ');\n';
                }
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + '\n' + concat
                    + '  return d;'
                    + '\n}';
            }
            if (sd instanceof qec.sdSubtraction) {
                var array = sd.array;
                var concat = '  float d=666.0;\n';
                var childHsd0 = expl.getHsd(array[0]);
                var childHsd1 = expl.getHsd(array[1]);
                concat += '  d = opS(' + +this.getDistCall(childHsd0.index, isDist2) + ',' + +this.getDistCall(childHsd1.index, isDist2) + ');\n';
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + '\n' + concat
                    + '  return d;'
                    + '\n}';
            }
            if (sd instanceof qec.sdIntersection) {
                var array = sd.array;
                var concat = '  float d=-666.0;\n';
                for (var j = 0; j < array.length; ++j) {
                    var childHsd = expl.getHsd(array[j]);
                    concat += '  d = opI(d, ' + +this.getDistCall(childHsd.index, isDist2) + ');\n';
                }
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                    + '\n' + concat
                    + '  return d;'
                    + '\n}';
            }
            return '';
        };
        hardwareShaderText.prototype.getDistSignature = function (index, isDist2) {
            if (!isDist2)
                return 'float getDist_' + index + '(vec3 pos)';
            else
                return 'float getDist2_' + index + '(vec3 pos, vec3 rd)';
        };
        hardwareShaderText.prototype.getDistCall = function (index, isDist2) {
            if (!isDist2)
                return 'getDist_' + index + '(pos)';
            else
                return 'getDist2_' + index + '(pos, rd)';
        };
        hardwareShaderText.prototype.generateColor = function (expl) {
            console.log('generateColor');
            var shader = '';
            var hsdArray = expl.array;
            shader += '\n\nuniform vec3 u_diffuses[' + hsdArray.length + '];\n\n';
            for (var i = hsdArray.length - 1; i >= 0; --i) {
                shader += 'vec3 getColor_' + i + '(vec3 pos);\n';
            }
            shader += '\n';
            for (var i = hsdArray.length - 1; i >= 0; --i) {
                shader += this.generateOneColor(expl, hsdArray[i]);
                shader += '\n\n';
            }
            shader +=
                'vec3 getColor(vec3 pos) { return getColor_0(pos); }\n';
            return shader;
        };
        hardwareShaderText.prototype.generateOneColor = function (expl, hsd) {
            var sd = hsd.sd;
            var fakePos = vec3.create();
            if (sd instanceof qec.sdUnion) {
                var array = sd.array;
                var concat = '  float d=666.0;\n  float d2;  vec3 color;\n';
                for (var j = 0; j < array.length; ++j) {
                    var childHsd = expl.getHsd(array[j]);
                    concat += '  d2 = getDist_' + childHsd.index + '(pos);\n'
                        + '  if (d2 < d) { d = d2; color = getColor_' + childHsd.index + '(pos);}\n';
                }
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                    + '\n' + concat
                    + '  return color;'
                    + '\n}';
            }
            else if (sd instanceof qec.sdSubtraction) {
                var array = sd.array;
                var concat = '  float d=666.0;\n  float d2;  vec3 color;\n';
                var childHsd = expl.getHsd(array[0]);
                concat += '  d2 = getDist_' + childHsd.index + '(pos);\n'
                    + '  if (d2 < d) { d = d2; color = getColor_' + childHsd.index + '(pos);}\n';
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                    + '\n' + concat
                    + '  return color;'
                    + '\n}';
            }
            else if (sd instanceof qec.sdIntersection) {
                var childHsd = expl.getHsd(sd.array[0]);
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                    + '\n' + 'return getColor_' + childHsd.index + '(pos);'
                    //+'  return color;'
                    + '\n}';
            }
            else if (sd instanceof qec.sdBorder) {
                var childHsd = expl.getHsd(sd.sd);
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                    + '\n' + 'return getColor_' + childHsd.index + '(pos);'
                    //+'  return color;'
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
    var hardwareSignedDistance = /** @class */ (function () {
        function hardwareSignedDistance() {
            this.sdFieldIndex = -1;
        }
        return hardwareSignedDistance;
    }());
    qec.hardwareSignedDistance = hardwareSignedDistance;
    var hardwareSignedDistanceExplorer = /** @class */ (function () {
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
            // stop if (signedDistance already explored)
            if (this.getHsd(sd) != null)
                return;
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
            else if (sd instanceof qec.sdSubtraction) {
                for (var i = 0; i < sd.array.length; ++i)
                    this.exploreRec(sd.array[i]);
            }
            else if (sd instanceof qec.sdIntersection) {
                for (var i = 0; i < sd.array.length; ++i)
                    this.exploreRec(sd.array[i]);
            }
            else if (sd instanceof qec.sdBorder) {
                this.exploreRec(sd.sd);
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
    var parallelRenderer = /** @class */ (function () {
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
    var renderClient = /** @class */ (function () {
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
    var renderCollide = /** @class */ (function () {
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
    var renderPixel = /** @class */ (function () {
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
                if (dt < this.EPS_INTERSECT) // stop if intersect object
                    return 0.0;
                //shadow = Math.min(shadow, this.SS_K*(dt/t));
                t += dt;
                if (t > lightDist) // stop if reach light
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
    var renderPixelStepCount = /** @class */ (function () {
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
    var renderUnit = /** @class */ (function () {
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
    var renderWorkerInitMessage = /** @class */ (function () {
        function renderWorkerInitMessage() {
            this.type = 'init';
        }
        return renderWorkerInitMessage;
    }());
    qec.renderWorkerInitMessage = renderWorkerInitMessage;
    var renderWorkerInitDTOMessage = /** @class */ (function () {
        function renderWorkerInitDTOMessage() {
            this.type = 'initDTO';
        }
        return renderWorkerInitDTOMessage;
    }());
    qec.renderWorkerInitDTOMessage = renderWorkerInitDTOMessage;
    var renderWorkerInitDoneMessage = /** @class */ (function () {
        function renderWorkerInitDoneMessage() {
            this.type = 'initDone';
        }
        renderWorkerInitDoneMessage.staticType = 'initDone';
        return renderWorkerInitDoneMessage;
    }());
    qec.renderWorkerInitDoneMessage = renderWorkerInitDoneMessage;
    var renderWorkerPrepareRenderMessage = /** @class */ (function () {
        function renderWorkerPrepareRenderMessage() {
            this.type = 'prepareRender';
        }
        renderWorkerPrepareRenderMessage.staticType = 'prepareRender';
        return renderWorkerPrepareRenderMessage;
    }());
    qec.renderWorkerPrepareRenderMessage = renderWorkerPrepareRenderMessage;
    var renderWorkerPrepareRenderDoneMessage = /** @class */ (function () {
        function renderWorkerPrepareRenderDoneMessage() {
            this.type = 'prepareRenderDone';
        }
        renderWorkerPrepareRenderDoneMessage.staticType = 'prepareRenderDone';
        return renderWorkerPrepareRenderDoneMessage;
    }());
    qec.renderWorkerPrepareRenderDoneMessage = renderWorkerPrepareRenderDoneMessage;
    var renderWorkerRenderMessage = /** @class */ (function () {
        function renderWorkerRenderMessage() {
            this.type = 'render';
        }
        renderWorkerRenderMessage.staticType = 'render';
        return renderWorkerRenderMessage;
    }());
    qec.renderWorkerRenderMessage = renderWorkerRenderMessage;
    var renderWorkerRenderDoneMessage = /** @class */ (function () {
        function renderWorkerRenderDoneMessage() {
            this.type = 'renderDone';
        }
        renderWorkerRenderDoneMessage.staticType = 'renderDone';
        return renderWorkerRenderDoneMessage;
    }());
    qec.renderWorkerRenderDoneMessage = renderWorkerRenderDoneMessage;
    var renderWorker = /** @class */ (function () {
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
            //this.sd.init(_topTexture, message.topBounds, _profileTexture, message.profileBounds);
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
    var simpleRenderer = /** @class */ (function () {
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
        simpleRenderer.prototype.getViewportWidth = function () {
            return this.canvas.width;
        };
        simpleRenderer.prototype.getViewportHeight = function () {
            return this.canvas.height;
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
        simpleRenderer.prototype.updateAllPackedTextures = function (packer) { };
        return simpleRenderer;
    }());
    qec.simpleRenderer = simpleRenderer;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var material = /** @class */ (function () {
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
    var Ray = /** @class */ (function () {
        function Ray() {
            this.origin = vec3.create();
            this.direction = vec3.create();
            this.inv_direction = vec3.create();
        }
        return Ray;
    }());
    qec.Ray = Ray;
    ;
    function makeRay(ray, origin, direction) {
        vec3.copy(ray.origin, origin);
        vec3.copy(ray.direction, direction);
        for (var i = 0; i < 3; ++i)
            ray.inv_direction[i] = 1.0 / direction[i];
        ray.sign0 = (ray.inv_direction[0] < 0.0) ? 1 : 0;
        ray.sign1 = (ray.inv_direction[1] < 0.0) ? 1 : 0;
        ray.sign2 = (ray.inv_direction[2] < 0.0) ? 1 : 0;
        return ray;
    }
    qec.makeRay = makeRay;
    var raybox = /** @class */ (function () {
        function raybox() {
        }
        raybox.intersection = function (ray, aabb, debug) {
            var tx1 = (aabb[0][0] - ray.origin[0]) * ray.inv_direction[0];
            var tx2 = (aabb[1][0] - ray.origin[0]) * ray.inv_direction[0];
            var tmin = Math.min(tx1, tx2);
            var tmax = Math.max(tx1, tx2);
            var ty1 = (aabb[0][1] - ray.origin[1]) * ray.inv_direction[1];
            var ty2 = (aabb[1][1] - ray.origin[1]) * ray.inv_direction[1];
            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));
            var tz1 = (aabb[0][2] - ray.origin[2]) * ray.inv_direction[2];
            var tz2 = (aabb[1][2] - ray.origin[2]) * ray.inv_direction[2];
            tmin = Math.max(tmin, Math.min(tz1, tz2));
            tmax = Math.min(tmax, Math.max(tz1, tz2));
            if (debug)
                console.log('hop', tmin, tmax);
            if (tmin > tmax)
                return 10000;
            else
                return tmin;
            //return tmax >= tmin;
        };
        raybox.intersection_test0 = function (ray, aabb, debug) {
            var txmin = (aabb[ray.sign0][0] - ray.origin[0]) * ray.inv_direction[0];
            var txmax = (aabb[1 - ray.sign0][0] - ray.origin[0]) * ray.inv_direction[0];
            var tymin = (aabb[ray.sign1][1] - ray.origin[1]) * ray.inv_direction[1];
            var tymax = (aabb[1 - ray.sign1][1] - ray.origin[1]) * ray.inv_direction[1];
            var tzmin = (aabb[ray.sign2][2] - ray.origin[2]) * ray.inv_direction[2];
            var tzmax = (aabb[1 - ray.sign2][2] - ray.origin[2]) * ray.inv_direction[2];
            var tmin = Math.max(Math.max(txmin, tymin), tzmin);
            var tmax = Math.min(Math.min(txmax, tymax), tzmax);
            if (debug)
                console.log(tmin, tmax);
            if (tmin > tmax)
                return 10000;
            else
                return tmin;
            // post condition:
            // if tmin > tmax (in the code above this is represented by a return value of INFINITY)
            //     no intersection
            // else
            //     front intersection point = ray.origin + ray.direction * tmin (normally only this point matters)
            //     back intersection point  = ray.origin + ray.direction * tmax
        };
        raybox.inbox = function (aabb, ro, m) {
            return ro[0] > (aabb[0][0] + m) && ro[0] < (aabb[1][0] + m)
                && ro[1] > (aabb[0][1] + m) && ro[1] < (aabb[1][1] + m)
                && ro[2] > (aabb[0][2] + m) && ro[2] < (aabb[1][2] + m);
        };
        return raybox;
    }());
    qec.raybox = raybox;
})(qec || (qec = {}));
var qec;
(function (qec) {
    //https://tavianator.com/fast-branchless-raybounding-box-intersections/
    var raybox_old = /** @class */ (function () {
        function raybox_old() {
        }
        raybox_old.intersection = function (b, ro, rd, debug) {
            var tmin = -10000; //-INFINITY;
            var tmax = 10000; //INFINITY;
            for (var i = 0; i < 3; ++i)
                if (rd[i] != 0.0) {
                    var t1 = (-b[i] - ro[i]) / rd[i]; /*-b[0] = b.min.x*/
                    var t2 = (b[i] - ro[i]) / rd[i]; /* b[0] = b.max.x*/
                    tmin = Math.max(tmin, Math.min(t1, t2));
                    tmax = Math.min(tmax, Math.max(t1, t2));
                    //if (debug) console.log('rayboxintersection '+i+' '+ tmin + ' ' + tmax);
                }
            if (debug)
                console.log('rayboxintersection ' + 'tmin=' + tmin + 'tmax=' + tmax, 'box', b, 'ro', ro, 'rd', rd);
            if (tmax <= tmin)
                return 10000;
            return tmin;
        };
        raybox_old.inbox = function (b, ro, m) {
            return ro[0] > -(b[0] + m) && ro[0] < (b[0] + m)
                && ro[1] > -(b[1] + m) && ro[1] < (b[1] + m)
                && ro[2] > -(b[2] + m) && ro[2] < (b[2] + m);
        };
        return raybox_old;
    }());
    qec.raybox_old = raybox_old;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var scImageDTO = /** @class */ (function () {
        function scImageDTO() {
        }
        return scImageDTO;
    }());
    qec.scImageDTO = scImageDTO;
    var scImage = /** @class */ (function () {
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
    var scRendererDTO = /** @class */ (function () {
        function scRendererDTO() {
        }
        return scRendererDTO;
    }());
    qec.scRendererDTO = scRendererDTO;
    var scRenderer = /** @class */ (function () {
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
    var scene = /** @class */ (function () {
        function scene() {
            this.sceneBase = new qec.sceneBase();
            var s = this.sceneBase;
            s.register('cameraDTO', qec.camera);
            s.register('pointLightDTO', qec.pointLight);
            s.register('directionalLightDTO', qec.directionalLight);
            s.register('spotLightDTO', qec.spotLight);
            s.register('scRendererDTO', qec.scRenderer);
            s.register('sdBorderDTO', qec.sdBorder);
            s.register('sdBoxDTO', qec.sdBox);
            s.register('sdFieldsDTO', qec.sdFields);
            s.register('sdGridDTO', qec.sdGrid);
            s.register('sdGrid2DTO', qec.sdGrid2);
            s.register('sdIntersectionDTO', qec.sdIntersection);
            s.register('sdPlaneDTO', qec.sdPlane);
            s.register('sdRepeatDTO', qec.sdRepeat);
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
    var sceneBase = /** @class */ (function () {
        function sceneBase() {
            this.debugInfo = false;
            this.creators = [];
        }
        sceneBase.prototype.register = function (type, canCreate) {
            var c = {
                predicate: function (o) { return o.type == type; },
                instantiate: function (dto) { var n = new canCreate(); n.createFrom(dto); return n; }
            };
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
                //if (this.debugInfo) console.log('OK' , instance);
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
    var creator = /** @class */ (function () {
        function creator() {
        }
        return creator;
    }());
    qec.creator = creator;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdBorderDTO = /** @class */ (function () {
        function sdBorderDTO() {
        }
        return sdBorderDTO;
    }());
    qec.sdBorderDTO = sdBorderDTO;
    var sdBorder = /** @class */ (function () {
        function sdBorder() {
        }
        sdBorder.prototype.createFrom = function (dto) {
            this.sd = (dto.sd['__instance']);
            this.borderIn = dto.borderIn;
            this.borderOut = dto.borderOut;
        };
        sdBorder.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            return 1000;
            /*
            var d = this.array[0].getDist(pos, boundingBox, debug);
            var l = this.array.length;
            for (var i=1; i < l; ++i)
            {
                d = Math.max(d, -this.array[i].getDist2(pos, rd, boundingBox, debug));
            }
            //var d = Math.max(-this.array[0].getDist(pos, debug), this.array[1].getDist(pos, debug));
            return d;
            */
        };
        sdBorder.prototype.getDist = function (pos, boundingBox, debug) {
            var d = this.sd.getDist(pos, boundingBox, debug);
            if (d < 0) //d < -this.borderIn)
             {
                return -d - this.borderIn;
            }
            else //if (d > this.borderOut)
             {
                return d - this.borderOut;
            }
            //return d - this.borderOut;
        };
        sdBorder.prototype.getMaterial = function (pos) {
            return this.sd.getMaterial(pos);
        };
        sdBorder.prototype.getInverseTransform = function (out) {
            mat4.identity(out);
        };
        sdBorder.prototype.getBoundingBox = function (out) {
            vec3.set(out, 100, 100, 100);
        };
        return sdBorder;
    }());
    qec.sdBorder = sdBorder;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdBoxDTO = /** @class */ (function () {
        function sdBoxDTO() {
            this.type = 'sdBoxDTO';
        }
        return sdBoxDTO;
    }());
    qec.sdBoxDTO = sdBoxDTO;
    var sdBox = /** @class */ (function () {
        function sdBox() {
            this.halfSize = vec3.create();
            this.tmp = vec3.create();
            this.tmpPos = vec3.create();
            this.material = new qec.material();
            this.inverseTransform = mat4.create();
            this.transformedRay = new qec.Ray();
            this.transformedRd = vec3.create();
            this.aabb = [vec3.create(), vec3.create()];
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
            // create a ray, from transformed position, and transformed direction
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            vec3TransformMat4RotOnly(this.transformedRd, rd, this.inverseTransform);
            qec.makeRay(this.transformedRay, this.tmp, this.transformedRd);
            var t = qec.raybox.intersection(this.transformedRay, this.aabb, debug);
            if (debug)
                console.log('tttt ' + t);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            return t;
        };
        sdBox.prototype.getBoundingBox = function (out) {
            vec3.scale(out[0], this.halfSize, -1);
            vec3.scale(out[1], this.halfSize, 1);
        };
        sdBox.prototype.getDist = function (pos, boundingBox, debug) {
            vec3.transformMat4(this.tmpPos, pos, this.inverseTransform);
            //vec3 d = abs(p) - b;
            //return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
            var dx = Math.abs(this.tmpPos[0]) - this.halfSize[0];
            var dy = Math.abs(this.tmpPos[1]) - this.halfSize[1];
            var dz = Math.abs(this.tmpPos[2]) - this.halfSize[2];
            var mc = Math.max(dx, dy, dz);
            var t = this.tmp;
            t[0] = Math.max(dx, 0);
            t[1] = Math.max(dy, 0);
            t[2] = Math.max(dz, 0);
            return Math.min(mc, 0) + vec3.length(t);
        };
        sdBox.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdBox.prototype.getInverseTransform = function (out) {
            mat4.copy(out, this.inverseTransform);
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
    var sdFieldsDTO = /** @class */ (function () {
        function sdFieldsDTO() {
        }
        return sdFieldsDTO;
    }());
    qec.sdFieldsDTO = sdFieldsDTO;
    var sdFields = /** @class */ (function () {
        function sdFields() {
            this.topDfCanvas = new qec.distanceFieldCanvas();
            this.profileDfCanvas = new qec.distanceFieldCanvas();
            this.material = new qec.material();
            this.inverseTransform = mat4.identity(mat4.create());
            this.tmp = vec3.create();
            this.transformedRay = new qec.Ray();
            this.transformedRd = vec3.create();
            this.aabb = [vec3.create(), vec3.create()];
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
            this.init(this.topDfCanvas.floatTexture, vec4.fromValues(0, 0, 1, 1), new Float32Array(this.topDfCanvas.totalBounds), this.profileDfCanvas.floatTexture, vec4.fromValues(0, 0, 1, 1), new Float32Array(this.profileDfCanvas.totalBounds));
            this.material.createFrom(dto.material);
            this.inverseTransform = mat4.invert(this.inverseTransform, dto.transform);
        };
        sdFields.prototype.init = function (topTexture, topSpriteBounds, topBounds, profileTexture, profileSpriteBounds, profileBounds) {
            this.topTexture = topTexture;
            this.topBounds = new Float32Array(topBounds);
            this.topSpriteBounds = new Float32Array(topSpriteBounds);
            this.profileTexture = profileTexture;
            this.profileBounds = new Float32Array(profileBounds);
            this.profileSpriteBounds = new Float32Array(profileSpriteBounds);
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
            vec3.set(out[0], sx, sy, this.profileBounds[1]);
            vec3.set(out[1], -sx, -sy, this.profileBounds[3]);
        };
        sdFields.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.dist2Pos, pos, this.inverseTransform);
            vec3TransformMat4RotOnly(this.transformedRd, rd, this.inverseTransform);
            qec.makeRay(this.transformedRay, this.dist2Pos, this.transformedRd);
            var t = qec.raybox.intersection(this.transformedRay, this.aabb, debug);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, false);
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
            var d = this.getFieldDistanceWithSprite(this.topTexture, u, v, this.topSpriteBounds);
            var u2 = (d - this.profileBounds[0]) / (this.profileBounds[2] - this.profileBounds[0]);
            var v2 = (p[2] - this.profileBounds[1]) / (this.profileBounds[3] - this.profileBounds[1]);
            var d2 = this.getFieldDistanceWithSprite(this.profileTexture, u2, v2, this.profileSpriteBounds);
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
                //console.log('uv : ' , u, v);
                //console.log(this.color[0].toFixed(2) ,' at xy : [' +  (u * (field.width-1)).toFixed(1) + ',' + (v * (field.height-1)).toFixed(1));
            }
            return this.color[0];
        };
        sdFields.prototype.getFieldDistanceWithSprite = function (field, u, v, spriteBounds) {
            u = Math.min(Math.max(u, 0), 1);
            v = Math.min(Math.max(v, 0), 1);
            var u2 = mix(spriteBounds[0], spriteBounds[2], u);
            var v2 = mix(spriteBounds[1], spriteBounds[3], v);
            return this.getFieldDistance(field, u2, v2);
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
    var sdFillSphere = /** @class */ (function () {
        function sdFillSphere() {
            this.material = new qec.material();
            this.radius = 1;
            this.inverseTransform = mat4.create();
            this.tmp = vec3.create();
            this.transformedRd = vec3.create();
            this.aabb = vec3.create();
        }
        sdFillSphere.prototype.createFrom = function (dto) {
            this.material.createFrom(dto.material);
            this.radius = dto.radius;
            var transform = dto.transform;
            if (!transform)
                mat4.identity(this.inverseTransform);
            else
                mat4.invert(this.inverseTransform, new Float32Array(transform));
        };
        sdFillSphere.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            return 1000;
            /*
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            vec3.transformMat4(this.transformedRd, rd, this.inverseTransform);
            
            if (raybox.inbox(this.aabb, this.tmp, 0))
                return this.getDist(pos, boundingBox, debug);

            var t = raybox.intersection(this.aabb, this.tmp, rd, debug);
            if (t <= 0.01)
                return this.getDist(pos, boundingBox, debug);
            
            return t;
            */
        };
        sdFillSphere.prototype.getDist = function (pos, boundingBox, debug) {
            return vec3.length(this.tmp) - this.radius;
        };
        sdFillSphere.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdFillSphere.prototype.getInverseTransform = function (out) {
            mat4.copy(out, this.inverseTransform);
        };
        sdFillSphere.prototype.getBoundingBox = function (out) {
            vec3.set(out, this.radius, this.radius, this.radius);
        };
        return sdFillSphere;
    }());
    qec.sdFillSphere = sdFillSphere;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdGridDTO = /** @class */ (function () {
        function sdGridDTO() {
            this.type = 'sdGridDTO';
        }
        return sdGridDTO;
    }());
    qec.sdGridDTO = sdGridDTO;
    var sdGrid = /** @class */ (function () {
        function sdGrid() {
            this.material = new qec.material();
            this.size = vec3.create();
            this.d = vec3.create();
            this.mod = vec3.create();
        }
        sdGrid.prototype.createFrom = function (dto) {
            vec3.set(this.size, dto.size, dto.size, dto.size);
            this.thickness = dto.thickness;
            this.material.createFrom(dto.material);
        };
        sdGrid.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            return 1000;
        };
        sdGrid.prototype.getDist = function (pos, boundingBox, debug) {
            for (var i = 0; i < 3; ++i) {
                this.d[i] = 0.5 * this.size[i] - Math.abs(fmod(pos[i], this.size[i]) - 0.5 * this.size[i]);
            }
            var dMin = Math.min(this.d[0], this.d[1], this.d[2]);
            return dMin - this.thickness;
        };
        sdGrid.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdGrid.prototype.getInverseTransform = function (out) {
            mat4.identity(out);
        };
        sdGrid.prototype.getBoundingBox = function (out) {
            vec3.set(out, 100, 100, 100);
        };
        return sdGrid;
    }());
    qec.sdGrid = sdGrid;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdGrid2DTO = /** @class */ (function () {
        function sdGrid2DTO() {
            this.type = 'sdGrid2DTO';
        }
        return sdGrid2DTO;
    }());
    qec.sdGrid2DTO = sdGrid2DTO;
    var sdGrid2 = /** @class */ (function () {
        function sdGrid2() {
            this.material = new qec.material();
            this.d = vec3.create();
            this.mod = vec3.create();
        }
        sdGrid2.prototype.createFrom = function (dto) {
            this.size = dto.size;
            this.thickness = dto.thickness;
            this.material.createFrom(dto.material);
        };
        sdGrid2.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            return 1000;
        };
        sdGrid2.prototype.sqrLen = function (x, y) {
            return x * x + y * y;
        };
        sdGrid2.prototype.getDist = function (pos, boundingBox, debug) {
            // abs modulo
            for (var i = 0; i < 3; ++i) {
                this.mod[i] = Math.abs(fmod(pos[i], this.size) - 0.5 * this.size);
            }
            var s0 = this.sqrLen(this.mod[1], this.mod[2]);
            var s1 = this.sqrLen(this.mod[0], this.mod[2]);
            var s2 = this.sqrLen(this.mod[0], this.mod[1]);
            var dMin = Math.sqrt(Math.min(s0, s1, s2));
            return dMin - this.thickness;
        };
        sdGrid2.prototype.getMaterial = function (pos) {
            return this.material;
        };
        sdGrid2.prototype.getInverseTransform = function (out) {
            mat4.identity(out);
        };
        sdGrid2.prototype.getBoundingBox = function (out) {
            vec3.set(out, 100, 100, 100);
        };
        return sdGrid2;
    }());
    qec.sdGrid2 = sdGrid2;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdIntersectionDTO = /** @class */ (function () {
        function sdIntersectionDTO() {
        }
        return sdIntersectionDTO;
    }());
    qec.sdIntersectionDTO = sdIntersectionDTO;
    var sdIntersection = /** @class */ (function () {
        function sdIntersection() {
            this.array = [];
        }
        sdIntersection.prototype.createFrom = function (dto) {
            this.array[0] = (dto.a['__instance']);
            this.array[1] = (dto.b['__instance']);
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
            if (minMat == null)
                return new qec.material();
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
    var sdPlaneDTO = /** @class */ (function () {
        function sdPlaneDTO() {
            this.type = 'sdPlaneDTO';
        }
        return sdPlaneDTO;
    }());
    qec.sdPlaneDTO = sdPlaneDTO;
    var sdPlane = /** @class */ (function () {
        function sdPlane() {
            this.material = new qec.material();
            this.normal = vec3.set(vec3.create(), 0, 0, 1);
            this.tmp = vec3.create();
            this.transformedRay = new qec.Ray();
            this.transformedRd = vec3.create();
            this.aabb = [vec3.create(), vec3.create()];
        }
        sdPlane.prototype.createFrom = function (dto) {
            vec3FromArray(this.normal, dto.normal);
            vec3.normalize(this.normal, this.normal);
            this.material.createFrom(dto.material);
        };
        sdPlane.prototype.getBoundingBox = function (out) {
            vec3.set(out[0], -1000, -1000, -0.001);
            vec3.set(out[1], 1000, 1000, 0.001);
        };
        sdPlane.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            this.getBoundingBox(this.aabb);
            qec.makeRay(this.transformedRay, pos, rd);
            /*
                        if (raybox.inbox(this.aabb, pos, 0))
                            return this.getDist(pos, boundingBox, debug);
            */
            var t = qec.raybox.intersection(this.transformedRay, this.aabb, debug);
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
        return sdPlane;
    }());
    qec.sdPlane = sdPlane;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdRepeatDTO = /** @class */ (function () {
        function sdRepeatDTO() {
        }
        return sdRepeatDTO;
    }());
    qec.sdRepeatDTO = sdRepeatDTO;
    var sdRepeat = /** @class */ (function () {
        function sdRepeat() {
            this.box = vec3.create();
            this.q = vec3.create();
        }
        sdRepeat.prototype.createFrom = function (dto) {
            this.sd = (dto.sd['__instance']);
            vec3FromArray(this.box, dto.box);
        };
        sdRepeat.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            return 1000;
            /*
            var d = 66666;
            var l = this.array.length;
            for (var i=0; i < l; ++i)
                d = Math.max(d, this.array[i].getDist2(pos, rd, boundingBox, debug));

            return d;
            */
        };
        sdRepeat.prototype.getDist = function (pos, boundingBox, debug) {
            for (var i = 0; i < 3; ++i) {
                this.q[i] = fmod(pos[i], this.box[i]) - 0.5 * this.box[i];
            }
            return this.sd.getDist(this.q, boundingBox, debug);
        };
        sdRepeat.prototype.getMaterial = function (pos) {
            return this.sd.getMaterial(pos);
        };
        sdRepeat.prototype.getInverseTransform = function (out) {
            mat4.identity(out);
        };
        sdRepeat.prototype.getBoundingBox = function (out) {
            vec3.set(out, 100, 100, 100);
        };
        return sdRepeat;
    }());
    qec.sdRepeat = sdRepeat;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdSphere = /** @class */ (function () {
        function sdSphere() {
            this.material = new qec.material();
            this.radius = 1;
            this.inverseTransform = mat4.create();
            this.tmp = vec3.create();
            this.transformedRay = new qec.Ray();
            this.transformedRd = vec3.create();
            this.aabb = [vec3.create(), vec3.create()];
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
        sdSphere.prototype.getBoundingBox = function (out) {
            vec3.set(out[0], -this.radius, -this.radius, -this.radius);
            vec3.set(out[1], this.radius, this.radius, this.radius);
        };
        sdSphere.prototype.getDist2 = function (pos, rd, boundingBox, debug) {
            this.getBoundingBox(this.aabb);
            vec3.transformMat4(this.tmp, pos, this.inverseTransform);
            vec3TransformMat4RotOnly(this.transformedRd, rd, this.inverseTransform);
            qec.makeRay(this.transformedRay, this.tmp, this.transformedRd);
            /*
            if (raybox.inbox(this.aabb, this.tmp, 0))
                return this.getDist(this.tmp, boundingBox, debug);
            */
            var t = qec.raybox.intersection(this.transformedRay, this.aabb, debug);
            if (debug) {
                console.log(vec3.str(this.transformedRay.origin));
                console.log(vec3.str(this.transformedRay.direction));
                console.log('tttt ' + t);
            }
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
        return sdSphere;
    }());
    qec.sdSphere = sdSphere;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var sdSubtractionDTO = /** @class */ (function () {
        function sdSubtractionDTO() {
        }
        return sdSubtractionDTO;
    }());
    qec.sdSubtractionDTO = sdSubtractionDTO;
    var sdSubtraction = /** @class */ (function () {
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
    var sdUnionDTO = /** @class */ (function () {
        function sdUnionDTO() {
        }
        return sdUnionDTO;
    }());
    qec.sdUnionDTO = sdUnionDTO;
    var sdUnion = /** @class */ (function () {
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
            if (minMat == null)
                return new qec.material();
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
    var exBox = /** @class */ (function () {
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
    var exBoxAndShadow = /** @class */ (function () {
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
                halfSize: [0.3, 0.3, 0.4],
                //transform: [0, 0, 0.4],
                material: {
                    type: 'materialDTO',
                    diffuse: [1, 0, 0]
                },
                transform: mat4Translate(0, 0, 0.45)
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
    var exFieldsCube = /** @class */ (function () {
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
    var exFieldsCubeProfileBounds = /** @class */ (function () {
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
    var exFieldsFont = /** @class */ (function () {
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
    var exFieldsWithTransform = /** @class */ (function () {
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
    qec.pushExample("Grid", function () { return new exGrid(); });
    var exGrid = /** @class */ (function () {
        function exGrid() {
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
            this.grid = {
                type: 'sdGridDTO',
                size: 0.33,
                thickness: 0.001,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.6,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Identity()
            };
            this.intersection = {
                type: 'sdIntersectionDTO',
                a: this.sphere,
                b: this.grid
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.intersection,
                camera: this.camera,
            };
        }
        return exGrid;
    }());
    qec.exGrid = exGrid;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Grid2", function () { return new exGrid2(); });
    var exGrid2 = /** @class */ (function () {
        function exGrid2() {
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
            this.grid = {
                type: 'sdGrid2DTO',
                size: 0.33,
                thickness: 0.001,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.6,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Identity()
            };
            this.intersection = {
                type: 'sdIntersectionDTO',
                a: this.sphere,
                b: this.grid
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.intersection,
                camera: this.camera,
            };
        }
        return exGrid2;
    }());
    qec.exGrid2 = exGrid2;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("GridWithBorder", function () { return new exGridWithBorder(); });
    var exGridWithBorder = /** @class */ (function () {
        function exGridWithBorder() {
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
            this.grid = {
                type: 'sdGridDTO',
                size: 0.33,
                thickness: 0.01,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
            };
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.6,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Identity()
            };
            /*
            box: sdBoxDTO = {
                type: 'sdBoxDTO',
                halfSize:[0.6,0.6,0.6],
                material : {
                    type:'materialDTO',
                    diffuse : [0, 1, 0]
                },
                transform : mat4Identity()
            };*/
            this.border1 = {
                type: 'sdBorderDTO',
                sd: this.sphere,
                borderIn: 0.0,
                borderOut: 0
            };
            this.intersection = {
                type: 'sdIntersectionDTO',
                a: this.border1,
                b: this.grid
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.intersection,
                camera: this.camera,
            };
        }
        return exGridWithBorder;
    }());
    qec.exGridWithBorder = exGridWithBorder;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Intersection", function () { return new exIntersection(); });
    var exIntersection = /** @class */ (function () {
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
    qec.pushExample("IntersectionWithBorder", function () { return new exIntersectionWithBorder(); });
    var exIntersectionWithBorder = /** @class */ (function () {
        function exIntersectionWithBorder() {
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
            this.borderSphere = {
                type: 'sdBorderDTO',
                sd: this.sphere,
                borderIn: 0.05,
                borderOut: 0.0
            };
            this.intersection = {
                type: 'sdIntersectionDTO',
                a: this.ground,
                b: this.borderSphere
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.intersection,
                camera: this.camera,
            };
        }
        return exIntersectionWithBorder;
    }());
    qec.exIntersectionWithBorder = exIntersectionWithBorder;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Lighting1", function () { return new exLighting1(); });
    var exLighting1 = /** @class */ (function () {
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
    var exOwl = /** @class */ (function () {
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
    var exPlane = /** @class */ (function () {
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
    qec.pushExample("Repeat", function () { return new exRepeat(); });
    var exRepeat = /** @class */ (function () {
        function exRepeat() {
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
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.05,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 0, 1]
                }
            };
            this.repeat = {
                type: 'sdRepeatDTO',
                sd: this.sphere,
                box: [0.3, 0.3, 0.3]
            };
            this.box = {
                type: 'sdBoxDTO',
                halfSize: [0.6, 0.6, 0.6],
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Identity()
            };
            this.intersection = {
                type: 'sdIntersectionDTO',
                a: this.box,
                b: this.repeat
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.intersection,
                camera: this.camera,
            };
        }
        return exRepeat;
    }());
    qec.exRepeat = exRepeat;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Repeat2", function () { return new exRepeat2(); });
    var exRepeat2 = /** @class */ (function () {
        function exRepeat2() {
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
            this.sphere = {
                type: 'sdSphereDTO',
                radius: 0.2,
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 0, 1]
                }
            };
            this.borderSphere = {
                type: 'sdBorderDTO',
                sd: this.sphere,
                borderIn: 0.02,
                borderOut: 0.0
            };
            this.repeat = {
                type: 'sdRepeatDTO',
                sd: this.borderSphere,
                box: [0.4, 0.4, 0.4]
            };
            this.box = {
                type: 'sdBoxDTO',
                halfSize: [0.6, 0.6, 0.6],
                material: {
                    type: 'materialDTO',
                    diffuse: [0, 1, 0]
                },
                transform: mat4Array(mat4.rotateZ(mat4.create(), mat4.identity(mat4.create()), Math.PI / 6))
            };
            this.borderBox = {
                type: 'sdBorderDTO',
                sd: this.box,
                borderIn: 0.02,
                borderOut: 0.0
            };
            this.intersection = {
                type: 'sdIntersectionDTO',
                a: this.borderBox,
                b: this.repeat
            };
            this.render = {
                type: 'scRendererDTO',
                spotLights: [this.light],
                directionalLights: [],
                distance: this.intersection,
                camera: this.camera,
            };
        }
        return exRepeat2;
    }());
    qec.exRepeat2 = exRepeat2;
})(qec || (qec = {}));
var qec;
(function (qec) {
    qec.pushExample("Sphere", function () { return new exSphere(); });
    var exSphere = /** @class */ (function () {
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
    var exSphereAndShadow = /** @class */ (function () {
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
    var exSubtraction = /** @class */ (function () {
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
    var exUnion = /** @class */ (function () {
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
    var sdFieldsTest = /** @class */ (function () {
        function sdFieldsTest() {
            this.testName = "";
        }
        sdFieldsTest.prototype.test = function () {
            this.distanceFieldSameSizeAsCanvas();
            console.log(this.testName + ' : OK');
            this.distanceFieldSmallerThanCanvas();
            console.log(this.testName + ' : OK');
            this.distanceFieldSameSizeAsCanvas_WithMargin();
            console.log(this.testName + ' : OK');
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
    var texturePackerTest = /** @class */ (function () {
        function texturePackerTest() {
        }
        texturePackerTest.prototype.test = function () {
            var _this = this;
            // load imgs
            qec.resources.addImg('data/512x512.png');
            qec.resources.addImg('data/font.png');
            qec.resources.loadAll2(function () { _this.test2(); });
        };
        texturePackerTest.prototype.test2 = function () {
            var packer = new qec.texturePacker();
            var allDfCanvas = [];
            for (var key in qec.resources.all) {
                var dfCanvas = new qec.distanceFieldCanvas();
                var img = qec.resources.all[key];
                dfCanvas.computeDistanceField(img, 1, img.height / img.width);
                dfCanvas.update();
                allDfCanvas.push(dfCanvas);
                //document.body.appendChild(dfCanvas.canvas);
                //dfCanvas.debugInfoInCanvas();
                //var canvas = document.createElement('canvas');
                //textureDebugInCanvas(dfCanvas.floatTexture ,0 ,128, canvas);
                //document.body.appendChild(canvas);
            }
            packer.repack(allDfCanvas.map(function (c) { return c.floatTexture; }));
            packer.debugInfoInBody(255);
        };
        return texturePackerTest;
    }());
    qec.texturePackerTest = texturePackerTest;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var bspline = /** @class */ (function () {
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
    var createdDTO = /** @class */ (function () {
        function createdDTO() {
        }
        return createdDTO;
    }());
    qec.createdDTO = createdDTO;
})(qec || (qec = {}));
function vec2FromArray(out, a) {
    for (var i = 0; i < 2; ++i)
        out[i] = a[i];
}
function vec3FromArray(out, a) {
    for (var i = 0; i < 3; ++i)
        out[i] = a[i];
}
function vec4FromArray(out, a) {
    for (var i = 0; i < 4; ++i)
        out[i] = a[i];
}
function mat4FromArray(out, a) {
    for (var i = 0; i < 16; ++i)
        out[i] = a[i];
}
function float32ArrayToArray(fta) {
    var out = [];
    for (var i = 0; i < fta.length; ++i)
        out[i] = fta[i];
    return out;
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
    var injector = /** @class */ (function () {
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
    var testA = /** @class */ (function () {
        function testA() {
            this.id = testA.idCount++;
        }
        testA.idCount = 0;
        return testA;
    }());
    var testB1 = /** @class */ (function () {
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
    var testB2 = /** @class */ (function () {
        function testB2() {
        }
        testB2.prototype.log = function () {
            return "testB2";
        };
        return testB2;
    }());
    var injector2Test = /** @class */ (function () {
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
function vec3TransformMat4RotOnly(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z /* + m[12]*/) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z /* + m[13]*/) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z /* + m[14]*/) / w;
    return out;
}
;
function float32ArrayToString(a) {
    var s = '' + a[0];
    for (var i = 1; i < a.length; ++i) {
        s += ',' + a[i];
    }
    return s;
}
function fmod(a, b) {
    var m = a % b;
    if (a < 0)
        m *= -1;
    //if (m < 0) m+=b; 
    return m;
}
function mix(x, y, a) {
    return (x * (1 - a) + y * a);
}
var qec;
(function (qec) {
    var resources = /** @class */ (function () {
        function resources() {
        }
        resources.loadAll = function (done) {
            if (resources.run == null)
                resources.run = new qec.runAll();
            resources.run.push(function (_done) { return resources.doReq('app/ts/render/hardware/10_sd.glsl', _done); });
            resources.run.push(function (_done) { return resources.doReq('app/ts/render/hardware/11_sdFields.glsl', _done); });
            resources.run.push(function (_done) { return resources.doReq('app/ts/render/hardware/20_light.glsl', _done); });
            resources.run.push(function (_done) { return resources.doReq('app/ts/render/hardware/30_renderPixel.glsl', _done); });
            //for (var i=0; i < 6; ++i)
            //    run.push(resources.loadImg('data/cubemap/cubemap' + i + '.jpg'));
            resources.run.run(function () { resources.loaded = true; done(); });
        };
        resources.addImg = function (url) {
            if (resources.run == null)
                resources.run = new qec.runAll();
            resources.run.push(resources.loadImg(url));
        };
        resources.loadAll2 = function (done) {
            resources.run.run(function () { resources.loaded = true; done(); });
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
        resources.loadImg = function (url) {
            return function (_done) {
                console.log(url);
                var img = new Image();
                img.onload = function () {
                    resources.all[url] = img;
                    _done();
                };
                img.src = url;
            };
        };
        resources.all = [];
        resources.loaded = false;
        return resources;
    }());
    qec.resources = resources;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var runAll = /** @class */ (function () {
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
    var styleAttribute = /** @class */ (function () {
        function styleAttribute() {
        }
        styleAttribute.setField = function (styleStr, key, value) {
            var parts = styleStr.split(";");
            var parts2 = [];
            var index = -1;
            for (var i = 0; i < parts.length; i++) {
                var subParts = parts[i].split(':');
                if (subParts.length == 2) {
                    parts2[i] = [subParts[0], subParts[1]];
                    if (subParts[0] == key) {
                        //console.log('style : key at ' + i);
                        index = i;
                    }
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
    var wm5DistLine3Line3 = /** @class */ (function () {
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
    var wm5Line3 = /** @class */ (function () {
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
// Inspiration :
//
// adapted from http://nehe.gamedev.net/tutorial/arcball_rotation/19003/
// http://stackoverflow.com/questions/1171849/finding-quaternion-representing-the-rotation-from-one-vector-to-another
var qec;
(function (qec) {
    var arcball = /** @class */ (function () {
        function arcball() {
            this.perp = vec3.create();
            this.tmpPt1 = vec3.create();
            this.tmpPt2 = vec3.create();
        }
        arcball.prototype.getRotationFrom2dPoints = function (viewportWidth, viewportHeight, sphereRadiusInPixels, startXY, endXY, result) {
            this.map2DToSphere(viewportWidth, viewportHeight, sphereRadiusInPixels, startXY, this.tmpPt1);
            this.map2DToSphere(viewportWidth, viewportHeight, sphereRadiusInPixels, endXY, this.tmpPt2);
            this.getRotation(this.tmpPt1, this.tmpPt2, result);
        };
        arcball.prototype.map2DToSphere = function (viewportWidth, viewportHeight, sphereRadiusInPixels, screenXY, result) {
            var dx = screenXY[0] - (viewportWidth / 2);
            var dy = (viewportHeight - screenXY[1]) - (viewportHeight / 2);
            //length of the vector to the point from the center
            var length = Math.sqrt((dx * dx) + (dy * dy));
            //If the point is mapped outside of the sphere... (length > radius squared)
            if (length > sphereRadiusInPixels) {
                //Return the point on sphere at z=0
                result[0] = dx / length * sphereRadiusInPixels;
                result[1] = dy / length * sphereRadiusInPixels;
                result[2] = 0.0;
                //console.log("not sphere");
            }
            //Else it's on the inside
            else {
                //Return a vector to a point mapped inside the sphere
                result[0] = dx;
                result[1] = dy;
                result[2] = Math.sqrt(sphereRadiusInPixels * sphereRadiusInPixels - (dx * dx + dy * dy));
                //console.log("sphere");
            }
        };
        //return quaternion equivalent to rotation between 2 3D points
        arcball.prototype.getRotation = function (startPoint, endPoint, result) {
            var perp = this.perp;
            vec3.cross(perp, startPoint, endPoint);
            //Compute the length of the perpendicular vector
            if (vec3.length(perp) > 0.00001) //if its non-zero
             {
                // http://stackoverflow.com/questions/1171849/finding-quaternion-representing-the-rotation-from-one-vector-to-another
                //
                // Quaternion q;
                // vector a = crossproduct(v1, v2)
                // q.xyz = a;
                // q.w = sqrt((v1.Length ^ 2) * (v2.Length ^ 2)) + dotproduct(v1, v2)
                result[0] = perp[0];
                result[1] = perp[1];
                result[2] = perp[2];
                result[3] = vec3.length(startPoint) * vec3.length(endPoint) + vec3.dot(startPoint, endPoint);
                quat.normalize(result, result);
            }
            else {
                //The begin and end vectors coincide, so return an identity transform
                result[0] = 0;
                result[1] = 0;
                result[2] = 0;
                result[3] = 1;
            }
        };
        return arcball;
    }());
    qec.arcball = arcball;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var cameraArcballController = /** @class */ (function () {
        function cameraArcballController() {
            this.editor = qec.inject(qec.editor);
            this.transformObjectView = qec.inject(qec.transformObjectView);
            this.arcball = new qec.arcball();
            this.cameraTransforms = qec.injectNew(qec.cameraTransforms);
            this.collide = qec.injectNew(qec.renderCollide);
            this.ro = vec3.create();
            this.rd = vec3.create();
            this.tmpVec3 = vec3.create();
            this.tmpRotation = quat.create();
            this.isPanEnabled = true;
            this.isRotateEnabled = true;
            this.isZoomEnabled = true;
            this.currentMouseXY = vec2.create();
            this.hasMouseMoved = false;
            this.startXY = vec2.create();
            this.startQuat = quat.create();
            this.startPan = mat4.create();
            this.up = vec3.create();
            this.right = vec3.create();
            this.dragQuat = quat.create();
        }
        cameraArcballController.prototype.afterInject = function () {
            this.cameraTransforms.reset();
            this.cameraTransforms.updateTransformMatrix();
        };
        cameraArcballController.prototype.setButton = function (button) {
            this.button = button;
        };
        cameraArcballController.prototype.cameraTop = function (n, x, y) {
            var mat = mat3.fromValues(x[0], y[0], n[0], x[1], y[1], n[1], x[2], y[2], n[2]);
            this.cameraTransforms.setRotation(mat);
        };
        cameraArcballController.prototype.set = function () {
        };
        cameraArcballController.prototype.unset = function () {
        };
        //
        //  Mouse Interactions
        //
        cameraArcballController.prototype.onMouseWheel = function (e) {
            if (this.isZoomEnabled) {
                this.hasMouseMoved = true;
                var orig = e.originalEvent;
                var d = Math.max(-1, Math.min(1, (orig.deltaY)));
                //console.log('mousewheel', orig.deltaY);
                this.cameraTransforms.zoom(d, 1.1);
                this.cameraTransforms.updateCamera(this.editor.getCamera());
                this.editor.setRenderFlag();
                this.transformObjectView.draw();
            }
        };
        cameraArcballController.prototype.setDisabledAll = function (b) {
            this.isPanEnabled = !b;
            this.isRotateEnabled = !b;
            this.isZoomEnabled = !b;
        };
        cameraArcballController.prototype.onMouseDown = function (e) {
            this.isRightClick = (e.which == 3);
            console.log('rightclick :' + this.isRightClick);
            this.isLeftClick = (e.which == 1);
            this.isMiddleClick = (e.which == 2);
            this.isShiftKey = e.shiftKey;
            this.isAltKey = e.altKey;
            this.isCtrlKey = e.ctrlKey;
            this.isMouseDown = true;
            // copy start state
            vec2.set(this.startXY, e.offsetX, e.offsetY);
            quat.copy(this.startQuat, this.cameraTransforms.rotation);
            mat4.copy(this.startPan, this.cameraTransforms.panTranslation);
            this.viewportWidth = this.editor.getViewportWidth();
            this.viewportHeight = this.editor.getViewportHeight();
            // pick point in 3D
            this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
            this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);
            if (this.collide.hasCollided) {
            }
        };
        cameraArcballController.prototype.onMouseUp = function (e) {
            this.isMouseDown = false;
        };
        cameraArcballController.prototype.onMouseMove = function (e) {
            vec2.set(this.currentMouseXY, e.offsetX, e.offsetY);
            this.hasMouseMoved = true;
        };
        cameraArcballController.prototype.updateLoop = function () {
            if (!this.hasMouseMoved)
                return;
            this.hasMouseMoved = false;
            if (this.isRotateEnabled) {
                if (this.isMouseDown && this.isRightClick
                    || this.isMouseDown && this.isCtrlKey) {
                    var sphereRadius = 0.5 * Math.min(this.viewportWidth, this.viewportHeight);
                    this.arcball.getRotationFrom2dPoints(this.viewportWidth, this.viewportHeight, sphereRadius, this.startXY, this.currentMouseXY, this.dragQuat);
                    quat.multiply(this.tmpRotation, this.dragQuat, this.startQuat);
                    this.cameraTransforms.setRotation(this.tmpRotation);
                    this.cameraTransforms.updateCamera(this.editor.getCamera());
                    this.editor.setRenderFlag();
                    this.transformObjectView.draw();
                }
            }
            if (this.isPanEnabled) {
                if ((this.isMouseDown && this.isShiftKey)
                    || (this.isMouseDown && this.isMiddleClick)) {
                    var xFactor = -this.cameraTransforms.zcam / this.viewportWidth;
                    var yFactor = this.cameraTransforms.zcam / this.viewportHeight;
                    //this.cameraTransforms.pan(this.currentMouseXY[0] * xFactor, this.currentMouseXY[1] * yFactor);
                    //this.cameraTransforms.pan(0.1, 0);
                    //this.startXY
                    this.cameraTransforms.updateCamera(this.editor.getCamera());
                    this.editor.setRenderFlag();
                    this.transformObjectView.draw();
                }
            }
        };
        cameraArcballController.prototype.onTouchStart = function (e) {
            this.isRightClick = true;
            this.isLeftClick = false;
            this.isMiddleClick = false;
            this.isShiftKey = false;
            this.isMouseDown = true;
            // copy start state
            vec2.set(this.startXY, e.touches[0].clientX, e.touches[0].clientY);
            quat.copy(this.startQuat, this.cameraTransforms.rotation);
            mat4.copy(this.startPan, this.cameraTransforms.panTranslation);
            this.viewportWidth = this.editor.getViewportWidth();
            this.viewportHeight = this.editor.getViewportHeight();
            // pick point in 3D
            this.editor.getCamera().getRay(e.touches[0].clientX, e.touches[0].clientY, this.ro, this.rd);
            this.collide.collideAll(this.editor.getAllSd(), this.ro, this.rd);
        };
        cameraArcballController.prototype.onTouchMove = function (e) {
            vec2.set(this.currentMouseXY, e.touches[0].clientX, e.touches[0].clientY);
            this.hasMouseMoved = true;
        };
        cameraArcballController.prototype.onTouchEnd = function (e) {
            this.isMouseDown = false;
        };
        cameraArcballController.prototype.onPanStart = function (e) {
            console.log("panStart");
            /*
            this.isRightClick = true;
            this.isLeftClick = false;
            this.isMiddleClick = false;
            this.isShiftKey = false;
            this.isMouseDown = true;

            // copy start state
            vec2.set(this.startXY, e.center.x, e.center.y)
            quat.copy(this.startQuat, this.cameraTransforms.rotation);
            mat4.copy(this.startPan, this.cameraTransforms.panTranslation);
            this.viewportWidth = this.editor.getViewportWidth();
            this.viewportHeight = this.editor.getViewportHeight();
            */
        };
        cameraArcballController.prototype.onPanMove = function (e) {
            console.log("panMove");
            /*
            vec2.set(this.currentMouseXY, e.touches[0].clientX, e.touches[0].clientY);
            this.hasMouseMoved = true;
            */
        };
        cameraArcballController.prototype.onPanEnd = function (e) {
            console.log("panEnd");
            /*
            this.isMouseDown = false;
            */
        };
        cameraArcballController.prototype.onTap = function (e) {
            console.log("tap");
        };
        return cameraArcballController;
    }());
    qec.cameraArcballController = cameraArcballController;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var cameraTransforms = /** @class */ (function () {
        function cameraTransforms() {
            this.transformMatrix = mat4.create();
            this.rotation = quat.fromValues(0, 0, 0, -1);
            this.rotationMat = mat4.create();
            this.panTranslation = mat4.identity(mat4.create());
            this.zTranslation = mat4.create();
            this.zcam = -3;
            // tmp vectors
            this.tmpVec3 = vec3.create();
            this.up = vec3.create();
            this.right = vec3.create();
        }
        cameraTransforms.prototype.afterInject = function () {
            quat.normalize(this.rotation, this.rotation);
        };
        cameraTransforms.prototype.updateCamera = function (cam) {
            mat4.copy(cam.transformMatrix, this.transformMatrix);
            mat4.invert(cam.inverseTransformMatrix, this.transformMatrix);
        };
        cameraTransforms.prototype.updateTransformMatrix = function () {
            mat4.fromQuat(this.rotationMat, this.rotation);
            mat4.multiply(this.transformMatrix, this.rotationMat, this.panTranslation);
            mat4.identity(this.zTranslation);
            mat4.translate(this.zTranslation, this.zTranslation, vec3.fromValues(0, 0, this.zcam));
            mat4.multiply(this.transformMatrix, this.zTranslation, this.transformMatrix);
        };
        cameraTransforms.prototype.reset = function () {
            //var angleFromVertical = 3.14/8;
            var angleFromVertical = 0;
            quat.setAxisAngle(this.rotation, vec3.fromValues(1, 0, 0), angleFromVertical);
            mat4.identity(this.panTranslation);
            this.zcam = -3;
            this.updateTransformMatrix();
        };
        cameraTransforms.prototype.getCenter = function (dest) {
            mat4.getTranslation(dest, this.panTranslation);
            vec3.scale(dest, dest, -1);
        };
        cameraTransforms.prototype.setCenter = function (center) {
            mat4.identity(this.panTranslation);
            vec3.scale(this.tmpVec3, center, -1);
            mat4.translate(this.panTranslation, this.panTranslation, this.tmpVec3);
            this.updateTransformMatrix();
        };
        cameraTransforms.prototype.getRotation = function (dest) {
            quat.copy(dest, this.rotation);
        };
        cameraTransforms.prototype.setRotation = function (rot) {
            quat.copy(this.rotation, rot);
            this.updateTransformMatrix();
        };
        cameraTransforms.prototype.setZcam = function (z) {
            this.zcam = z;
            this.updateTransformMatrix();
        };
        cameraTransforms.prototype.zoom = function (delta, multiplier) {
            if (delta < 0) {
                this.zcam *= multiplier;
            }
            else {
                this.zcam *= 1.0 / multiplier;
            }
            this.updateTransformMatrix();
        };
        cameraTransforms.prototype.pan = function (dx, dy) {
            //console.log(this.panTranslation);
            //return;
            this.up[0] = this.rotationMat[1];
            this.up[1] = this.rotationMat[5];
            this.up[2] = this.rotationMat[9];
            vec3.scale(this.up, this.up, dy);
            this.right[0] = this.rotationMat[0];
            this.right[1] = this.rotationMat[4];
            this.right[2] = this.rotationMat[8];
            vec3.scale(this.right, this.right, dx);
            mat4.translate(this.panTranslation, this.panTranslation, this.up);
            mat4.translate(this.panTranslation, this.panTranslation, this.right);
            this.updateTransformMatrix();
        };
        return cameraTransforms;
    }());
    qec.cameraTransforms = cameraTransforms;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var controllerManager = /** @class */ (function () {
        function controllerManager() {
            this.camActive = true;
            this.cameraController = qec.inject(qec.cameraArcballController);
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
            if (c != null)
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
        controllerManager.prototype.onTouchStart = function (e) {
            if (this.camActive)
                this.cameraController.onTouchStart(e);
        };
        controllerManager.prototype.onTouchMove = function (e) {
            if (this.camActive)
                this.cameraController.onTouchMove(e);
        };
        controllerManager.prototype.onTouchEnd = function (e) {
            if (this.camActive)
                this.cameraController.onTouchEnd(e);
        };
        controllerManager.prototype.onPanStart = function (e) {
            if (this.camActive)
                this.cameraController.onPanStart(e);
            if (this.currentController != null)
                this.currentController.onPanStart(e);
        };
        controllerManager.prototype.onPanMove = function (e) {
            if (this.camActive)
                this.cameraController.onPanMove(e);
            if (this.currentController != null)
                this.currentController.onPanMove(e);
        };
        controllerManager.prototype.onPanEnd = function (e) {
            if (this.camActive)
                this.cameraController.onPanEnd(e);
            if (this.currentController != null)
                this.currentController.onPanEnd(e);
        };
        controllerManager.prototype.onTap = function (e) {
            if (this.camActive)
                this.cameraController.onTap(e);
            if (this.currentController != null)
                this.currentController.onTap(e);
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
    var drawInCanvas = /** @class */ (function () {
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
    var editorView = /** @class */ (function () {
        function editorView() {
            this.editor = qec.inject(qec.editor);
            this.saveWorkspace = qec.inject(qec.saveWorkspace);
            this.loadWorkspace = qec.inject(qec.loadWorkspace);
            //updateLoop:updateLoop = inject(updateLoop);
            this.controllerManager = qec.inject(qec.controllerManager);
            this.cameraController = qec.inject(qec.cameraArcballController);
            this.selectController = qec.inject(qec.selectController);
            this.heightController = qec.inject(qec.heightController);
            this.transformObjectController = qec.inject(qec.transformObjectController);
            this.importView = qec.inject(qec.importView);
            this.profileView = qec.inject(qec.profileView);
            this.materialView = qec.inject(qec.materialView);
            this.shareView = qec.inject(qec.shareView);
            this.printView = qec.inject(qec.printView);
            this.transformObjectView = qec.inject(qec.transformObjectView);
            this.isSelectControllerActive = ko.observable(true);
            this.isMoveControllerActive = ko.observable(false);
            this.isScaleControllerActive = ko.observable(false);
            this.isScaleBottomControllerActive = ko.observable(false);
            // toolbars
            this.importToolbarVisible = ko.observable(false);
            this.modifyToolbarVisible = ko.observable(false);
            this.environmentToolbarVisible = ko.observable(false);
            this.photoToolbarVisible = ko.observable(false);
            this.printToolbarVisible = ko.observable(false);
            this.transformObjectViewVisible = ko.observable(false);
            this.profileViewVisible = ko.observable(false);
            this.toolbarsVisible = [
                this.importToolbarVisible,
                this.modifyToolbarVisible,
                this.environmentToolbarVisible,
                this.photoToolbarVisible,
                this.printToolbarVisible
            ];
            this.animRot = quat.create();
            this.animIndex = 0;
            this.doAnimate = false;
        }
        editorView.prototype.afterInject = function () {
            this.editor.setRenderFlag();
            this.updateLoop();
        };
        editorView.prototype.initEditor = function (elt) {
            this.editor.init(elt);
        };
        editorView.prototype.menuNew = function () {
        };
        editorView.prototype.menuSave = function () {
            this.saveWorkspace.saveJsonInLocalStorage(this.editor);
        };
        editorView.prototype.menuOpen = function () {
            this.loadWorkspace.loadFromLocalStorage(this.editor);
        };
        editorView.prototype.onMouseMove = function (data, e) { this.controllerManager.onMouseMove(e); };
        editorView.prototype.onMouseDown = function (data, e) { this.controllerManager.onMouseDown(e); };
        editorView.prototype.onMouseUp = function (data, e) { this.controllerManager.onMouseUp(e); };
        editorView.prototype.onMouseWheel = function (data, e) { this.controllerManager.onMouseWheel(e); };
        editorView.prototype.onTouchStart = function (data, e) { this.controllerManager.onTouchStart(e); };
        editorView.prototype.onTouchMove = function (data, e) { this.controllerManager.onTouchMove(e); };
        editorView.prototype.onTouchEnd = function (data, e) { this.controllerManager.onTouchEnd(e); };
        editorView.prototype.onPanStart = function (e) { this.controllerManager.onPanStart(e); };
        editorView.prototype.onPanMove = function (e) { this.controllerManager.onPanMove(e); };
        editorView.prototype.onPanEnd = function (e) { this.controllerManager.onPanEnd(e); };
        editorView.prototype.onTap = function (e) { this.controllerManager.onTap(e); };
        editorView.prototype.setSelectController = function () {
            this.controllerManager.setController(this.transformObjectController);
            this.setActiveController(this.isSelectControllerActive);
            this.transformObjectViewVisible(true);
            this.profileViewVisible(false);
        };
        editorView.prototype.toggleProfileView = function () {
            if (this.profileViewVisible()) {
                this.profileViewVisible(false);
                this.transformObjectViewVisible(true);
            }
            else {
                this.profileViewVisible(true);
            }
        };
        editorView.prototype.toggleProfileDebug = function () {
            this.profileView.toggleDebug();
        };
        editorView.prototype.setActiveController = function (c) {
            this.isSelectControllerActive(false);
            this.isMoveControllerActive(false);
            this.isScaleControllerActive(false);
            this.isScaleBottomControllerActive(false);
            c(true);
        };
        editorView.prototype.setSelectedIndex = function (i) {
            this.editor.setSelectedIndex(i);
            this.profileView.setSelectedIndex(i);
            //this.materialView.setSelectedIndex(i);
            this.transformObjectView.setSelectedIndex(i);
        };
        editorView.prototype.updateLoop = function () {
            var _this = this;
            this.controllerManager.updateLoop();
            this.profileView.updateLoop();
            this.animateLoop();
            this.editor.updateLoop();
            requestAnimationFrame(function () { return _this.updateLoop(); });
        };
        editorView.prototype.showImportToolbar = function () { this.setToolbar(this.importToolbarVisible); };
        editorView.prototype.showModifyToolbar = function () {
            if (!this.modifyToolbarVisible()) {
                this.setToolbar(this.modifyToolbarVisible);
                this.transformObjectViewVisible(true);
                this.setSelectController();
            }
            else {
                this.setToolbar(this.modifyToolbarVisible);
            }
        };
        editorView.prototype.showEnvironmentToolbar = function () { this.setToolbar(this.environmentToolbarVisible); };
        editorView.prototype.showPhotoToolbar = function () { this.setToolbar(this.photoToolbarVisible); };
        editorView.prototype.showPrintToolbar = function () { this.setToolbar(this.printToolbarVisible); };
        editorView.prototype.setToolbar = function (selected) {
            this.transformObjectViewVisible(false);
            this.profileViewVisible(false);
            this.controllerManager.setController(null);
            var oldValue = selected();
            this.toolbarsVisible.forEach(function (t) { return t(false); });
            //selected(true);
            selected(!oldValue);
        };
        editorView.prototype.light1 = function () {
            var w = this.editor.workspace;
            w.keyLight.intensity = 0.8;
            w.fillLight.intensity = 0.2;
            w.rimLight.intensity = 0.2;
            this.editor.setRenderFlag();
        };
        editorView.prototype.light2 = function () {
            var w = this.editor.workspace;
            w.keyLight.intensity = 0;
            w.fillLight.intensity = 0.5;
            w.rimLight.intensity = 0.5;
            this.editor.setRenderFlag();
        };
        editorView.prototype.toggleSoftwareHardware = function () {
            this.editor.toggleSimpleRenderer();
        };
        editorView.prototype.animate = function () {
            this.doAnimate = !this.doAnimate;
        };
        editorView.prototype.animateLoop = function () {
            if (!this.doAnimate)
                return;
            var cameraTransforms = this.cameraController.cameraTransforms;
            cameraTransforms.zoom(this.animIndex < 20 ? 1 : -1, 1.05);
            //cameraTransforms.getRotation(this.animRot);
            //cameraTransforms.setRotation(this.tmpRotation);
            this.animIndex = (this.animIndex + 1) % 40;
            cameraTransforms.updateCamera(this.editor.getCamera());
            this.editor.setRenderFlag();
        };
        return editorView;
    }());
    qec.editorView = editorView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var heightController = /** @class */ (function () {
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
            this.isScaleModeBottom = false;
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
                    mat4.translate(this.selected.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(this.selected.inverseTransform, this.selected.inverseTransform);
                    this.selected.updateInverseTransform();
                    this.editor.renderer.updateTransform(this.selected.sd);
                    this.editor.setRenderFlag();
                }
                else if (!this.isScaleModeBottom) {
                    vec4.copy(this.newBounds, this.startBounds);
                    this.newBounds[3] += this.deltaPos[2];
                    this.selected.scaleProfilePoints(this.newBounds);
                    this.editor.updateSignedDistance(this.selected);
                    this.editor.renderer.updateFloatTextures(this.selected.sd);
                    this.editor.setRenderFlag();
                }
                else {
                    mat4.translate(this.selected.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(this.selected.inverseTransform, this.selected.inverseTransform);
                    this.selected.updateInverseTransform();
                    this.editor.renderer.updateTransform(this.selected.sd);
                    vec4.copy(this.newBounds, this.startBounds);
                    this.newBounds[3] += (-this.deltaPos[2]);
                    this.selected.scaleProfilePoints(this.newBounds);
                    this.editor.updateSignedDistance(this.selected);
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
                this.selected = this.editor.workspace.editorObjects[this.collide.sdIndex];
                mat4.invert(this.startTransform, this.selected.sd.inverseTransform);
                vec4.copy(this.startBounds, this.selected.profileBounds);
                this.editorView.setSelectedIndex(this.collide.sdIndex);
            }
        };
        heightController.prototype.onMouseUp = function (e) {
            this.isMouseDown = false;
        };
        heightController.prototype.onMouseWheel = function (e) { };
        heightController.prototype.onTouchStart = function (e) { };
        heightController.prototype.onTouchMove = function (e) { };
        heightController.prototype.onTouchEnd = function (e) { };
        heightController.prototype.onPanStart = function (e) { };
        heightController.prototype.onPanMove = function (e) { };
        heightController.prototype.onPanEnd = function (e) { };
        heightController.prototype.onTap = function (e) { };
        return heightController;
    }());
    qec.heightController = heightController;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var importView = /** @class */ (function () {
        function importView() {
            this.editor = qec.inject(qec.editor);
            this.editorView = qec.inject(qec.editorView);
            this.importedSvgs = ko.observableArray();
            this.noPicture = ko.observable(true);
            this.atLeastOnePicture = ko.observable(false);
            this.createImportedSvg = qec.injectFunc(qec.importedSvg);
        }
        importView.prototype.set = function () {
        };
        importView.prototype.setElement = function (elt) {
            var _this = this;
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
                var isFirstImport = _this.editor.workspace.editorObjects.length == 0;
                /*
                this.importedContent = reader.result;
                this.editor.importSvg(this.importedContent,
                    ()=>{}//this.editor.setSelectedIndex(0)
                );
                */
                var readerResult = reader.result;
                var newSvg = _this.createImportedSvg();
                newSvg.importView = _this;
                newSvg.src("data:image/svg+xml;base64," + btoa(readerResult));
                newSvg.content = readerResult;
                _this.importedSvgs.push(newSvg);
                _this.editor.addSvg(readerResult);
                //if (this.importedSvgs.length == 1)
                _this.select(newSvg);
                _this.atLeastOnePicture(true);
                _this.noPicture(false);
                if (isFirstImport)
                    _this.editorView.showModifyToolbar();
            };
            // when the file is read it triggers the onload event above.
            if (file) {
                reader.readAsText(file);
            }
        };
        importView.prototype.select = function (importedSvg) {
            this.importedSvgs().forEach(function (x) { return x.isActive(false); });
            importedSvg.isActive(true);
            var index = this.importedSvgs().indexOf(importedSvg);
            console.log('index ' + index);
            this.editor.setSelectedSvgIndex(index, function () { });
            //this.editor.importSvg(importedSvg.content,()=>{});
        };
        importView.prototype.remove = function (importedSvg) {
            this.importedSvgs.remove(importedSvg);
        };
        return importView;
    }());
    qec.importView = importView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var importedSvg = /** @class */ (function () {
        function importedSvg() {
            this.src = ko.observable('');
            this.content = '';
            this.isActive = ko.observable(false);
        }
        importedSvg.prototype.onClick = function () {
            this.importView.select(this);
            //this.isActive(true);
        };
        importedSvg.prototype.remove = function () {
            this.importView.remove(this);
        };
        return importedSvg;
    }());
    qec.importedSvg = importedSvg;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var index2 = /** @class */ (function () {
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
                    _this.texturePacker = new qec.texturePacker();
                    _this.texturePacker.repackMode = 0;
                    _this.texturePacker.repackSdRec(_this.renderSettings.sd);
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
                this.renderer.updateShader(this.renderSettings.sd, this.renderSettings.spotLights.length, this.texturePacker);
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
//var Hammer: any;
var events = ['tap', 'doubletap', 'press', 'pinch', 'pan', 'panstart', 'panmove', 'panend', 'pinchstart', 'pinchmove', 'pinchend'];
ko.utils.arrayForEach(events, function (eventName) {
    ko.bindingHandlers[eventName] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            if (element.hammer == null) {
                element.hammer = new Hammer(element);
                element.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
            }
            var hammer = element.hammer;
            var value = valueAccessor();
            hammer.on(eventName, function (e) {
                value.call(viewModel, e);
            });
        }
    };
});
var qec;
(function (qec) {
    var materialView = /** @class */ (function () {
        function materialView() {
            this.editor = qec.inject(qec.editor);
            this.selectedIndex = -1;
            this.isHole = ko.observable(false);
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
                var m = this.editor.workspace.editorObjects[this.selectedIndex].diffuseColor;
                this.spectrumElt.spectrum("set", "rgb(" +
                    m[0] * 255 + "," +
                    m[1] * 255 + "," +
                    m[2] * 255 + ")");
            }
        };
        materialView.prototype.onColorChange = function (color) {
            var fakePos = vec3.create();
            if (this.selectedIndex >= 0) {
                var o = this.editor.workspace.editorObjects[this.selectedIndex];
                o.setDiffuseColor([color._r / 255, color._g / 255, color._b / 255]);
                this.editor.renderer.updateDiffuse(o.sd);
                this.editor.setRenderFlag();
            }
        };
        materialView.prototype.changeIsHole = function () {
            if (this.selectedIndex >= 0) {
                var l = this.editor.workspace.editorObjects[this.selectedIndex];
                l.setIsHole(this.isHole());
                //l.profileSmooth = false;
                this.editor.setUpdateFlag();
            }
        };
        return materialView;
    }());
    qec.materialView = materialView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var printView = /** @class */ (function () {
        function printView() {
            /*
            allDesignsUrl = ko.observableArray<string>();
    
            designName = ko.observable('mydesign');
            designUrl = ko.observable('');
            state = ko.observable('');
            frameVisible = ko.observable(false);
            frameSrc = ko.observable('');
            */
            this.editor = qec.inject(qec.editor);
            this.sculpteoDesignName = ko.observable('mydesign');
            this.sculpteoState = ko.observable('');
            this.sculpteoFrameVisible = ko.observable(false);
            this.sculpteoFrameSrc = ko.observable('');
            this.sculpteoDesignUrl = ko.observable('');
            this.allPrintUrl = ko.observableArray();
        }
        printView.prototype.sendToSculpteo = function () {
            var _this = this;
            var req = new XMLHttpRequest();
            req.open('POST', '/sculpteo?designName=' + this.sculpteoDesignName(), true);
            req.onreadystatechange = function (aEvt) {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var response = JSON.parse(req.responseText);
                        if (response.errors) {
                            alert(JSON.stringify(response.errors));
                        }
                        else {
                            var uuid = response.uuid;
                            var url = 'http://www.sculpteo.com/en/embed/redirect/' + uuid + '?click=details';
                            _this.sculpteoFrameVisible(true);
                            _this.sculpteoFrameSrc(url);
                            _this.sculpteoDesignUrl('https://www.sculpteo.com/gallery/design/ext/' + uuid);
                            _this.allPrintUrl.push(_this.sculpteoDesignUrl());
                            $('#modalSculpteo').modal('show');
                            //$('.sculpteoFrame').attr('width', $('.screen').width());
                            //$('.sculpteoFrame').attr('height', $('.screen').height());
                        }
                    }
                    else {
                        alert("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            req.onprogress = function (bEvt) {
                _this.sculpteoState('' + bEvt.loaded + '/' + bEvt.total);
            };
            this.sculpteoState = ko.observable('Sending');
            //var stl = this.editor.computeBinarySTL(10, 10, 10);
            //var blob = new Blob([stl], {type: 'application/octet-stream'});
            // req.send(blob);
            //this.editor.computeBinarySTLAsZip(30, 30, 30, 10, (content) => req.send(content));
            this.editor.computeOBJAsZip(150, 150, 100, 10, function (content) { console.log('contentSize: ' + content.size); req.send(content); });
            /*
            var myArray = new ArrayBuffer(512);
            var longInt8View = new Uint8Array(myArray);

            for (var i=0; i < longInt8View.length; i++) {
                longInt8View[i] = i % 255;
            }
            var blob = new Blob([longInt8View], {type: 'application/octet-stream'});
            */
        };
        printView.prototype.exportSTL = function () {
            var isStl = false;
            //var blob:Blob;
            if (!isStl) {
                /*
                var obj = this.editor.computeOBJ();
                var blob = new Blob([obj], {type: 'text/plain'});
                saveAs(blob, 'download.obj');
                */
                this.editor.computeOBJAsZip(50, 50, 50, 1, function (content) { return saveAs(content, 'a.obj.zip'); });
            }
            else {
                //var stl = this.editor.computeTextSTL();
                var stl = this.editor.computeBinarySTL(50, 50, 50, 1);
                var blob = new Blob([stl], { type: 'application//octet-binary' });
                saveAs(blob, 'download.stl');
            }
        };
        return printView;
    }());
    qec.printView = printView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var profileExample = /** @class */ (function () {
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
            this.canvas.width = 30;
            this.canvas.height = 60;
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
            var o = this.editor.workspace.editorObjects[this.editor.workspace.selectedIndex];
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
    var profileExamples = /** @class */ (function () {
        function profileExamples() {
            this.examples = [];
            this.createExample = qec.injectFunc(profileExample);
            this.visible = ko.observable(true);
        }
        profileExamples.prototype.afterInject = function () {
            this.push([[0, 0], [0.5, 0], [1, 0], [1, 0.2], [1, 0.4], [1, 0.6], [1, 0.8], [1, 1], [0.5, 1], [0, 1]]);
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
    var profileView = /** @class */ (function () {
        function profileView() {
            this.editor = qec.inject(qec.editor);
            this.bsplineDrawer = new qec.bsplineDrawer();
            this.lineDrawer = new qec.lineDrawer();
            this.points = [];
            this.pointIndex = -1;
            this.doUpdate = false;
            this.selectedIndex = -1;
            this.maxCanvasWidth = 290;
            this.maxCanvasHeight = 290;
            this.offsetX = 20;
            this.offsetY = 20;
            this.profileExamples = qec.inject(qec.profileExamples);
            this.isLines = ko.observable();
            this.isSmooth = ko.observable();
        }
        profileView.prototype.init = function (elt) {
            var _this = this;
            this.debugCanvas = document.createElement('canvas');
            elt.appendChild(this.debugCanvas);
            this.debugCanvas.style.display = 'none';
            this.maxCanvasWidth = window.innerWidth;
            this.maxCanvasHeight = window.innerHeight - 142;
            this.canvas = document.createElement('canvas');
            this.canvas.style.border = 'solid 1px green';
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
            this.isSmooth(false);
            if (this.selectedIndex >= 0) {
                var l = this.editor.workspace.editorObjects[this.selectedIndex];
                l.profileSmooth = false;
                this.draw();
                this.updateEditor();
            }
        };
        ;
        profileView.prototype.setAsSmooth = function () {
            this.isLines(false);
            if (this.selectedIndex >= 0) {
                var l = this.editor.workspace.editorObjects[this.selectedIndex];
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
            var l = this.editor.workspace.editorObjects[i];
            var profileBounds = l.profileBounds;
            var boundW = profileBounds[2] - profileBounds[0];
            var boundH = profileBounds[3] - profileBounds[1];
            var canvasWidth = this.maxCanvasWidth;
            var canvasHeight = this.maxCanvasHeight;
            if (boundH > boundW)
                canvasWidth = Math.min(this.maxCanvasWidth, canvasHeight * boundW / boundH);
            else
                canvasHeight = Math.min(this.maxCanvasHeight, canvasWidth * boundH / boundW);
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
            var selected = this.editor.workspace.editorObjects[this.selectedIndex];
            var profileBounds = selected.profileBounds;
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
            selected.setProfilePoints(profilePoints);
            this.editor.renderer.updateFloatTextures(selected.sd);
            this.editor.setRenderFlag();
            this.editor.setUpdateFlag();
        };
        profileView.prototype.draw = function () {
            if (this.selectedIndex < 0)
                return;
            var l = this.editor.workspace.editorObjects[this.selectedIndex];
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.fillStyle = "rgba(0,0,0,0.3)";
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
                ctx.strokeStyle = "rgba(0,255,0,1)";
                ctx.fillStyle = "rgba(0,255,0,0.3)";
                if (this.pointIndex == i)
                    ctx.fillStyle = "rgba(255,0,0,0.3)";
                ctx.beginPath();
                ctx.arc(this.points[i][0], this.points[i][1], 5, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.stroke();
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
        profileView.prototype.toggleDebug = function () {
            if (this.canvas.style.display == 'none') {
                this.canvas.style.display = 'block';
                this.debugCanvas.style.display = 'none';
            }
            else {
                var l = this.editor.workspace.editorObjects[this.selectedIndex];
                l.profile.debugInfoInExistingCanvas(this.debugCanvas);
                this.canvas.style.display = 'none';
                this.debugCanvas.style.display = 'block';
            }
        };
        return profileView;
    }());
    qec.profileView = profileView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var selectController = /** @class */ (function () {
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
            for (var i = 0; i < this.editor.workspace.editorObjects.length; ++i) {
                this.collide.collide(this.editor.workspace.editorObjects[i].sd, this.ro, this.rd);
                //console.log(this.collide.pos);
                //console.log(this.collide.minDist);
                if (this.collide.hasCollided && this.collide.dist < minDist) {
                    minDist = this.collide.dist;
                    iMin = i;
                }
            }
            if (iMin > -1) {
                this.editorView.setSelectedIndex(iMin);
            }
        };
        selectController.prototype.onMouseWheel = function (e) { };
        selectController.prototype.onTouchStart = function (e) { };
        selectController.prototype.onTouchMove = function (e) { };
        selectController.prototype.onTouchEnd = function (e) { };
        selectController.prototype.onPanStart = function (e) { };
        selectController.prototype.onPanMove = function (e) { };
        selectController.prototype.onPanEnd = function (e) { };
        selectController.prototype.onTap = function (e) { };
        return selectController;
    }());
    qec.selectController = selectController;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var shareView = /** @class */ (function () {
        function shareView() {
            this.editor = qec.inject(qec.editor);
            this.uploadedUrl = ko.observable('');
            this.uploadedSrc = ko.observable('');
            this.allPhotoUrl = ko.observableArray();
        }
        shareView.prototype.exportSTL = function () {
            var isStl = false;
            //var blob:Blob;
            if (!isStl) {
                /*
                var obj = this.editor.computeOBJ();
                var blob = new Blob([obj], {type: 'text/plain'});
                saveAs(blob, 'download.obj');
                */
                this.editor.computeOBJAsZip(50, 50, 50, 1, function (content) { return saveAs(content, 'a.obj.zip'); });
            }
            else {
                //var stl = this.editor.computeTextSTL();
                var stl = this.editor.computeBinarySTL(50, 50, 50, 1);
                var blob = new Blob([stl], { type: 'application//octet-binary' });
                saveAs(blob, 'download.stl');
            }
        };
        shareView.prototype.savePhoto = function () {
            qec.saveAsImage(this.editor.renderer.getCanvas());
        };
        shareView.prototype.uploadPhoto = function () {
            var _this = this;
            var elt = this.editor.renderer.getCanvas();
            var imgData = elt.toDataURL("image/jpeg");
            this.uploadedSrc(imgData);
            var req = new XMLHttpRequest();
            req.open('POST', '/uploadString', true);
            req.responseType = 'json';
            req.onreadystatechange = function (aEvt) {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var id = req.response.id;
                        console.log(req.response);
                        console.log(req.response.id);
                        _this.uploadedUrl(window.location.protocol + '//' + window.location.host + '/downloadDataUri?id=' + id);
                        _this.allPhotoUrl.push(window.location.protocol + '//' + window.location.host + '/downloadDataUri?id=' + id);
                        $('#modalPhoto').modal('show');
                    }
                    else {
                        alert("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            console.log(imgData);
            req.send(imgData);
        };
        return shareView;
    }());
    qec.shareView = shareView;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var topView = /** @class */ (function () {
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
var qec;
(function (qec) {
    var transformObjectController = /** @class */ (function () {
        function transformObjectController() {
            this.editor = qec.inject(qec.editor);
            this.editorView = qec.inject(qec.editorView);
            this.profileView = qec.inject(qec.profileView);
            this.transformObjectUtils = qec.inject(qec.transformObjectUtils);
            this.transformObjectView = qec.inject(qec.transformObjectView);
            this.collide = new qec.renderCollide();
            this.isMouseDown = false;
            this.updateFlag = false;
            this.handlePicked = false;
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
            this.tmpVec3 = vec3.create();
            this.isScaleMode = false;
            this.isScaleModeBottom = false;
        }
        transformObjectController.prototype.set = function () {
            //console.log('heightController');
            this.updateFlag = false;
            this.isMouseDown = false;
            this.handlePicked = false;
        };
        transformObjectController.prototype.unset = function () {
        };
        transformObjectController.prototype.updateLoop = function () {
            if (this.isMouseDown && this.updateFlag && this.handlePicked) {
                this.updateFlag = false;
                var selected = this.editor.workspace.getSelectedObject();
                this.editor.getCamera().getRay(this.mouseX, this.mouseY, this.ro, this.rd);
                // project mouse on up ray from startPos
                this.lineUp.setOriginAndDirection(this.startPos, this.dirUp);
                this.lineCam.setOriginAndDirection(this.ro, this.rd);
                this.distLines.setLines(this.lineUp, this.lineCam);
                this.distLines.getDistance();
                this.distLines.getClosestPoint0(this.mousePos);
                vec3.subtract(this.deltaPos, this.mousePos, this.startPos);
                if (!this.isScaleMode) {
                    /*
                    console.log("Translate mode !");
                    console.log("startPos", this.startPos);
                    console.log("mousePos", this.mousePos);
                    */
                    mat4.translate(selected.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(selected.inverseTransform, selected.inverseTransform);
                    selected.updateInverseTransform();
                    this.editor.renderer.updateTransform(selected.sd);
                    this.editor.setRenderFlag();
                    this.transformObjectView.draw();
                }
                else if (!this.isScaleModeBottom) {
                    vec4.copy(this.newBounds, this.startBounds);
                    this.newBounds[3] += this.deltaPos[2];
                    /*
                    console.log("Translate mode !");
                    console.log("newBounds", this.newBounds);
                    */
                    selected.scaleProfilePoints(this.newBounds);
                    this.editor.renderer.updateFloatTextures(selected.sd);
                    this.editor.setRenderFlag();
                    this.editor.setUpdateFlag();
                    this.transformObjectView.draw();
                }
                /*
                else {
                    mat4.translate(selected.inverseTransform, this.startTransform, this.deltaPos);
                    mat4.invert(selected.inverseTransform, selected.inverseTransform);
                    selected.updateInverseTransform();
                    this.editor.renderer.updateTransform(selected.sd);

                    vec4.copy(this.newBounds, this.startBounds)
                    this.newBounds[3] += (-this.deltaPos[2]);
                    selected.scaleProfilePoints(this.newBounds);
                    this.editor.updateSignedDistance(selected);
                    this.editor.renderer.updateFloatTextures(selected.sd);

                    this.editor.setRenderFlag();
                }*/
                /*
                if (this.isScaleMode) {
                    this.profileView.refresh();
                }*/
            }
        };
        transformObjectController.prototype.onMouseMove = function (e) {
            if (this.isMouseDown) {
                this.mouseX = e.offsetX;
                this.mouseY = e.offsetY;
                this.updateFlag = true;
            }
        };
        transformObjectController.prototype.onMouseDown = function (e) {
            this.isMouseDown = false;
            if (e.button != 0)
                return;
            this.handlePicked = false;
            var l = this.editor.workspace.getSelectedObject();
            if (l != null) {
                this.transformObjectUtils.getMoveHandleScreenCoordinates(this.tmpVec3, l);
                if (Math.max(Math.abs(this.tmpVec3[0] - e.offsetX), Math.abs(this.tmpVec3[1] - e.offsetY)) < 5) {
                    //console.log("in !");
                    this.handlePicked = true;
                    //this.transformObjectView.highlightCenter(true);
                    this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
                    this.isMouseDown = true;
                    this.isScaleMode = false;
                    // Initial state
                    this.startX = e.offsetX;
                    this.startY = e.offsetY;
                    l.getAbsoluteBottomCenter(this.startPos);
                    mat4.invert(this.startTransform, l.inverseTransform);
                }
                this.transformObjectUtils.getScaleTopHandleScreenCoordinates(this.tmpVec3, l);
                if (Math.max(Math.abs(this.tmpVec3[0] - e.offsetX), Math.abs(this.tmpVec3[1] - e.offsetY)) < 5) {
                    this.handlePicked = true;
                    this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
                    this.isMouseDown = true;
                    this.isScaleMode = true;
                    this.isScaleModeBottom = false;
                    // Initial state
                    this.startX = e.offsetX;
                    this.startY = e.offsetY;
                    vec4.copy(this.startBounds, l.profileBounds);
                    l.getAbsoluteTopCenter(this.startPos);
                    mat4.invert(this.startTransform, l.inverseTransform);
                }
                /*
                this.transformObjectUtils.getScaleBottomHandleScreenCoordinates(this.tmpVec3, l);

                if (Math.max(Math.abs(this.tmpVec3[0] - e.offsetX), Math.abs(this.tmpVec3[1] - e.offsetY)) < 5) {
                    this.handlePicked = true;

                    this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
                    this.isMouseDown = true;
                    this.isScaleMode = true;
                    this.isScaleModeBottom = true;

                    // Initial state
                    this.startX = (<MouseEvent>e).offsetX;
                    this.startY = (<MouseEvent>e).offsetY;

                    l.getAbsoluteBottomCenter(this.startPos);
                    mat4.invert(this.startTransform, l.inverseTransform);
                }
                */
            }
            if (!this.handlePicked) {
                var picked = this.pick(e);
                this.editorView.setSelectedIndex(picked);
            }
        };
        transformObjectController.prototype.onMouseUp = function (e) {
            this.isMouseDown = false;
        };
        transformObjectController.prototype.onMouseWheel = function (e) { };
        transformObjectController.prototype.onTouchStart = function (e) { };
        transformObjectController.prototype.onTouchMove = function (e) { };
        transformObjectController.prototype.onTouchEnd = function (e) { };
        transformObjectController.prototype.onPanStart = function (e) { };
        transformObjectController.prototype.onPanMove = function (e) { };
        transformObjectController.prototype.onPanEnd = function (e) { };
        transformObjectController.prototype.onTap = function (e) { };
        transformObjectController.prototype.pick = function (e) {
            var minDist = 666;
            var iMin = -1;
            this.isMouseDown = false;
            this.editor.getCamera().getRay(e.offsetX, e.offsetY, this.ro, this.rd);
            for (var i = 0; i < this.editor.workspace.editorObjects.length; ++i) {
                this.collide.collide(this.editor.workspace.editorObjects[i].sd, this.ro, this.rd);
                //console.log(this.collide.pos);
                //console.log(this.collide.minDist);
                if (this.collide.hasCollided && this.collide.dist < minDist) {
                    minDist = this.collide.dist;
                    iMin = i;
                }
            }
            return iMin;
        };
        return transformObjectController;
    }());
    qec.transformObjectController = transformObjectController;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var transformObjectUtils = /** @class */ (function () {
        function transformObjectUtils() {
            this.editor = qec.inject(qec.editor);
            this.tmpObjectTransform = mat4.create();
        }
        transformObjectUtils.prototype.getMoveHandleScreenCoordinates = function (out, selected) {
            var camera = this.editor.getCamera();
            selected.getAbsoluteBottomCenter(out);
            camera.getScreenPosition(out, out);
        };
        transformObjectUtils.prototype.getScaleTopHandleScreenCoordinates = function (out, selected) {
            var camera = this.editor.getCamera();
            selected.getAbsoluteTopCenter(out);
            camera.getScreenPosition(out, out);
        };
        return transformObjectUtils;
    }());
    qec.transformObjectUtils = transformObjectUtils;
})(qec || (qec = {}));
var qec;
(function (qec) {
    var transformObjectView = /** @class */ (function () {
        function transformObjectView() {
            this.editor = qec.inject(qec.editor);
            this.transformObjectUtils = qec.inject(qec.transformObjectUtils);
            this.points = [];
            this.selectedIndex = -1;
            this.tmpObjectTransform = mat4.create();
            this.bbmin = vec3.create();
            this.bbmax = vec3.create();
            this.center = vec3.create();
            this.centerTop = vec3.create();
            this.centerBottom = vec3.create();
            this.p1 = vec3.create();
            this.p2 = vec3.create();
            this.p3 = vec3.create();
            this.p4 = vec3.create();
            this.p5 = vec3.create();
            this.p6 = vec3.create();
            this.p7 = vec3.create();
            this.p8 = vec3.create();
            this.s1 = vec3.create();
            this.s2 = vec3.create();
            this.s3 = vec3.create();
            this.s4 = vec3.create();
            this.camDir = vec3.create();
            this.vdot1 = vec3.create();
            this.vdot2 = vec3.create();
        }
        transformObjectView.prototype.init = function (elt) {
            this.canvas = document.createElement('canvas');
            this.canvas.style.border = 'solid 1px red';
            elt.appendChild(this.canvas);
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 102;
            this.draw();
        };
        transformObjectView.prototype.setSelectedIndex = function (i) {
            this.selectedIndex = i;
            this.draw();
        };
        transformObjectView.prototype.draw = function () {
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.selectedIndex < 0)
                return;
            var l = this.editor.workspace.getSelectedObject();
            l.getAbsoluteBounds(this.bbmin, this.bbmax);
            vec3.set(this.p1, this.bbmin[0], this.bbmin[1], this.bbmin[2]);
            vec3.set(this.p2, this.bbmin[0], this.bbmax[1], this.bbmin[2]);
            vec3.set(this.p3, this.bbmax[0], this.bbmax[1], this.bbmin[2]);
            vec3.set(this.p4, this.bbmax[0], this.bbmin[1], this.bbmin[2]);
            vec3.set(this.p5, this.bbmin[0], this.bbmin[1], this.bbmax[2]);
            vec3.set(this.p6, this.bbmin[0], this.bbmax[1], this.bbmax[2]);
            vec3.set(this.p7, this.bbmax[0], this.bbmax[1], this.bbmax[2]);
            vec3.set(this.p8, this.bbmax[0], this.bbmin[1], this.bbmax[2]);
            var _1 = this.p1;
            var _2 = this.p2;
            var _3 = this.p3;
            var _4 = this.p4;
            var _5 = this.p5;
            var _6 = this.p6;
            var _7 = this.p7;
            var _8 = this.p8;
            this.drawSquare(_1, _2, _3, _4);
            this.drawSquare(_5, _8, _7, _6);
            this.drawSquare(_1, _4, _8, _5);
            this.drawSquare(_2, _6, _7, _3);
            this.drawSquare(_1, _5, _6, _2);
            this.drawSquare(_4, _3, _7, _8);
            var rw = 10;
            this.transformObjectUtils.getMoveHandleScreenCoordinates(this.center, l);
            this.transformObjectUtils.getScaleTopHandleScreenCoordinates(this.centerTop, l);
            ctx.strokeStyle = "rgba(0,255,0,1)";
            ctx.strokeRect(this.center[0] - 0.5 * rw, this.center[1] - 0.5 * rw, rw, rw);
            ctx.strokeStyle = "rgba(255, 255, 0,1)";
            ctx.strokeRect(this.centerTop[0] - 0.5 * rw, this.centerTop[1] - 0.5 * rw, rw, rw);
            ctx.beginPath();
            ctx.moveTo(this.center[0], this.center[1]);
            ctx.lineTo(this.centerTop[0], this.centerTop[1]);
            ctx.stroke();
            ctx.closePath();
            /*

            ctx.strokeStyle = "rgba(128,128,128,1)";
            ctx.beginPath();
            ctx.moveTo(centerDown[0], centerDown[1]);
            ctx.lineTo(centerUp[0], centerUp[1]);
            ctx.stroke();
            ctx.closePath();


            this.points = [screenPosition1, screenPosition2, screenPosition3, screenPosition4]
            ctx.strokeStyle = "rgba(128,128,128,1)";
            ctx.beginPath();
            ctx.moveTo(this.points[0][0], this.points[0][1]);
            for (var i = 0; i < this.points.length; i++) {
                ctx.lineTo(this.points[i][0], this.points[i][1]);
            }
            ctx.lineTo(this.points[0][0], this.points[0][1]);

            ctx.stroke();
            ctx.closePath();
            */
        };
        transformObjectView.prototype.drawSquare = function (_1, _2, _3, _4) {
            var camera = this.editor.getCamera();
            this.camDir[0] = camera.transformMatrix[2];
            this.camDir[1] = camera.transformMatrix[6];
            this.camDir[2] = camera.transformMatrix[10];
            //vec3.subtract(this.camDir, camera.target, camera.position);
            // check if square faces the camera
            vec3.subtract(this.vdot1, _1, _2);
            vec3.subtract(this.vdot2, _3, _2);
            var cross = vec3.cross(this.vdot1, this.vdot1, this.vdot2);
            var dot = vec3.dot(cross, this.camDir);
            //console.log("square: ", this.camDir, dot);
            camera.getScreenPosition(this.s1, _1);
            camera.getScreenPosition(this.s2, _2);
            camera.getScreenPosition(this.s3, _3);
            camera.getScreenPosition(this.s4, _4);
            var ctx = this.canvas.getContext('2d');
            ctx.strokeStyle = "rgba(128,128,128,1)";
            if (dot > 0)
                //ctx.strokeStyle = "rgba(128,0,0,1)";
                return;
            this.points = [this.s1, this.s2, this.s3, this.s4];
            ctx.beginPath();
            ctx.moveTo(this.points[0][0], this.points[0][1]);
            for (var i = 0; i < this.points.length; i++) {
                ctx.lineTo(this.points[i][0], this.points[i][1]);
            }
            ctx.lineTo(this.points[0][0], this.points[0][1]);
            ctx.stroke();
            ctx.closePath();
        };
        return transformObjectView;
    }());
    qec.transformObjectView = transformObjectView;
})(qec || (qec = {}));
//# sourceMappingURL=built.js.map