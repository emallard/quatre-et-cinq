module qec {


    export class cameraController implements iController {

        editor:editor = inject(editor);
        
        minZoom = 0;
        maxZoom = 100;

        // left right
        minTheta = -Math.PI; // radians
        maxTheta = Math.PI; // radians

        // top - bottom
        minPhi = -Math.PI; // radians
        maxPhi = Math.PI; // radians
        

        // current position in spherical coordinates
        spherical = new THREE.Spherical();
        sphericalDelta = new THREE.Spherical();

        rotateStart = vec2.create();
        rotateEnd = vec2.create();

        isMouseDown = false; 
        updateFlag = false;
        button = 1;

        constructor()
        {
            this.spherical.radius = 3;
            this.spherical.theta = -Math.PI/2;
            this.spherical.phi = Math.PI*2/5;
        }

        setButton(button:number)
        {
            this.button = button;
        }

        set()
        {

        }

        unset()
        {

        }

        rotateLeft( angle ) {
            this.sphericalDelta.theta = -angle;
            // restrict theta to be between desired limits
			//this.sphericalDelta.theta = Math.max( this.minTheta, Math.min( this.maxTheta, this.sphericalDelta.theta ) );

        }

        rotateUp( angle ) {
            this.sphericalDelta.phi = angle;
            // restrict phi to be between desired limits
			//this.sphericalDelta.phi = Math.max( this.minPhi, Math.min( this.maxPhi, this.sphericalDelta.phi ) );
        }
        

        updateLoop()
        {
            if (this.updateFlag )
            {
                this.updateFlag = false;
                this.updateCamera();
            }
        }

        updateCamera() 
        {
            var theta = this.spherical.theta + this.sphericalDelta.theta;
			var phi = this.spherical.phi + this.sphericalDelta.phi;
            var radius = this.spherical.radius;

            //console.log('angles ' + s.theta + ', ' + s.phi)
            var sinTheta = Math.sin( theta );
            var x = radius * Math.cos( phi ) * Math.cos( theta );
            var y = radius * Math.cos( phi ) * Math.sin( theta );
            var z = radius * Math.sin( phi );
            
            //console.log(x, y, z);
            this.editor.getCamera().setPosition(vec3.fromValues(x, y, z));
            this.editor.setRenderFlag();
        }

        setFromVector3( p:Float32Array ) 
        {
            /*
            this.radius = vec3.length();

            if ( this.radius === 0 ) {

                this.theta = 0;
                this.phi = 0;

            } else 
            */
            {
                var radius = 2;
                this.spherical.theta = Math.atan2( vec3[0], vec3[1] ); // equator angle around y-up axis
                this.spherical.phi = Math.asin( THREE.Math.clamp( p[2] / radius, - 1, 1 ) ); // polar angle
            }
            
        };

        onMouseMove(e:MouseEvent)
        {
            
            if (this.isMouseDown)
            {
                this.updateFlag = true;

                vec2.set(this.rotateEnd, e.offsetX, e.offsetY );
                var dx = this.rotateEnd[0] - this.rotateStart[0];
                var dy = this.rotateEnd[1] - this.rotateStart[1];

                // rotating across whole screen goes 360 degrees around
                this.rotateLeft( 2 * Math.PI * dx / 1000); /*rotateDelta.x / element.clientWidth * scope.rotateSpeed );*/

                // rotating up and down along whole screen attempts to go 360, but limited to 180
                this.rotateUp( 2 * Math.PI * dy / 1000);// / element.clientHeight * scope.rotateSpeed );

                //this.update();
            }
        }

        onMouseDown(e:MouseEvent)
        {
            if (e.button == this.button)
            {   
                this.spherical.theta += this.sphericalDelta.theta;
			    this.spherical.phi += this.sphericalDelta.phi;

                vec2.set(this.rotateStart, e.offsetX, e.offsetY);
                vec2.set(this.rotateEnd, e.offsetX, e.offsetY);
                this.sphericalDelta.theta = 0;
                this.sphericalDelta.phi = 0;

                this.isMouseDown = true;
            }

            // wheel
            if (e.button == this.button)
            {
            }
        }

        onMouseUp(e:MouseEvent)
        {
            this.isMouseDown = false;
        }

        onMouseWheel(e:WheelEvent)
        {
            var orig = (<any> e).originalEvent;
            var d = Math.max(-1, Math.min(1, (orig.deltaY)));
            //console.log('mousewheel', orig.deltaY);

            this.spherical.radius *= 1 - d*0.1;
            this.updateFlag = true;
        }
    }
}