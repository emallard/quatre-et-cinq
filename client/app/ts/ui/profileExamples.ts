module qec
{

    export class profileExample
    {
        profileView:profileView = inject(profileView);
        editor:editor = inject(editor);
        
        points:number[][] = [];
        canvas = document.createElement('canvas');
        bsplineDrawer:bsplineDrawer = inject(bsplineDrawer); 
        

        setContainer(elt:HTMLElement)
        {
            elt.appendChild(this.canvas);
        }

        setPoints(points:number[][])
        {
            this.points = points;

            this.canvas.width = 30;
            this.canvas.height = 60;

            var canvasPoints = [];
            for (var i=0 ; i < points.length; ++i)
            {
                var px = this.points[i][0];
                var py = this.points[i][1];
                
                canvasPoints.push([px*this.canvas.width, (1-py)*this.canvas.height]);
            }
            var ctx = this.canvas.getContext('2d');
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.fillStyle = "rgba(0,0,0,1)"; 
            //if (l.profileSmooth)
                this.bsplineDrawer.drawSpline(canvasPoints, this.canvas);
            //else
            //    this.lineDrawer.drawLine(this.points, this.canvas);
            
        }

        click()
        {
            var o = this.editor.workspace.editorObjects[this.editor.workspace.selectedIndex];
            var bounds = o.profileBounds;
            var w = bounds[2] - bounds[0];
            var h = bounds[3] - bounds[1];

            var newPoints = [];
            for (var j=0; j < this.points.length; ++j)
            {
                var rx = this.points[j][0];
                var ry = this.points[j][1];
                
                var x = (1-rx)*bounds[0] + rx*bounds[2];
                var y = (1-ry)*bounds[1] + ry*bounds[3];
                newPoints.push([x, y]);
            }
            o.setProfilePoints(newPoints);
            this.profileView.refresh();
            this.editor.renderer.updateFloatTextures(o.sd);
            this.editor.setRenderFlag();
        }
    }

    export class profileExamples
    {
        examples: profileExample[] = [];
        createExample:()=>profileExample = injectFunc(profileExample);
        afterInject()
        {
            this.push( [[0,0], [0.5,0], [1,0], [1,0.2], [1,0.4], [1,0.6], [1,0.8], [1,1], [0.5,1], [0,1]]);
            this.push( [[0,0], [1,0], [1,1], [0,1]]);
            this.push( [[0,0], [1,0], [1, 0.4], [0.5,0.4], [0.5, 0.6], [1,0.6], [1,1], [0,1]]);
            this.push( [[0,0], [1,0], [1, 0.5], [0.5,0.5], [0.5 ,1], [0,1]]);
            this.push( [[0,0], [1,0], [1, 1], [0.5,1], [0.5 ,0.5], [0,0.5]]);
            this.push( [[0.5,0], [1,0], [1, 1], [0.5,1]]);
        }

        push(p:number[][])
        {
            var ex = this.createExample();
            ex.setPoints(p);
            this.examples.push(ex);
        }


        visible = ko.observable(true);
        toggleVisible()
        {
            this.visible(!this.visible());
        }
    }
}