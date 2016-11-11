module qec {
    

    export class editorObject
    {
        //canvas = document.createElement('canvas');

        sd = new sdFields();
       
        top = new distanceFieldCanvas();
        profile = new distanceFieldCanvas();
        
        diffuseColor = vec3.create();
        inverseTransform = mat4.create();

        bsplineDrawer = new bsplineDrawer();
        lineDrawer = new lineDrawer();

        profilePoints:number[][] = [];
        profileBounds = vec4.create();
        tmpProfileCanvas = document.createElement('canvas');

        profileSmooth = true;

        constructor()
        {
            // default profile
            vec4.set(this.profileBounds, -0.2, 0, 0, 0.5);
            this.profilePoints = [[-0.2, 0], [-0.1, 0], [0, 0], [0, 0.1], [0, 0.2], [0, 0.3], [0, 0.4], [0, 0.5], [-0.1, 0.5], [-0.2, 0.5]];
        
            //this.profile.canvas.style.border = 'solid 1px red';
            //$('.debug').append(this.profile.canvas);    
        }

        setColor(rgb:number[])
        {
            vec3.set(this.diffuseColor, rgb[0], rgb[1], rgb[2]);
            this.sd.material.setDiffuse(rgb[0], rgb[1], rgb[2]);
        }

        setSelected(b:boolean)
        {
            if (b)
                this.sd.material.setDiffuse(1, 0, 0);
            else
                this.sd.material.setDiffuse(this.diffuseColor[0], this.diffuseColor[1], this.diffuseColor[2]);    
        }

        setProfileHeight(height:number)
        {
            var newBounds = vec4.fromValues(-this.top.distanceField.maxDepth, 0, 0, height);
            //var newBounds = vec4.fromValues(this.profileBounds[0],this.profileBounds[1],this.profileBounds[2], height);
  
            this.scaleProfilePoints(newBounds);
        }

        scaleProfilePoints(newBounds:Float32Array)
        {
            //console.log('new bounds : ' + vec4.str(newBounds));
            for (var i=0; i < this.profilePoints.length; ++i)
            {
                var dx = (this.profilePoints[i][0] - this.profileBounds[0]) / (this.profileBounds[2] - this.profileBounds[0]); 
                var dy = (this.profilePoints[i][1] - this.profileBounds[1]) / (this.profileBounds[3] - this.profileBounds[1]);

                this.profilePoints[i][0] = newBounds[0] + dx * (newBounds[2] - newBounds[0]);
                this.profilePoints[i][1] = newBounds[1] + dy * (newBounds[3] - newBounds[1]);
            }

            vec4.copy(this.profileBounds, newBounds);
            this.setProfilePoints(this.profilePoints);
        }

        setProfilePoints(points: number[][])
        {
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
                canvasWidth = canvasHeight * boundW/boundH;
            else
                canvasHeight = canvasWidth * boundH / boundW;

            this.tmpProfileCanvas.width = canvasWidth;
            this.tmpProfileCanvas.height = canvasHeight;
            var ctx = this.tmpProfileCanvas.getContext('2d');
            ctx.clearRect(0,0,this.tmpProfileCanvas.width,this.tmpProfileCanvas.height);

            // convert profile points to pixels
            var canvasPoints = [];
            var profileBounds = this.profileBounds;
            for (var j=0; j < this.profilePoints.length; ++j)
            {
                var x = this.profilePoints[j][0];
                var y = this.profilePoints[j][1];
                
                var px = (x - profileBounds[0]) /  (profileBounds[2] - profileBounds[0]) * this.tmpProfileCanvas.width;
                var py = this.tmpProfileCanvas.height - (y - profileBounds[1]) /  (profileBounds[3] - profileBounds[1]) * this.tmpProfileCanvas.height;
                
                canvasPoints.push([px, py]);
            }

            // draw bspline
            if (this.profileSmooth)
                this.bsplineDrawer.drawSpline(canvasPoints, this.tmpProfileCanvas);
            else
                this.lineDrawer.drawLine(canvasPoints, this.tmpProfileCanvas);

            // draw for distance field
            this.profile.drawUserCanvasForProfile(this.tmpProfileCanvas, this.profileBounds, 0.1 );
            this.profile.update();
            
        }

        setTopSrc(src:string, bounds:Float32Array, done:()=>void)
        {
            var img = new Image();
            img.onload = () =>
            {
                this.setTopImg2(img, bounds);
                done();
            };
            img.src = src;
        }

        setTopImg2(img:HTMLCanvasElement | HTMLImageElement, bounds:Float32Array)
        {
            this.top.drawUserCanvasForTop(img, bounds, 0.1);
            this.top.update();
            
            //$('.debug').append(this.top.canvas);
            //this.profile.debugInfoInCanvas();
            //$(".debug")[0].appendChild(this.profile.canvas);
        }

        updateSignedDistance()
        {
            this.sd.init(this.top.floatTexture, this.top.totalBounds, this.profile.floatTexture, this.profile.totalBounds);
            mat4.copy(this.sd.inverseTransform, this.inverseTransform);
        }
    }

}