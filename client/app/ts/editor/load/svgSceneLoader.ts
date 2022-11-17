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

        getSdFieldsOne(x: SVGGraphicsElement, done:(x:sdFields2DTO)=>void)
        {
            let parent = <SVGGraphicsElement> x.parentNode;

            console.log("getSdFieldsOne " + this.getLabel(parent));

            let src = this.extractSvgIgnoringThickness(parent);

            let sdFields = new sdFields2DTO();
            sdFields.topImage = new scImageDTO();
            sdFields.topImage.src = src;
            sdFields.topBounds = [];

            let canvas = document.createElement('canvas');

            let img = new Image();
            img.onload = () => {
                
                // real bounds
                console.log("img dimension : " + img.width + "," + img.height);
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

                cy = this.toLeftHanded(cy, x.ownerSVGElement.viewBox.baseVal.height);
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
                let start = this.getXYPoints(x, "start");
                let end = this.getXY(x, "end");
    
                // thickness
                //sdFields.thickness = start[2];
                start.x -= realBounds[0];
                start.y -= realBounds[1];
                end.x -= realBounds[0];
                end.y -= realBounds[1];

                /*
                let normal = vec3.create();
                let vec1 = vec3.fromValues(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
                let vec2 = vec3.fromValues(end[1] - start[1], end[0] - start[0], end[2] - start[2]);
                vec3.cross(normal, vec1, vec2);
                */
                
                sdFields.profileOrigin = [start.x, start.y];
                sdFields.profileAxis = [end.x - start.x, end.y - start.y];

                let width = vec2.length(new Float32Array(sdFields.profileAxis));

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

                sdFields.profileImage = new scImageDTO();
                sdFields.profileImage.src = "data:image/svg+xml;base64," + btoa(svgForProfile);
                sdFields.profileBounds = [0, 0, width, height];

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

            //let transformList = new SVGTransformList();
            
            //const translate = clonedRoot.ownerSVGElement.createSVGTransform();
            //let accumulated = clonedRoot.transform.baseVal.getItem(0).matrix;
            for (let i=chain.length-2; i>=0; --i)
            {
                let newCloned = <SVGGraphicsElement> chain[i].cloneNode(false);
                cloned.appendChild(newCloned);
                cloned = newCloned;

                // for (let k=0; k < cloned.transform.baseVal.length; ++k)
                // {
                //     transformList.appendItem(cloned.transform.baseVal.getItem(k));
                // }
            }

            elt.childNodes.forEach(x => {
                if (this.getLabel(<SVGGraphicsElement> x) != 'thickness')
                {
                    cloned.appendChild(x.cloneNode(true));
                }
            });

            //let eltCloned = elt.cloneNode(true);

            /*
            let rect = cloned.getBoundingClientRect();
            console.log(rect);
            clonedRoot.setAttribute('viewBox', ''+rect.x + ' ' + rect.y + ' ' + rect.width + ' ' + rect.height+'')
            */

            /*
            console.log(boundingBox);
            // make the bbox rect element have the same user units even though it's the last child of the root element
            let bottomLeft = transformList.consolidate().matrix.transformPoint({x: boundingBox.bottom, y: boundingBox.left});
            let bottomRight = transformList.consolidate().matrix.transformPoint({x: boundingBox.bottom, y: boundingBox.left});
            let topRight = transformList.consolidate().matrix.transformPoint({x: boundingBox.top, y: boundingBox.right});
            let topLeft = transformList.consolidate().matrix.transformPoint({x: boundingBox.top, y: boundingBox.right});
            console.log(topRight);
            console.log(bottomLeft);

            //document.body.removeChild(clonedRoot);
            */

            var svg_xml = (new XMLSerializer()).serializeToString(clonedRoot);
            return svg_xml;
        }

        getColorIgnoringThickness(elt:SVGGraphicsElement): number[] {
            var style = elt.getAttribute('style');
            if (style != null)
            {
                var i = style.indexOf('fill:');
                if (i >= 0) {
                    var col = style.substring(i + 5, i + 5 + 7);
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
}