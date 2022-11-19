module qec {
    export class svgSceneLoader {

        debug:boolean = false;

        loadUrl(src:string, done: (sc:scSceneDTO) => void) {
            var req = new XMLHttpRequest();
            req.open('GET', src, true);
            req.onreadystatechange = () => {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        let sc = this.loadContent(req.responseText, done);
                    }
                    else {
                        console.error("Erreur pendant le chargement de la page.\n");
                    }
                }
            };
            req.send(null);
        }

        loadContent(content:string, done: (sc:scSceneDTO) => void)
        {
            let parser = new DOMParser();
            let doc = parser.parseFromString(content, "image/svg+xml");
            let svgRootElement = doc.querySelector('svg');

            let scene = new scSceneDTO()
            {

            }

            scene.cameras = this.getCameras(svgRootElement);

            this.getSdFields(svgRootElement, (sdFieldsArray) => { 
                scene.objects = sdFieldsArray; 
                done(scene);
            });
            
            return scene;
        }

        getSdFields(elt: SVGGraphicsElement, done:(x:sdFields2DTO[])=>void)
        {
            let all:sdFields2DTO[] = [];
            let groups = elt.querySelectorAll("g");
            let r:runAll = new runAll();
            groups.forEach(x => {
                if (this.getLabel(x) == "thickness")
                {
                    r.push(_done => this.getSdFieldsOne(x, (sdFields) => { all.push(sdFields); _done();}));
                }
            });

            r.run(() => done(all));
        }

        getSdFieldsOne(thicknessElt: SVGGraphicsElement, done:(x:sdFields2DTO)=>void)
        {
            let parent = <SVGGraphicsElement> thicknessElt.parentNode;

            console.log("getSdFieldsOne " + this.getLabel(parent));

            let src = this.extractSvgIgnoringThickness(parent);

            let sdFields = new sdFields2DTO();
            sdFields.topImage = new scImageDTO();
            sdFields.topImage.src = src;
            sdFields.topBounds = [];


            let img = new Image();
            img.onload = () => {
                
                // real bounds
                console.log("img dimension : " + img.width + "," + img.height);
                let canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                let pixelBounds = this.getBoundingBoxInPx(canvas);
                let px = 3.779528;
                let realBounds = [pixelBounds[0]/px, pixelBounds[1]/px, pixelBounds[2]/px, pixelBounds[3]/px];
                //console.log("bounding box dimension in pixels : ", realBounds);

                let parser = new DOMParser();
                let doc = parser.parseFromString(src, "image/svg+xml");
                let svgRootElement = doc.querySelector('svg');

                svgRootElement.setAttribute('viewBox', realBounds[0]+' '+realBounds[1]+' '+(realBounds[2]-realBounds[0])+' '+(realBounds[3]-realBounds[1]));
                svgRootElement.setAttribute('width', (realBounds[2]-realBounds[0])+'mm');
                svgRootElement.setAttribute('height', (realBounds[3]-realBounds[1])+'mm');

                // (Debug) Show the extracted SVG:
                // document.body.appendChild(svgRootElement);

                var svg_xml = (new XMLSerializer()).serializeToString(svgRootElement);
                sdFields.topImage = new scImageDTO();
                sdFields.topImage.src = "data:image/svg+xml;base64," + btoa(svg_xml);

                let cx = (realBounds[0]+realBounds[2])/2;
                let cy = (realBounds[1]+realBounds[3])/2;
                let halfWidth = (realBounds[2]-realBounds[0])/2;
                let halfHeight = (realBounds[3]-realBounds[1])/2;
                sdFields.topBounds = [-halfWidth, -halfHeight, halfWidth, halfHeight];
                sdFields.transform = mat4.create();

                cy = this.toLeftHanded(cy, thicknessElt.ownerSVGElement.viewBox.baseVal.height);
                mat4.translate(sdFields.transform , sdFields.transform, vec3.fromValues(cx, cy, 0));

                // material
                let color = this.getColorIgnoringThickness(parent);
                if (color == null)
                    color = [0.5, 0.5, 0.5];
                sdFields.material = {
                    type:'materialDTO',
                    diffuse : color
                };

                // profile line in realBounds matrix
                let width = 0;
                let startElt = this.getByLabel(thicknessElt, "start");
                if (startElt != null)
                {
                    let start = this.getXY(thicknessElt, "start");
                    let end = this.getXY(thicknessElt, "end");
                    start.y = this.toLeftHanded(start.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);
                    end.y = this.toLeftHanded(end.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);

                    start.x -= cx;
                    start.y -= cy;
                    end.x -= cx;
                    end.y -= cy;
                    
                    sdFields.profileOrigin = [start.x, start.y];
                    sdFields.profileAxis = [end.x - start.x, end.y - start.y];

                    width = vec2.length(new Float32Array(sdFields.profileAxis));
                }
                else
                {
                    let radius = this.getXYR(thicknessElt, "radius");
                    radius.y = this.toLeftHanded(radius.y, thicknessElt.ownerSVGElement.viewBox.baseVal.height);
                    radius.x -= cx;
                    radius.y -= cy;

                    sdFields.isRadial = true;
                    sdFields.radius = radius.r;
                    sdFields.profileOrigin = [radius.x, radius.y];

                    width = sdFields.radius;
                }
                
                // height
                let heightElt = this.getByLabel(thicknessElt, 'height');
                let tspan = heightElt.children.item(0);
                let height = parseFloat(tspan.textContent);

                /*
                let height = 0;
                let profilePoints = [];
                for (let i=0; i<start.points.length; i+=2)
                {
                    let x = start.points[i] * width;
                    let y = start.points[i+1];
                    profilePoints.push(x, y);
                    if (y > height)
                        height = y;
                }

                let svgForProfile = this.createSvgFromPoints(Math.ceil(width), Math.ceil(height), profilePoints);
                */
                
                let [profileSrc, profileBounds] = this.getFrame(thicknessElt, width, height);
                
                sdFields.profileImage = new scImageDTO();
                sdFields.profileImage.src = "data:image/svg+xml;base64," + btoa(profileSrc);
                sdFields.profileBounds = profileBounds;

                done(sdFields);
            }
            img.src = "data:image/svg+xml;base64," + btoa(src);
        }

        createSvgFromPoints(width:number, height: number, points:number[]):string
        {
            var widthAndHeight = 'width="' + width + '" height="' + height + '"';
            var viewbox = 'viewbox="0 0 ' + width + ' ' + height + '"';

            let pointy = height - points[1];
            var path ='M ' + points[0] + ' ' + pointy + ' ';
            for (let i=0; i< points.length; i+=2)
            {
                pointy = height - points[i+1];
                path = path + 'L ' + points[i] + ' ' + pointy + ' ';
            }
            path = path + 'Z';

            var text = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
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
            
            if (this.debug)
            {
                let doc = new DOMParser().parseFromString(text, "image/svg+xml");
                let svgRootElement = doc.querySelector('svg');
                document.body.append(svgRootElement);
            }
            
            return text;
        }

        getBoundingBoxInPx(canvas:HTMLCanvasElement): number[] {
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

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

            bounds[0] -= 2;
            bounds[1] -= 2;
            bounds[2] += 2;
            bounds[3] += 2;
            return bounds;
        }

        getCameras(svg: SVGSVGElement): cameraDTO[]
        {
            let cameras:cameraDTO[] = [];
            let groups = svg.querySelectorAll("g");
            groups.forEach(x => {
                
                let label = this.getLabel(x);
                if (label.indexOf("camera") == 0)
                {
                    let cam = new cameraDTO() ;
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

        toLeftHanded(y:number, height:number)
        {
            //return y;
            return height - y;
        }

        getXYZByLabel(elt:SVGGraphicsElement, name:string) : number[]
        {
            let values = this.getXYDescByLabel(elt, name);
            if (values[2] == null || values[2]['z'] == null)
                values[2] = 0;
            else
                values[2] = values[2]['z'];
            return values;
        }

        getXYZThicknessByLabel(elt:SVGGraphicsElement, name:string) : XYZThickness
        {
            let o = this.getXYDescByLabel(elt, name);
            return {
                x: o[0],
                y: o[1],
                z: o[2]['z'],
                thickness:o[2]['thickness']
            }
        }

        getXYPoints(elt:SVGGraphicsElement, name:string) : XYPoints
        {
            let o = this.getXYDescByLabel(elt, name);
            return {
                x: o[0],
                y: o[1],
                points: o[2]['points']
            }
        }

        getXY(elt:SVGGraphicsElement, name:string) : XY
        {
            let o = this.getXYDescByLabel(elt, name);
            return {
                x: o[0],
                y: o[1]
            }
        }

        getXYDescByLabel(elt:SVGGraphicsElement, name:string) : [number, number, any]
        {
            let positionElt = this.getByLabel(elt, name);
            var descs = positionElt.getElementsByTagName("desc");
            let z = 0;
            let desc:any = null;
            if (descs.length > 0)
            {
                let positionDesc =  descs.item(0);
                let json = '{' + positionDesc.textContent + '}';
                console.log('desc json : ', json);
                desc = JSON.parse(json);
            }
            
            let cx = parseFloat(positionElt.getAttribute('cx'));
            let cy = parseFloat(positionElt.getAttribute('cy'));
            let p = elt.ownerSVGElement.createSVGPoint();
            p.x = cx;
            p.y = cy;

            while (!(elt instanceof SVGSVGElement))
            {
                let trans = elt.transform.baseVal.consolidate();
                if (trans != null)
                    p = p.matrixTransform(trans.matrix);
                elt = <SVGGraphicsElement> elt.parentNode;
            }
            
            //let ctm = positionElt.getScreenCTM();
            //let p2 = ctm.transformPoint(p);
            return [p.x, p.y, desc];
        }

        getXYR(elt:SVGGraphicsElement, name:string) : XYR
        {
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

            while (!(elt instanceof SVGSVGElement))
            {
                let trans = elt.transform.baseVal.consolidate();
                if (trans != null)
                {
                    p = p.matrixTransform(trans.matrix);
                    r = r.matrixTransform(trans.matrix);
                }
                elt = <SVGGraphicsElement> elt.parentNode;
            }

            return {x: p.x, y:p.y, r: vec2.length(vec2.fromValues(r.x-p.x, r.y-p.y))};
        }

        getFrame(eltThickness:SVGGraphicsElement, width:number, height:number) : [string, number[]]
        {
            let frameElt = this.getByLabel(eltThickness, 'frame');


            let origin = frameElt.ownerSVGElement.createSVGPoint();
            origin.x = parseFloat(frameElt.getAttribute('x'));
            origin.y = parseFloat(frameElt.getAttribute('y'));

            let w = frameElt.ownerSVGElement.createSVGPoint();
            w.x = origin.x + parseFloat(frameElt.getAttribute('width'));
            w.y = origin.y + 0;

            let h = frameElt.ownerSVGElement.createSVGPoint();
            h.x = origin.x + 0;
            h.y = origin.y + parseFloat(frameElt.getAttribute('height'));
            
            while (!(frameElt instanceof SVGSVGElement))
            {
                let trans = frameElt.transform.baseVal.consolidate();
                if (trans != null)
                {
                    origin = origin.matrixTransform(trans.matrix);
                    w = w.matrixTransform(trans.matrix);
                    h = h.matrixTransform(trans.matrix);
                }
                frameElt = <SVGGraphicsElement> frameElt.parentNode;
            }
            
            let shapeElt = this.getByLabel(eltThickness, 'shape');
            let [clonedRoot, clonedGroup] = this.extractIgnoringThickness(shapeElt);

            let matrix = clonedRoot.createSVGMatrix();
            matrix.e = origin.x;
            matrix.f = origin.y;
            matrix.a = (w.x - origin.x)/width;
            matrix.b = (w.y - origin.y)/width;
            matrix.c = (h.x - origin.x)/height;
            matrix.d = (h.y - origin.y)/height;
            matrix = matrix.inverse();

            let transform = clonedRoot.createSVGTransformFromMatrix(matrix);
            clonedGroup.transform.baseVal.appendItem(transform);

            
            clonedRoot.setAttribute('width', ''+width+'mm');
            clonedRoot.setAttribute('height', ''+height+'mm');
            clonedRoot.setAttribute('viewBox', '0 0 '+ width + ' ' + height);
            var svg_xml = (new XMLSerializer()).serializeToString(clonedRoot);
            console.log("profile SVG");
            console.log(svg_xml);
            return [svg_xml, [0, 0, width, height]];
        }
        parsePoint(pt:DOMPoint, s:string, rel:DOMPoint)
        {
            if (rel != null)
            {
                pt.x = rel.x;
                pt.y = rel.y;
            }

            let nums = s.split(',');
            pt.x += parseFloat(nums[0]);
            pt.y += parseFloat(nums[1]);
        }

        getByLabel(elt:SVGGraphicsElement, name:string) : SVGGraphicsElement
        {
            let found:SVGGraphicsElement;
            elt.childNodes.forEach(x => {
                let attributes = (<SVGGraphicsElement> x).attributes;
                if (attributes != null)
                {
                    let attr = attributes.getNamedItem('inkscape:label');
                    if (attr != null && attr.textContent == name)
                    {
                        found = (<SVGGraphicsElement> x);
                    }
                }
            });
            return found;
        }

        getLabel(elt:SVGGraphicsElement):string
        {
            let attributes = elt.attributes;
            if (attributes != null)
            {
                let attr = attributes.getNamedItem('inkscape:label');
                if (attr != null)
                    return attr.textContent;
            }
            return null;
        }

        ///////

        extractSvgIgnoringThickness(elt: SVGGraphicsElement):string
        {
            let [clonedRoot, g] = this.extractIgnoringThickness(elt);
            var svg_xml = (new XMLSerializer()).serializeToString(clonedRoot);
            return svg_xml;
        }

        extractIgnoringThickness(elt: SVGGraphicsElement):[SVGSVGElement, SVGGElement]
        {
            let current = elt;
            let chain:SVGGraphicsElement[] = [];
            while (current != null)
            {
                chain.push(current);
                if (current instanceof SVGSVGElement)
                    break;
                current = <SVGGraphicsElement> current.parentNode;
            }
            
            let clonedRoot = <SVGSVGElement> chain[chain.length-1].cloneNode(false);
            let cloned = <SVGGraphicsElement> clonedRoot;

            
            let g = clonedRoot.ownerDocument.createElementNS("http://www.w3.org/2000/svg","g");
            cloned.appendChild(g);
            cloned = g;

            for (let i=chain.length-2; i>=0; --i)
            {
                let newCloned = <SVGGraphicsElement> chain[i].cloneNode(false);
                cloned.appendChild(newCloned);
                cloned = newCloned;
            }

            elt.childNodes.forEach(x => {
                if (this.getLabel(<SVGGraphicsElement> x) != 'thickness')
                {
                    cloned.appendChild(x.cloneNode(true));
                }
            });

            return [clonedRoot, g];
        }

        getColorIgnoringThickness(elt:SVGGraphicsElement): number[] {
            var style = elt.getAttribute('style');
            if (style != null)
            {
                let col = '';
                var i = style.indexOf('fill:');
                if (i >= 0) {
                    col = style.substring(i + 5, i + 5 + 7);
                }
                else
                {
                    i = style.indexOf('stroke:');
                    if (i >= 0) {
                        col = style.substring(i + 7, i + 7 + 7);
                    }
                }
                
                if (col != '') {
                    var rgb = this.hexToRgb(col);
                    if (rgb != null)
                        return rgb;
                }
            }
            else
            {
                for (let i=0; i<elt.childNodes.length; ++i)
                {
                    let child = elt.childNodes.item(i);
                    if (child instanceof SVGGraphicsElement)
                    {
                        if (this.getLabel(child) != 'thickness')
                        {
                            let childColor = this.getColorIgnoringThickness(child);
                            if (childColor != null)
                            return childColor;
                        }
                    }
                }
            }
            return null;
        }

        private hexToRgb(hex): number[] {
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
        }
    }

    interface XYZThickness{
        x:number;
        y:number;
        z:number;
        thickness:number;
    }

    interface XYPoints{
        x:number;
        y:number;
        points:number[];
    }

    interface XY{
        x:number;
        y:number;
    }

    interface XYR{
        x:number;
        y:number;
        r:number;
    }
}