module qec {

    export class distanceField
    {
        N:number;
        M:number;
        L:Uint16Array;
        public D:Float32Array;

        halfSize = vec2.create();
        maxDepth:number;
        
        xy = new Uint32Array(2);

        initCommon(fieldWidth:number, fieldHeight:number, halfWidth:number, halfHeight:number) {
            this.M = fieldWidth;
            this.N = fieldHeight;
            this.halfSize[0] = halfWidth;
            this.halfSize[1] = halfHeight;
            this.L = new Uint32Array(this.M * this.N * 2);
            this.D = new Float32Array(this.M * this.N);
        }

        initDisc(fieldSize:number, radius:number, halfWidth:number, halfHeight:number) {
            this.initCommon(fieldSize, fieldSize, halfWidth, halfHeight);
            for (var i=0; i < this.M; ++i)
            {
                for (var j=0; j < this.N; ++j)
                {
                    var q = (j*this.M + i);
                    var x = this.halfSize[0] * (2 * i/this.M - 1);
                    var y = this.halfSize[1] * (2 * j/this.N - 1);
                    this.D[q] = Math.sqrt(x*x+y*y) - radius;
                }
            }
        }

        initSquare(fieldSize:number, squareHalfSize:number, halfWidth:number, halfHeight:number) {
            this.initCommon(fieldSize, fieldSize, halfWidth, halfHeight);
            for (var i=0; i < this.M; ++i)
            {
                for (var j=0; j < this.N; ++j)
                {
                    var q = (j*this.M + i);
                    var x = this.halfSize[0] * (2 * i/this.M - 1);
                    var y = this.halfSize[1] * (2 * j/this.N - 1);

                    var dx = Math.max(-squareHalfSize - x, 0, x - squareHalfSize);
                    var dy = Math.max(-squareHalfSize - y, 0, y - squareHalfSize);
                    
                    if (dx+dy > 0)
                        this.D[q] = Math.sqrt(dx*dx+dy*dy);
                    else
                    {
                        dx = Math.min(x - (-squareHalfSize), squareHalfSize - x);
                        dy = Math.min(y - (-squareHalfSize), squareHalfSize - y);
                        this.D[q] = -Math.min(dx, dy);
                    }

                }
            }
        }

        initFromImageData(data:any, dataWidth:number, dataHeight:number, halfWidth:number, halfHeight:number)
        {
            this.initCommon(dataWidth, dataHeight, halfWidth, halfHeight);
            for (var i=0; i < this.M; ++i)
            {
                for (var j=0; j < this.N; ++j)
                {
                    //if (data[4 * (j * this.M + i)] > 0)
                    if (this.isBorderImageData(data, dataWidth, dataHeight, i, j))
                    {
                        this.setL(i,j,0,0)
                    }
                    else
                    {
                        this.setL(i,j,1024,1024);
                    }
                }
            }


            for (var j=1; j < this.N; ++j) {
                //console.log('1st pass: ' + j);
                for (var i = 0; i < this.M; ++i) {
                    this.setIfDistMin(i,j,0,-1,0,1);
                }
                for (var i = 1; i < this.M; ++i) {
                    this.setIfDistMin(i,j,-1,0,1,0);
                }
                for (var i = this.M-2; i >=0; --i) {
                    this.setIfDistMin(i,j,1,0,1,0);
                }
            }

            for (var j=this.N-2; j>=0; --j) {
                //console.log('2nd pass: ' + j);
                for (var i = 0; i < this.M; ++i) {
                    this.setIfDistMin(i,j,0, 1,0,1);
                }
                for (var i = 1; i < this.M; ++i) {
                    this.setIfDistMin(i,j,-1,0,1,0);
                }
                for (var i = this.M-2; i >=0; --i) {
                    this.setIfDistMin(i,j,1,0,1,0);
                }
            }

            // Convert Distances:
            for (var q=0; q < this.M*this.N; ++q)
            {
                this.D[q] *= 2*this.halfSize[0]/this.M;
            }
        }

        isPixelSet(data:any, width:number, height:number, i:number, j:number):boolean
        {
            var q = 4 * ((height-1 - j) * width + i);
            return (data[q] != 255 || data[q+1] != 255 || data[q+2] != 255) && data[q+3] != 0;
        }

        isBorderImageData(data:any, width:number, height:number, i:number, j:number):boolean
        {
            if (!this.isPixelSet(data, width, height, i,j))
            {
                return false;
            }

            for (var di = -1; di <= 1; ++di)
            {
                for (var dj = -1; dj <= 1; ++dj)
                {
                    if (di+i >= 0 && di+i < width
                    && dj+j >= 0 && dj+j < height)
                    {
                        if (!this.isPixelSet(data, width, height, di+i, dj+j))
                        {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        setL(i:number, j:number, x:number, y:number)
        {
            var q = (j*this.M + i);
            this.L[2*q] = x;
            this.L[2*q+1] = y;
            this.D[q] = Math.sqrt(x*x+y*y);
        }

        getD(i:number, j:number)
        {
            var q = (j*this.M + i);
            return this.D[q];
        }

        distL(i, j, dx, dy)
        {
            var q = (j*this.M + i);
            var x =  this.L[2*q];
            var y = this.L[2*q+1];
            return Math.sqrt((x+dx)*(x+dx) + (y+dy)*(y+dy));
        }

        setIfDistMin(i:number, j:number, di:number, dj:number, dx:number, dy:number)
        {
            //var l1 = this.distL(i, j,       0, 0);
            var l1 = this.D[j*this.M + i];
            var l2 = this.distL(i+di, j+dj, dx, dy);
            if (l2 < l1)
            {
                //console.log("<");
                var q = ((j+dj)*this.M + (i+di));
                var x =  this.L[2*q];
                var y = this.L[2*q+1];
                this.setL(i,j,x+dx, y+dy);
            }
        }

        setSignFromImageData(data:any, width:number, height:number)
        {
            this.maxDepth = 0;
            for (var i = 0; i < this.M; ++i)
            {
                for (var j = 0; j < this.N; ++j)
                {
                    if (this.isPixelSet(data, width, height, i, j))
                    //if (data[4 * ((this.N-1-j) * this.M + i)] == 0)
                    {
                        var q = j*this.M + i;
                        var d = this.D[q];
                        if (d > this.maxDepth)
                            this.maxDepth = d;
                        this.D[q] = -d;
                    }
                }
            }
        }

        fillImageData(data:any, scale:number)
        {
            for (var i=0; i<this.M; ++i)
            {
                //console.log('i' + i);
                for (var j=0; j<this.N; ++j)
                {
                    
                    var q = 4 * ((this.N-1 - j) * this.M + i);
                    var d = this.D[j * this.M + i] * scale;
                    data[q] = 0;
                    data[q+1]= 0;
                    data[q+2]= 0;
                    data[q+3]= 255;

                    if (d > 0)
                    {
                        data[q] = d;
                    }
                    else
                    {
                        data[q+1] = -d;
                    }
                    
                }
            }
        }
    }
}

