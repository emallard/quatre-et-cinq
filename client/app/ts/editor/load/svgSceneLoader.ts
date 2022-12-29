module qec {
    export class svgSceneLoader {

        debug: boolean = false;
        PIXEL_SIZE = 3.779528;

        loadUrl(src: string, done: (sc: scSceneDTO) => void) {
            let req = new XMLHttpRequest();
            req.open('GET', src, true);
            req.onreadystatechange = () => {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        this.loadContent(req.responseText, done);
                    }
                    else {
                        console.error("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            req.send(null);
        }

        loadContent(content: string, done: (sc: scSceneDTO) => void): void {
            let parser = new DOMParser();
            let doc = parser.parseFromString(content, "image/svg+xml");
            let svgRootElement = doc.querySelector('svg');

            let scene = new scSceneDTO();
            scene.dtos = [];

            scene.dtos.push(...this.getCameras(svgRootElement));

            this.getSdFields(svgRootElement, (sdFieldsArray) => {
                scene.dtos.push(...sdFieldsArray);
                done(scene);
            });
        }

        getSdFields(elt: SVGGraphicsElement, done: (x: any[]) => void) {
            let all: sdFields2DTO[] = [];
            let groups = elt.querySelectorAll("g");
            let r: runAll = new runAll();
            groups.forEach(x => {
                if (this.getLabel(x) == "thickness") {
                    r.push(_done => this.getSdFieldsOne(x, (sdFields) => { all.push(sdFields); _done(); }));
                }
            });

            r.run(() => done(all));
        }

        getSdFieldsOne(thicknessElt: SVGGraphicsElement, done: (x: any) => void) {
            let parent = <SVGGraphicsElement>thicknessElt.parentNode;
            let svgId = this.getLabel(parent);

            console.log("getSdFieldsOne " + this.getLabel(parent));

            let src = this.extractSvgIgnoringThickness(parent);

            /*
            let sdFields = new sdFields1DTO();
            sdFields.topImage = new scImageDTO();
            sdFields.topImage.src = src;
            sdFields.topBounds = [];
            */


            let img = new Image();
            img.onload = () => {

                // real bounds
                console.log("img dimension : " + img.width + "," + img.height);
                let canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                let ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                let pixelBounds = this.getBoundingBoxInPx(canvas);
                let px = this.PIXEL_SIZE;
                let realBounds = [pixelBounds[0] / px, pixelBounds[1] / px, pixelBounds[2] / px, pixelBounds[3] / px];
                //console.log("bounding box dimension in pixels : ", realBounds);

                let parser = new DOMParser();
                let doc = parser.parseFromString(src, "image/svg+xml");
                let svgRootElement = doc.querySelector('svg');

                svgRootElement.setAttribute('viewBox', realBounds[0] + ' ' + realBounds[1] + ' ' + (realBounds[2] - realBounds[0]) + ' ' + (realBounds[3] - realBounds[1]));
                svgRootElement.setAttribute('width', (realBounds[2] - realBounds[0]) + 'mm');
                svgRootElement.setAttribute('height', (realBounds[3] - realBounds[1]) + 'mm');

                // (Debug) Show the extracted SVG:
                // document.body.appendChild(svgRootElement);

                let svg_xml = (new XMLSerializer()).serializeToString(svgRootElement);
                let topImage = new scImageDTO();
                topImage.src = "data:image/svg+xml;base64," + btoa(svg_xml);

                let cx = (realBounds[0] + realBounds[2]) / 2;
                let cy = (realBounds[1] + realBounds[3]) / 2;
                let halfWidth = (realBounds[2] - realBounds[0]) / 2;
                let halfHeight = (realBounds[3] - realBounds[1]) / 2;
                let topBounds = [-halfWidth, -halfHeight, halfWidth, halfHeight];
                let top: partTopDTO = { topImage: topImage, topBounds: topBounds };

                let transform = mat4.create();

                cy = this.toLeftHanded(cy, thicknessElt.ownerSVGElement.viewBox.baseVal.height);

                // height
                let heightElt = this.getByLabel(thicknessElt, 'height');
                let tspan = heightElt.children.item(0);
                let textContentSplit = tspan.textContent.split(',');
                let z = parseFloat(textContentSplit[0]);
                let height = parseFloat(textContentSplit[1]);

                // transform
                mat4.translate(transform, transform, vec3.fromValues(cx, cy, z));

                // material
                let color = this.getColorIgnoringThickness(parent);
                if (color == null)
                    color = [0.5, 0.5, 0.5];
                let material = {
                    type: 'materialDTO',
                    diffuse: color
                };

                // profile line in realBounds matrix
                let startElt = this.getByLabelCanBeNull(thicknessElt, "start");
                let radiusElt = this.getByLabelCanBeNull(thicknessElt, "radius");
                let borderFrameElt = this.getByLabelCanBeNull(thicknessElt, "border_frame");
                let skeletonElt = this.getByLabelCanBeNull(thicknessElt, "skeleton_in");

                if (startElt != null && borderFrameElt != null) {
                    let start = this.getXY(thicknessElt, "start");
                    let end = this.getXY(thicknessElt, "end");
                    start.y = this.toLeftHanded(start.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);
                    end.y = this.toLeftHanded(end.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);

                    start.x -= cx;
                    start.y -= cy;
                    end.x -= cx;
                    end.y -= cy;

                    let profileOrigin = [start.x, start.y];
                    let profileAxis = [end.x - start.x, end.y - start.y];

                    let width = vec2.length(new Float32Array(profileAxis));

                    let sdFields: sdFields2ProfileBorderDTO = {
                        type: sdFields2ProfileBorderDTO.TYPE,
                        svgId: svgId,
                        material: material,
                        transform: transform,
                        top: top,
                        profile: this.createProfile(thicknessElt, width, height),

                        profileOrigin: profileOrigin,
                        profileAxis: profileAxis,

                        border: this.createBorder(thicknessElt),
                    };
                    done(sdFields);
                }
                else if (startElt != null) {
                    let start = this.getXY(thicknessElt, "start");
                    let end = this.getXY(thicknessElt, "end");
                    start.y = this.toLeftHanded(start.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);
                    end.y = this.toLeftHanded(end.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);

                    start.x -= cx;
                    start.y -= cy;
                    end.x -= cx;
                    end.y -= cy;

                    let profileOrigin = [start.x, start.y];
                    let profileAxis = [end.x - start.x, end.y - start.y];
                    let width = vec2.length(new Float32Array(profileAxis));

                    let sdFields: sdFields2DTO = {
                        type: sdFields2DTO.TYPE,
                        svgId: svgId,
                        material: material,
                        transform: transform,

                        top: top,

                        profile: this.createProfile(thicknessElt, width, height),
                        profileOrigin: profileOrigin,
                        profileAxis: profileAxis,
                    };
                    done(sdFields);
                }
                else if (radiusElt != null) {
                    let radius = this.getXYR(thicknessElt, "radius");
                    radius.y = this.toLeftHanded(radius.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);
                    radius.x -= cx;
                    radius.y -= cy;

                    let width = radius.r;

                    let sdFields: sdFields2RadialDTO = {
                        type: sdFields2RadialDTO.TYPE,
                        svgId: svgId,
                        material: material,
                        transform: transform,

                        top: top,

                        profile: this.createProfile(thicknessElt, width, height),

                        center: [radius.x, radius.y],
                        radius: radius.r
                    };
                    done(sdFields);
                }
                else if (borderFrameElt != null) {
                    let sdFields: sdFields2BorderDTO = {
                        type: sdFields2BorderDTO.TYPE,
                        svgId: svgId,
                        top: top,
                        thickness: height,
                        border: this.createBorder(thicknessElt),

                        material: material,
                        transform: transform
                    }
                    done(sdFields);
                }
                else if (skeletonElt != null) {

                    this.createSkeleton(thicknessElt, _partSkeleton => {

                        let sdFields: sdFields2SkeletonDTO = {
                            type: sdFields2SkeletonDTO.TYPE,
                            svgId: svgId,
                            top: top,
                            profile: this.createProfile(thicknessElt, height, height),
                            skeleton: _partSkeleton,

                            material: material,
                            transform: transform
                        }
                        done(sdFields);
                    });
                }
                else {
                    let sdFields: sdFields1DTO = {
                        type: sdFields1DTO.TYPE,
                        svgId: svgId,
                        top: top,
                        thickness: height,
                        material: material,
                        transform: transform
                    }
                    done(sdFields);
                }
            }
            img.src = "data:image/svg+xml;base64," + btoa(src);
        }

        createProfile(thicknessElt: SVGGraphicsElement, width: number, height: number): partProfileDTO {
            let [profileSrc, profileBounds] = this.getFrame(thicknessElt, width, height, '');
            let profileImage = new scImageDTO();
            profileImage.src = "data:image/svg+xml;base64," + btoa(profileSrc);
            return {
                profileImage: profileImage,
                profileBounds: profileBounds,
            }
        }

        createBorder(thicknessElt: SVGGraphicsElement): partBorderDTO {
            // height
            let borderDimensionsElt = this.getByLabel(thicknessElt, 'border_dimensions');
            let borderDimensionstspan = borderDimensionsElt.children.item(0);
            let borderDimensionsTextContentSplit = borderDimensionstspan.textContent.split(',');
            let borderWidth = parseFloat(borderDimensionsTextContentSplit[0]);
            let borderHeight = parseFloat(borderDimensionsTextContentSplit[1]);
            let [borderSrc, borderBounds] = this.getFrame(thicknessElt, borderWidth, borderHeight, 'border_');
            let borderImage = new scImageDTO();
            borderImage.src = "data:image/svg+xml;base64," + btoa(borderSrc);

            return {
                borderImage: borderImage,
                borderBounds: borderBounds,
            }
        }

        createSkeleton(
            thicknessElt: SVGGraphicsElement,
            done: (part: partSkeletonDTO) => void) {

            // clone/extract
            let [outSvg, outG, outElt] = this.copySvgAndKeepOnly(this.getByLabel(thicknessElt, "skeleton_out"));
            let [inSvg, inG, inElt] = this.copySvgAndKeepOnly(this.getByLabel(thicknessElt, "skeleton_in"));

            // change stroke to fill
            outElt.style.stroke = 'none';
            outElt.style.fill = 'black';
            //outElt.removeAttribute('stroke');
            //outElt.setAttribute('fill', 'black');

            this.getBoundingBoxInMm(outSvg, outBounds => {

                let outSrc = this.isolate(outSvg, outBounds);
                let inSrc = this.isolate(inSvg, outBounds);

                let halfWidth = (outBounds[2] - outBounds[0]) / 2;
                let halfHeight = (outBounds[3] - outBounds[1]) / 2;
                let centeredBounds = [-halfWidth, -halfHeight, halfWidth, halfHeight];

                let part: partSkeletonDTO = {
                    inImage: inSrc,
                    inBounds: centeredBounds,
                    outImage: outSrc,
                    outBounds: centeredBounds
                }
                done(part);
            });
        }

        isolate(svg: SVGSVGElement, realBounds: number[]): string {

            /*
            let parser = new DOMParser();
            let doc = parser.parseFromString(src, "image/svg+xml");
            let svgRootElement = doc.querySelector('svg');*/
            let svgRootElement = svg;
            svgRootElement.setAttribute('viewBox', realBounds[0] + ' ' + realBounds[1] + ' ' + (realBounds[2] - realBounds[0]) + ' ' + (realBounds[3] - realBounds[1]));
            svgRootElement.setAttribute('width', (realBounds[2] - realBounds[0]) + 'mm');
            svgRootElement.setAttribute('height', (realBounds[3] - realBounds[1]) + 'mm');

            // (Debug) Show the extracted SVG:
            // document.body.appendChild(svgRootElement);

            let isolated_svg_xml = (new XMLSerializer()).serializeToString(svgRootElement);
            let isolated_src = "data:image/svg+xml;base64," + btoa(isolated_svg_xml);
            return isolated_src;
            /*
            let halfWidth = (realBounds[2] - realBounds[0]) / 2;
            let halfHeight = (realBounds[3] - realBounds[1]) / 2;
            let topBounds = [-halfWidth, -halfHeight, halfWidth, halfHeight];

            return [isolated_src, topBounds];
            */
        }

        createSvgFromPoints(width: number, height: number, points: number[]): string {
            let widthAndHeight = 'width="' + width + '" height="' + height + '"';
            let viewbox = 'viewbox="0 0 ' + width + ' ' + height + '"';

            let pointy = height - points[1];
            let path = 'M ' + points[0] + ' ' + pointy + ' ';
            for (let i = 0; i < points.length; i += 2) {
                pointy = height - points[i + 1];
                path = path + 'L ' + points[i] + ' ' + pointy + ' ';
            }
            path = path + 'Z';

            let text = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
                + '<svg '
                + ' xmlns:svg="http://www.w3.org/2000/svg" '
                + ' xmlns="http://www.w3.org/2000/svg" '
                + ' xmlns:xlink="http://www.w3.org/1999/xlink" '
                + ' ' + widthAndHeight
                + ' ' + viewbox
                + '><g>\n'
                + '<path d="' + path + '" fill="black"'
                + '/>'
                + '\n</g></svg>';

            if (this.debug) {
                let doc = new DOMParser().parseFromString(text, "image/svg+xml");
                let svgRootElement = doc.querySelector('svg');
                document.body.append(svgRootElement);
            }

            return text;
        }

        getBoundingBoxInMm(svg: SVGSVGElement, done: (bounds: number[]) => void) {
            let src = (new XMLSerializer()).serializeToString(svg);

            let img = new Image();
            img.onload = () => {

                // real bounds
                console.log("img dimension : " + img.width + "," + img.height);
                let canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                let ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                let pixelBounds = this.getBoundingBoxInPx(canvas);
                let px = this.PIXEL_SIZE;
                let realBounds = [pixelBounds[0] / px, pixelBounds[1] / px, pixelBounds[2] / px, pixelBounds[3] / px];
                //console.log("bounding box dimension in pixels : ", realBounds);

                done(realBounds);
            }
            img.src = "data:image/svg+xml;base64," + btoa(src);
        }

        getBoundingBoxInPx(canvas: HTMLCanvasElement): number[] {
            let ctx = canvas.getContext('2d');
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let bounds = [0, 0, 0, 0];
            let first = true;
            for (let i = 0; i < imageData.width; ++i) {
                for (let j = 0; j < imageData.height; ++j) {
                    let q = 4 * (i + j * imageData.width);
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

            bounds[0] -= 2;
            bounds[1] -= 2;
            bounds[2] += 2;
            bounds[3] += 2;
            return bounds;
        }

        getCameras(svg: SVGSVGElement): cameraDTO[] {
            let cameras: cameraDTO[] = [];
            let groups = svg.querySelectorAll("g");
            groups.forEach(x => {

                let label = this.getLabel(x);
                if (label.indexOf("camera") == 0) {
                    let cam = new cameraDTO();
                    cam.position = this.getXYZByLabel(x, 'position');
                    cam.target = this.getXYZByLabel(x, 'target');

                    cam.position[1] = this.toLeftHanded(cam.position[1], svg.viewBox.baseVal.height);
                    cam.target[1] = this.toLeftHanded(cam.target[1], svg.viewBox.baseVal.height);

                    cam.up = [0, 0, 1];
                    cameras.push(cam);
                }

            });
            return cameras;
        }

        toLeftHanded(y: number, height: number) {
            //return y;
            return height - y;
        }

        getXYZByLabel(elt: SVGGraphicsElement, name: string): number[] {
            let values = this.getXYDescByLabel(elt, name);
            if (values[2] == null || values[2]['z'] == null)
                values[2] = 0;
            else
                values[2] = values[2]['z'];
            return values;
        }

        getXYZThicknessByLabel(elt: SVGGraphicsElement, name: string): XYZThickness {
            let o = this.getXYDescByLabel(elt, name);
            return {
                x: o[0],
                y: o[1],
                z: o[2]['z'],
                thickness: o[2]['thickness']
            }
        }

        getXYPoints(elt: SVGGraphicsElement, name: string): XYPoints {
            let o = this.getXYDescByLabel(elt, name);
            return {
                x: o[0],
                y: o[1],
                points: o[2]['points']
            }
        }

        getXY(elt: SVGGraphicsElement, name: string): XY {
            let o = this.getXYDescByLabel(elt, name);
            return {
                x: o[0],
                y: o[1]
            }
        }

        getXYDescByLabel(elt: SVGGraphicsElement, name: string): [number, number, any] {
            let positionElt = this.getByLabel(elt, name);
            let descs = positionElt.getElementsByTagName("desc");
            let z = 0;
            let desc: any = null;
            if (descs.length > 0) {
                let positionDesc = descs.item(0);
                let json = '{' + positionDesc.textContent + '}';
                console.log('desc json : ', json);
                desc = JSON.parse(json);
            }

            let cx = parseFloat(positionElt.getAttribute('cx'));
            let cy = parseFloat(positionElt.getAttribute('cy'));
            let p = elt.ownerSVGElement.createSVGPoint();
            p.x = cx;
            p.y = cy;

            while (!(elt instanceof SVGSVGElement)) {
                let trans = elt.transform.baseVal.consolidate();
                if (trans != null)
                    p = p.matrixTransform(trans.matrix);
                elt = <SVGGraphicsElement>elt.parentNode;
            }

            //let ctm = positionElt.getScreenCTM();
            //let p2 = ctm.transformPoint(p);
            return [p.x, p.y, desc];
        }

        getXYR(elt: SVGGraphicsElement, name: string): XYR {
            let positionElt = this.getByLabel(elt, name);

            let cx = parseFloat(positionElt.getAttribute('cx'));
            let cy = parseFloat(positionElt.getAttribute('cy'));
            let rx = parseFloat(positionElt.getAttribute('rx'));
            let p = elt.ownerSVGElement.createSVGPoint();
            p.x = cx;
            p.y = cy;

            let r = elt.ownerSVGElement.createSVGPoint();
            r.x = p.x + rx;
            r.y = p.y;

            while (!(elt instanceof SVGSVGElement)) {
                let trans = elt.transform.baseVal.consolidate();
                if (trans != null) {
                    p = p.matrixTransform(trans.matrix);
                    r = r.matrixTransform(trans.matrix);
                }
                elt = <SVGGraphicsElement>elt.parentNode;
            }

            return { x: p.x, y: p.y, r: vec2.length(vec2.fromValues(r.x - p.x, r.y - p.y)) };
        }

        getFrame(eltThickness: SVGGraphicsElement, width: number, height: number, prefix: string): [string, number[]] {
            let frameElt = this.getByLabel(eltThickness, prefix + 'frame');


            let origin = frameElt.ownerSVGElement.createSVGPoint();
            origin.x = parseFloat(frameElt.getAttribute('x'));
            origin.y = parseFloat(frameElt.getAttribute('y'));

            let w = frameElt.ownerSVGElement.createSVGPoint();
            w.x = origin.x + parseFloat(frameElt.getAttribute('width'));
            w.y = origin.y + 0;

            let h = frameElt.ownerSVGElement.createSVGPoint();
            h.x = origin.x + 0;
            h.y = origin.y + parseFloat(frameElt.getAttribute('height'));

            while (!(frameElt instanceof SVGSVGElement)) {
                let trans = frameElt.transform.baseVal.consolidate();
                if (trans != null) {
                    origin = origin.matrixTransform(trans.matrix);
                    w = w.matrixTransform(trans.matrix);
                    h = h.matrixTransform(trans.matrix);
                }
                frameElt = <SVGGraphicsElement>frameElt.parentNode;
            }

            let shapeElt = this.getByLabel(eltThickness, prefix + 'shape');
            let [clonedRoot, clonedGroup] = this.extractIgnoringThickness(shapeElt);

            let matrix = clonedRoot.createSVGMatrix();
            matrix.e = origin.x;
            matrix.f = origin.y;
            matrix.a = (w.x - origin.x) / width;
            matrix.b = (w.y - origin.y) / width;
            matrix.c = (h.x - origin.x) / height;
            matrix.d = (h.y - origin.y) / height;
            matrix = matrix.inverse();

            let transform = clonedRoot.createSVGTransformFromMatrix(matrix);
            clonedGroup.transform.baseVal.appendItem(transform);


            clonedRoot.setAttribute('width', '' + width + 'mm');
            clonedRoot.setAttribute('height', '' + height + 'mm');
            clonedRoot.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
            let svg_xml = (new XMLSerializer()).serializeToString(clonedRoot);
            //console.log("frame SVG");
            //console.log(svg_xml);
            return [svg_xml, [0, 0, width, height]];
        }
        parsePoint(pt: DOMPoint, s: string, rel: DOMPoint) {
            if (rel != null) {
                pt.x = rel.x;
                pt.y = rel.y;
            }

            let nums = s.split(',');
            pt.x += parseFloat(nums[0]);
            pt.y += parseFloat(nums[1]);
        }

        getByLabel(elt: SVGGraphicsElement, name: string): SVGGraphicsElement {
            let found = this.getByLabelCanBeNull(elt, name);
            if (found == null)
                throw new Error("label not found : " + name);
            return found;
        }

        getByLabelCanBeNull(elt: SVGGraphicsElement, name: string): SVGGraphicsElement {
            let found: SVGGraphicsElement;
            elt.childNodes.forEach(x => {
                let attributes = (<SVGGraphicsElement>x).attributes;
                if (attributes != null) {
                    let attr = attributes.getNamedItem('inkscape:label');
                    if (attr != null && attr.textContent == name) {
                        found = (<SVGGraphicsElement>x);
                    }
                }
            });
            return found;
        }

        getLabel(elt: SVGGraphicsElement): string {
            let attributes = elt.attributes;
            if (attributes != null) {
                let attr = attributes.getNamedItem('inkscape:label');
                if (attr != null)
                    return attr.textContent;
            }
            return null;
        }

        ///////

        extractSvgIgnoringThickness(elt: SVGGraphicsElement): string {
            let [clonedRoot, g] = this.extractIgnoringThickness(elt);
            let svg_xml = (new XMLSerializer()).serializeToString(clonedRoot);
            return svg_xml;
        }

        extractIgnoringThickness(elt: SVGGraphicsElement): [SVGSVGElement, SVGGElement] {
            let current = elt;
            let chain: SVGGraphicsElement[] = [];
            while (current != null) {
                chain.push(current);
                if (current instanceof SVGSVGElement)
                    break;
                current = <SVGGraphicsElement>current.parentNode;
            }

            let clonedRoot = <SVGSVGElement>chain[chain.length - 1].cloneNode(false);
            let cloned = <SVGGraphicsElement>clonedRoot;


            let g = clonedRoot.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g");
            cloned.appendChild(g);
            cloned = g;

            for (let i = chain.length - 2; i >= 0; --i) {
                let newCloned = <SVGGraphicsElement>chain[i].cloneNode(false);
                cloned.appendChild(newCloned);
                cloned = newCloned;
            }

            elt.childNodes.forEach(x => {
                if (this.getLabel(<SVGGraphicsElement>x) != 'thickness') {
                    cloned.appendChild(x.cloneNode(true));
                }
            });

            return [clonedRoot, g];
        }

        getColorIgnoringThickness(elt: SVGGraphicsElement): number[] {
            let style = elt.getAttribute('style');
            if (style != null) {
                let col = '';
                let i = style.indexOf('fill:');
                if (i >= 0) {
                    col = style.substring(i + 5, i + 5 + 7);
                }
                else {
                    i = style.indexOf('stroke:');
                    if (i >= 0) {
                        col = style.substring(i + 7, i + 7 + 7);
                    }
                }

                if (col != '') {
                    let rgb = this.hexToRgb(col);
                    if (rgb != null)
                        return rgb;
                }
            }

            for (let i = 0; i < elt.childNodes.length; ++i) {
                let child = elt.childNodes.item(i);
                if (child instanceof SVGGraphicsElement) {
                    if (this.getLabel(child) != 'thickness') {
                        let childColor = this.getColorIgnoringThickness(child);
                        if (childColor != null)
                            return childColor;
                    }
                }
            }

            return null;
        }

        copySvgAndKeepOnly(elt: SVGGraphicsElement): [SVGSVGElement, SVGGElement, SVGGraphicsElement] {
            let current = elt;
            let chain: SVGGraphicsElement[] = [];
            while (current != null) {
                chain.push(current);
                if (current instanceof SVGSVGElement)
                    break;
                current = <SVGGraphicsElement>current.parentNode;
            }

            let clonedRoot = <SVGSVGElement>chain[chain.length - 1].cloneNode(false);
            let cloned = <SVGGraphicsElement>clonedRoot;


            let g = clonedRoot.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g");
            cloned.appendChild(g);
            cloned = g;

            for (let i = chain.length - 2; i >= 0; --i) {
                let deep = (i == 0);
                let newCloned = <SVGGraphicsElement>chain[i].cloneNode(deep);
                cloned.appendChild(newCloned);
                cloned = newCloned;
            }

            return [clonedRoot, g, cloned];
        }

        private hexToRgb(hex): number[] {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });

            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16) / 255,
                parseInt(result[2], 16) / 255,
                parseInt(result[3], 16) / 255
            ] : null;
        }
    }

    interface XYZThickness {
        x: number;
        y: number;
        z: number;
        thickness: number;
    }

    interface XYPoints {
        x: number;
        y: number;
        points: number[];
    }

    interface XY {
        x: number;
        y: number;
    }

    interface XYR {
        x: number;
        y: number;
        r: number;
    }
}