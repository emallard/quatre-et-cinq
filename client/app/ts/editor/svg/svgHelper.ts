module qec {
    export class svgHelper {
        imgWidth: number;
        imgHeight: number;
        contentSvg: string;
        svgRootElement: HTMLElement;
        layers: SVGElement[];
        elements: SVGElement[];
        elementsId: string[];
        canvas = document.createElement('canvas');
        canvas2 = document.createElement('canvas');

        setSvg(content: string, done: () => void) {
            //document.body.appendChild(this.canvas);
            this.contentSvg = content;

            var parser = new DOMParser();
            var doc = parser.parseFromString(content, "image/svg+xml");
            this.svgRootElement = doc.documentElement;

            this.layers = this.findLayers(this.svgRootElement);

            this.elements = [];
            this.layers.forEach(l => this.getAllElementsInLayer(l, this.elements));
            this.elementsId = this.elements.map(e => e.getAttribute('id'));

            var img = new Image();
            img.onload = () => {
                this.imgWidth = img.width;
                this.imgHeight = img.height;
                console.log("img dimension : " + this.imgWidth + "," + this.imgHeight);
                done();
            }
            img.src = "data:image/svg+xml;base64," + btoa(this.contentSvg);

        }

        getElementsId(): string[] {
            return this.elementsId;
        }

        currentId: string;
        drawOnly(id: string, done: () => void) {
            this.currentId = id;
            this.elements.forEach(e => this.setVisible(e, 'hidden'));
            var found = this.elements.find(e => e.getAttribute('id') == id);
            this.setVisible(found, 'visible');

            this.canvas.width = this.imgWidth;
            this.canvas.height = this.imgHeight;

            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            var svg_xml = (new XMLSerializer()).serializeToString(this.svgRootElement);

            var img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);

                var boundingInPx = this.getBoundingBoxInPx();
                var w = boundingInPx[2] - boundingInPx[0] + 1;
                var h = boundingInPx[3] - boundingInPx[1] + 1;
                this.canvas2.width = w;
                this.canvas2.height = h;
                var ctx2 = this.canvas2.getContext('2d');
                ctx2.drawImage(img, boundingInPx[0], boundingInPx[1], w, h, 0, 0, w, h);
                done();
            }
            img.src = "data:image/svg+xml;base64," + btoa(svg_xml);
        }

        private setVisible(elt: SVGElement, v: string) {

            var style = {};
            var styleStr = elt.getAttribute('style');
            if (styleStr == null)
                styleStr = '';

            var newStyle = styleAttribute.setField(styleStr, 'visibility', v);
            elt.setAttribute('style', newStyle);
        }

        getColor(): number[] {
            var found = this.elements.find(e => e.getAttribute('id') == this.currentId);
            var style = found.getAttribute('style');
            var i = style.indexOf('fill:');
            if (i >= 0) {
                var col = style.substring(i + 5, i + 5 + 7);
                var rgb = this.hexToRgb(col);
                if (rgb != null)
                    return rgb;
            }
            return [0.5, 0.5, 0.5];
        }

        realSize = vec2.create();
        setRealSizeToFit(realSizeContainer: Float32Array) {
            var scaleX = (realSizeContainer[0]) / this.imgWidth;
            var scaleY = (realSizeContainer[1]) / this.imgHeight;
            var scale = Math.min(scaleX, scaleY);
            this.realSize[0] = this.imgWidth * scale;
            this.realSize[1] = this.imgHeight * scale;
        }

        getBoundingRealSize(): number[] {
            var bounds = this.getBoundingBoxInPx();
            var pxWidth = bounds[2] - bounds[0];
            var pxHeight = bounds[3] - bounds[1];
            return [pxWidth / this.imgWidth * this.realSize[0], pxHeight / this.imgHeight * this.realSize[1]];
        }


        getRealCenter(): number[] {
            var bounds = this.getBoundingBoxInPx();
            var cx = 0.5 * bounds[2] + 0.5 * bounds[0];
            var cy = 0.5 * bounds[3] + 0.5 * bounds[1];
            return [(cx - this.imgWidth / 2) / this.imgWidth * this.realSize[0],
            -1 * ((cy - this.imgHeight / 2) / this.imgHeight) * this.realSize[1]];
        }

        getBoundingBoxInPx(): number[] {
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
        }


        private findLayers(elt: Element): SVGElement[] {
            var foundList: SVGElement[] = [];
            for (var i = 0; i < elt.childNodes.length; ++i) {
                var child = elt.childNodes[i];
                if (child instanceof SVGGElement) {
                    foundList.push(child);
                    //console.log('layer: ' + child.getAttribute('id'));
                }
            }
            return foundList;
        }

        private getAllElementsInLayer(elt: Element, foundList: SVGElement[]) {
            for (var i = 0; i < elt.childNodes.length; ++i) {
                var child = elt.childNodes[i];
                if (child instanceof SVGElement) {
                    foundList.push(child);
                    //console.log('drawable: ' + child.getAttribute('id'));
                }
            }
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
}